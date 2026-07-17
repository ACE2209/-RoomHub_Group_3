import mongoose from 'mongoose';
import BoardingHouse from '../models/boardingHouse.js';
import BoardingHouseType from '../models/boardingHouseType.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import multer from 'multer';
import { Account, Staff } from '../models/account.js';
import Review from '../models/review.js';
import Room from '../models/room.js';
import RoomType from '../models/roomType.js';
import DepositRoom from '../models/depositRoom.js';
import Appointment from '../models/appointment.js';
import PaymentBill from '../models/paymentBill.js';
import paginate from '../utils/pagination.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const VIETNAMESE_CHAR_GROUPS = {
  a: 'aàáạảãâầấậẩẫăằắặẳẵ',
  d: 'dđ',
  e: 'eèéẹẻẽêềếệểễ',
  i: 'iìíịỉĩ',
  o: 'oòóọỏõôồốộổỗơờớợởỡ',
  u: 'uùúụủũưừứựửữ',
  y: 'yỳýỵỷỹ',
};

const buildTextRegex = (value) => {
  const pattern = String(value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split('')
    .map((char) => {
      if (/\s/.test(char)) return '\\s+';

      const lowerChar = char.toLowerCase();
      const group = VIETNAMESE_CHAR_GROUPS[lowerChar];

      if (!group) return escapeRegex(char);

      return `[${group}${group.toUpperCase()}]`;
    })
    .join('');

  return new RegExp(pattern, 'i');
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

class BoardingHouseController {
  getUserId(req) {
    return req.user?.userId || req.user?._id;
  }

  buildOwnFilter(req) {
    const userId = this.getUserId(req);
    const objectUserId = new mongoose.Types.ObjectId(userId);

    if (req.user?.role === 'staff') {
      return { staffId: objectUserId };
    }

    return {
      ownerId: objectUserId,
    };
  }

  async resolveAssignableStaffId(staffId, ownerId) {
    if (!staffId) return null;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      const error = new Error('Nhân viên được gán không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const staff = await Staff.findOne({
      _id: staffId,
      createdBy: ownerId,
      deleted: { $ne: true },
    }).select('_id');

    if (!staff) {
      const error = new Error('Nhân viên được gán không thuộc chủ trọ này');
      error.statusCode = 400;
      throw error;
    }

    return staff._id;
  }

  async getDeleteBlockers(boardingHouseId) {
    const roomIds = await Room.find({ boardingHouseId }).distinct('_id');

    const [
      roomTypeCount,
      roomCount,
      activeDepositCount,
      activeAppointmentCount,
      pendingBillCount,
    ] = await Promise.all([
      RoomType.countDocuments({ boardingHouseId }),
      Room.countDocuments({ boardingHouseId }),
      roomIds.length
        ? DepositRoom.countDocuments({
            roomId: { $in: roomIds },
            status: { $in: ['pending', 'accepted', 'confirmed'] },
          })
        : 0,
      roomIds.length
        ? Appointment.countDocuments({
            roomId: { $in: roomIds },
            status: { $in: ['pending', 'accepted'] },
          })
        : 0,
      roomIds.length
        ? PaymentBill.countDocuments({
            roomId: { $in: roomIds },
            status: { $in: ['Pending'] },
          })
        : 0,
    ]);

    const blockers = [];
    if (roomTypeCount) blockers.push(`${roomTypeCount} loại phòng`);
    if (roomCount) blockers.push(`${roomCount} phòng`);
    if (activeDepositCount) blockers.push(`${activeDepositCount} đơn cọc đang hoạt động`);
    if (activeAppointmentCount) blockers.push(`${activeAppointmentCount} lịch hẹn đang hoạt động`);
    if (pendingBillCount) blockers.push(`${pendingBillCount} hóa đơn đang chờ thanh toán`);

    return blockers;
  }

  mapUploadedImages(files = [], existingImages = []) {
    const uploadedImages = files.map((file, index) => ({
      imageUrl: file.path,
      publicId: file.filename || file.public_id || '',
      isPrimary: existingImages.length === 0 && index === 0,
    }));

    return [...existingImages, ...uploadedImages].map((image, index) => ({
      imageUrl: image.imageUrl,
      publicId: image.publicId || '',
      isPrimary: index === 0 ? true : Boolean(image.isPrimary),
    }));
  }

  normalizeBoardingHousePayload(body, files = [], currentImages = []) {
    const parseNumber = (value) => {
      if (value === undefined || value === null || value === '') return value;
      const numberValue = Number(value);
      return Number.isNaN(numberValue) ? value : numberValue;
    };

    let keptImages = currentImages;
    const rawImagePayload = body.boardingHouse;

    if (typeof rawImagePayload === 'string' && rawImagePayload.trim().startsWith('[')) {
      try {
        keptImages = JSON.parse(rawImagePayload);
      } catch (error) {
        keptImages = currentImages;
      }
    }

    return {
      boardingHouseType: body.boardingHouseType,
      name: body.name,
      staffId: body.staffId || null,
      description: body.description || '',
      priceRange: parseNumber(body.priceRange),
      totalRooms: parseNumber(body.totalRooms || 0),
      availableRooms: parseNumber(body.availableRooms || 0),
      electricityPrice: parseNumber(body.electricityPrice),
      waterPrice: parseNumber(body.waterPrice),
      address: {
        province: {
          name: body.address?.province?.name || body['address[province][name]'],
          name_en: body.address?.province?.name_en || body['address[province][name_en]'],
        },
        district: {
          name: body.address?.district?.name || body['address[district][name]'],
          name_en: body.address?.district?.name_en || body['address[district][name_en]'],
        },
        ward: {
          name: body.address?.ward?.name || body['address[ward][name]'],
          name_en: body.address?.ward?.name_en || body['address[ward][name_en]'],
        },
        detail: body.address?.detail || body['address[detail]'] || '',
      },
      location: {
        lat: parseNumber(body.location?.lat ?? body['location[lat]']),
        lon: parseNumber(body.location?.lon ?? body['location[lon]']),
      },
      images: this.mapUploadedImages(files, keptImages),
    };
  }

  getBoardingHousePayloadError(payload) {
    const requiredFields = [
      payload.boardingHouseType,
      payload.name,
      payload.priceRange,
      payload.electricityPrice,
      payload.waterPrice,
      payload.address?.province?.name,
      payload.address?.province?.name_en,
      payload.address?.district?.name,
      payload.address?.district?.name_en,
      payload.address?.ward?.name,
      payload.address?.ward?.name_en,
      payload.location?.lat,
      payload.location?.lon,
    ];

    const hasAllRequiredFields = requiredFields.every(
      (value) => value !== undefined && value !== null && value !== ''
    );

    if (!hasAllRequiredFields) {
      return 'Vui lòng nhập đầy đủ thông tin nhà trọ bắt buộc';
    }

    if (!mongoose.Types.ObjectId.isValid(payload.boardingHouseType)) {
      return 'Loại nhà trọ không hợp lệ';
    }

    const nonNegativeFields = [
      ['priceRange', payload.priceRange],
      ['totalRooms', payload.totalRooms],
      ['availableRooms', payload.availableRooms],
      ['electricityPrice', payload.electricityPrice],
      ['waterPrice', payload.waterPrice],
    ];

    for (const [field, value] of nonNegativeFields) {
      if (!Number.isFinite(value) || value < 0) {
        return `${field} phải là số không âm`;
      }
    }

    if (payload.availableRooms > payload.totalRooms) {
      return 'Số phòng còn trống không được lớn hơn tổng số phòng';
    }

    const { lat, lon } = payload.location || {};
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return 'Vĩ độ phải nằm trong khoảng -90 đến 90';
    }

    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      return 'Kinh độ phải nằm trong khoảng -180 đến 180';
    }

    return '';
  }

  async getAllBoardingHouses(req, res) {
    try {
      req.query.page = req.query.page || '1';
      req.query.limit = req.query.limit || '10';

      const result = await paginate(
        BoardingHouse,
        {
          defaultPage: 1,
          defaultLimit: 10,
          sortField: 'createdAt',
          filter: {},
          populate: [
            {
              path: 'boardingHouseType',
              select: 'name codeName',
            },
            {
              path: 'ownerId',
              select: 'username fullname email phoneNumber avatarImage role',
            },
          ],
        },
        req
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching boarding houses:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch boarding houses',
        error: error.message,
      });
    }
  }


  async getBoardingHouseDetails(req, res, next) {
    try {
      const { id } = req.params;
      const boardingHouse = await BoardingHouse.findById(id)
        .populate('boardingHouseType', 'name')
        .populate('ownerId', 'email username fullname')
        .exec();

      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house not found',
        });
      }
      return res.status(200).json({
        success: true,
        data: boardingHouse,
      });
    } catch (error) {
      console.error('Error fetching boarding house details:', error);
      return res.status(500).json({
        success: false,
        message:
          'Failed to fetch boarding house details. Please try again later.',
        error: error.message,
      });
    }
  }

  async filterBoardingHouses(req, res) {
    try {
      const {
        boardingHouseType,
        province,
        district,
        ward,
        name,
        rating,
        ratings,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = req.query;

      req.query.page = String(parsePositiveInt(page, 1));
      req.query.limit = String(parsePositiveInt(limit, 10));

      const filter = {};

      if (boardingHouseType) {
        if (!mongoose.Types.ObjectId.isValid(boardingHouseType)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid boardingHouseType',
          });
        }

        filter.boardingHouseType = new mongoose.Types.ObjectId(boardingHouseType);
      }

      const ratingQuery = ratings || rating;
      if (ratingQuery) {
        const ratingArray = (Array.isArray(ratingQuery) ? ratingQuery : String(ratingQuery).split(','))
          .flatMap((item) => String(item).split(','))
          .map(Number)
          .filter((item) => !Number.isNaN(item));

        const validRating = ratingArray.length > 0 && ratingArray.every(
          (item) => item >= 1 && item <= 5
        );

        if (!validRating) {
          return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5',
          });
        }

        filter.rating = { $in: ratingArray };
      }

      if (name?.trim()) {
        filter.name = buildTextRegex(name);
      }

      if (province?.trim()) {
        filter['address.province.name'] = buildTextRegex(province);
      }

      if (district?.trim()) {
        filter['address.district.name'] = buildTextRegex(district);
      }

      if (ward?.trim()) {
        filter['address.ward.name'] = buildTextRegex(ward);
      }

      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid startDate',
          });
        }

        if (end && Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid endDate',
          });
        }

        filter.createdAt = {};

        if (start) {
          filter.createdAt.$gte = start;
        }

        if (end) {
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }

      const result = await paginate(
        BoardingHouse,
        {
          filter,
          defaultPage: 1,
          defaultLimit: 10,
          sortField: 'createdAt',
          populate: [
            {
              path: 'boardingHouseType',
              select: 'name codeName',
            },
            {
              path: 'ownerId',
              select: 'username fullname email phoneNumber avatarImage role',
            },
          ],
        },
        req
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error filtering boarding houses:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to filter boarding houses',
        error: error.message,
      });
    }
  }

  async deleteBoardingHouse(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid boarding house id',
        });
      }

      const boardingHouse = await BoardingHouse.findOneWithDeleted({ _id: id });

      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house not found',
        });
      }

      if (boardingHouse.deleted) {
        return res.status(400).json({
          success: false,
          message: 'Boarding house already deleted',
        });
      }

      await boardingHouse.delete(req.user?.userId);

      return res.status(200).json({
        success: true,
        message: 'Boarding house deleted successfully',
        data: boardingHouse,
      });
    } catch (error) {
      console.error('Error deleting boarding house:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to delete boarding house',
        error: error.message,
      });
    }
  }

  async getAllBoardingHousesForGuest(req, res) {
    try {
      req.query.page = String(parsePositiveInt(req.query.page, 1));
      req.query.limit = String(parsePositiveInt(req.query.limit, 10));

      const result = await paginate(
        BoardingHouse,
        {
          filter: { deleted: false },
          defaultPage: 1,
          defaultLimit: 10,
          sortField: 'createdAt',
          sortOrder: 'desc',
          populate: [
            { path: 'boardingHouseType', select: 'name codeName' },
            { path: 'ownerId', select: 'username fullname email phoneNumber avatarImage role' },
          ],
        },
        req
      );

      return res.status(200).json({
        success: true,
        message: 'Boarding houses fetched successfully',
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch boarding houses',
        error: error.message,
      });
    }
  }

  async getBhByArea(req, res) {
    try {
      const {
        name,
        province,
        district,
        ward,
        priceRange,
        boardingHouseType,
        rating,
        ratingRange,
        page = 1,
        limit = 10,
      } = req.query;

      const currentPage = parsePositiveInt(page, 1);
      const pageLimit = Math.min(parsePositiveInt(limit, 10), 100);

      const filter = {
        totalRooms: { $gt: 0 },
        deleted: { $ne: true },
      };

      if (name?.trim()) {
        const keywordRegex = buildTextRegex(name);
        filter.$or = [
          { name: keywordRegex },
          { 'address.province.name': keywordRegex },
          { 'address.district.name': keywordRegex },
          { 'address.ward.name': keywordRegex },
          { 'address.detail': keywordRegex },
        ];
      }

      if (province?.trim()) {
        filter['address.province.name'] = buildTextRegex(province);
      }

      if (district?.trim()) {
        filter['address.district.name'] = buildTextRegex(district);
      }

      if (ward?.trim()) {
        filter['address.ward.name'] = buildTextRegex(ward);
      }

      if (priceRange) {
        const rangeValues = (Array.isArray(priceRange) ? priceRange : String(priceRange).split(','))
          .flatMap((value) => String(value).split(','))
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value));

        if (rangeValues.length !== 2 || rangeValues[0] < 0 || rangeValues[1] < rangeValues[0]) {
          return res.status(400).json({
            success: false,
            message: 'priceRange must be in "min,max" format',
          });
        }

        filter.priceRange = {
          $gte: rangeValues[0],
          $lte: rangeValues[1],
        };
      }

      if (boardingHouseType) {
        if (!mongoose.Types.ObjectId.isValid(boardingHouseType)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid boardingHouseType',
          });
        }

        filter.boardingHouseType = new mongoose.Types.ObjectId(boardingHouseType);
      }

      if (ratingRange) {
        const rangeValues = (Array.isArray(ratingRange) ? ratingRange : String(ratingRange).split(','))
          .flatMap((value) => String(value).split(','))
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value));

        if (rangeValues.length !== 2 || rangeValues[0] < 1 || rangeValues[1] > 5 || rangeValues[1] < rangeValues[0]) {
          return res.status(400).json({
            success: false,
            message: 'ratingRange must be in "min,max" format from 1 to 5',
          });
        }

        filter.rating = {
          $gte: rangeValues[0],
          $lte: rangeValues[1],
        };
      } else if (rating) {
        const ratings = (Array.isArray(rating) ? rating : String(rating).split(','))
          .flatMap((value) => String(value).split(','))
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value));

        if (!ratings.length || ratings.some((value) => value < 1 || value > 5)) {
          return res.status(400).json({
            success: false,
            message: 'Rating must be a list of numbers from 1 to 5',
          });
        }

        filter.rating = {
          $gte: Math.min(...ratings),
          $lte: Math.max(...ratings),
        };
      }

      const [totalDocs, data] = await Promise.all([
        BoardingHouse.countDocuments(filter),
        BoardingHouse.find(filter)
          .sort({ createdAt: -1 })
          .skip((currentPage - 1) * pageLimit)
          .limit(pageLimit)
          .populate([
            { path: 'boardingHouseType', select: 'name codeName' },
            { path: 'ownerId', select: 'username fullname email phoneNumber avatarImage role' },
          ])
          .lean(),
      ]);

      const totalPages = Math.ceil(totalDocs / pageLimit);

      return res.status(200).json({
        success: true,
        data,
        totalDocs,
        pagination: {
          currentPage,
          totalPages,
          totalItems: totalDocs,
          limit: pageLimit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      });
    } catch (error) {
      console.error('Error filtering boarding houses for guest:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to filter boarding houses',
        error: error.message,
      });
    }
  }

  async getNewestBH(req, res) {
    try {
      const result = await paginate(
        BoardingHouse,
        {
          filter: { deleted: false },
          defaultPage: 1,
          defaultLimit: 10,
          sortField: 'createdAt',
          sortOrder: 'desc',
          populate: [
            { path: 'boardingHouseType', select: 'name codeName' },
            { path: 'ownerId', select: 'username fullname email phoneNumber avatarImage role' },
          ],
        },
        req
      );

      return res.status(200).json({
        success: true,
        message: 'Newest boarding houses fetched successfully',
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch newest boarding houses',
        error: error.message,
      });
    }
  }

  async getHighRatingBH(req, res) {
    try {
      const result = await paginate(
        BoardingHouse,
        {
          filter: { deleted: false, rating: { $gte: 4 } },
          defaultPage: 1,
          defaultLimit: 10,
          sortField: 'rating',
          sortOrder: 'desc',
          populate: [
            { path: 'boardingHouseType', select: 'name codeName' },
            { path: 'ownerId', select: 'username fullname email phoneNumber avatarImage role' },
          ],
        },
        req
      );

      return res.status(200).json({
        success: true,
        message: 'High rating boarding houses fetched successfully',
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch high rating boarding houses',
        error: error.message,
      });
    }
  }

  async getBoardingHouseDetailInUser(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid boarding house id' });
      }

      const boardingHouse = await BoardingHouse.findById(id)
        .populate('boardingHouseType')
        .populate('ownerId', 'username fullname email phoneNumber avatarImage role businessType businessName createdAt')
        .exec();

      if (!boardingHouse) {
        return res.status(404).json({ success: false, message: 'Boarding house not found' });
      }

      return res.status(200).json(boardingHouse);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch boarding house details',
        error: error.message,
      });
    }
  }

  async getOwnBoardingHouses(req, res) {
    try {
      req.query.page = req.query.page || '1';
      req.query.limit = req.query.limit || '10';

      const result = await paginate(
        BoardingHouse,
        {
          defaultPage: 1,
          defaultLimit: 10,
          sortField: 'createdAt',
          filter: this.buildOwnFilter(req),
          populate: [
            { path: 'boardingHouseType', select: 'name codeName' },
            { path: 'ownerId', select: 'username fullname email phoneNumber role' },
            { path: 'staffId', select: 'username fullname email phoneNumber role' },
          ],
        },
        req
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch own boarding houses',
        error: error.message,
      });
    }
  }

  async getOwnBoardingHouseDetails(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid boarding house id' });
      }

      const boardingHouse = await BoardingHouse.findOne({
        _id: id,
        ...this.buildOwnFilter(req),
      })
        .populate('boardingHouseType', 'name codeName')
        .populate('ownerId', 'email username fullname phoneNumber role')
        .populate('staffId', 'email username fullname phoneNumber role')
        .exec();

      if (!boardingHouse) {
        return res.status(404).json({ success: false, message: 'Boarding house not found' });
      }

      return res.status(200).json({ success: true, data: boardingHouse });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch boarding house details',
        error: error.message,
      });
    }
  }

  async createOwnBoardingHouse(req, res) {
    try {
      if (req.user?.role !== 'owner') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ chủ trọ mới được thêm nhà trọ',
        });
      }

      const payload = this.normalizeBoardingHousePayload(req.body, req.files || []);

      const payloadError = this.getBoardingHousePayloadError(payload);
      if (payloadError) {
        return res.status(400).json({ success: false, message: payloadError });
      }

      if (!payload.images.length) {
        return res.status(400).json({ success: false, message: 'Vui lòng tải lên ít nhất một hình ảnh' });
      }

      const typeExists = await BoardingHouseType.exists({ _id: payload.boardingHouseType });
      if (!typeExists) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy loại nhà trọ' });
      }

      payload.staffId = await this.resolveAssignableStaffId(
        payload.staffId,
        this.getUserId(req)
      );

      const boardingHouse = await BoardingHouse.create({
        ...payload,
        ownerId: this.getUserId(req),
      });

      return res.status(201).json({
        success: true,
        message: 'Boarding house created successfully',
        data: boardingHouse,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: 'Failed to create boarding house',
        error: error.message,
      });
    }
  }

  async updateOwnBoardingHouse(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid boarding house id' });
      }

      const boardingHouse = await BoardingHouse.findOne({
        _id: id,
        ...this.buildOwnFilter(req),
      });

      if (!boardingHouse) {
        return res.status(404).json({ success: false, message: 'Boarding house not found' });
      }

      const payload = this.normalizeBoardingHousePayload(
        req.body,
        req.files || [],
        boardingHouse.images || []
      );

      const payloadError = this.getBoardingHousePayloadError(payload);
      if (payloadError) {
        return res.status(400).json({ success: false, message: payloadError });
      }

      if (!payload.images.length) {
        return res.status(400).json({ success: false, message: 'Vui lòng giữ lại hoặc tải lên ít nhất một hình ảnh' });
      }

      const typeExists = await BoardingHouseType.exists({ _id: payload.boardingHouseType });
      if (!typeExists) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy loại nhà trọ' });
      }

      if (req.user?.role === 'owner') {
        payload.staffId = await this.resolveAssignableStaffId(
          payload.staffId,
          this.getUserId(req)
        );
      } else {
        payload.staffId = boardingHouse.staffId || null;
      }

      Object.assign(boardingHouse, payload);
      await boardingHouse.save();

      return res.status(200).json({
        success: true,
        message: 'Boarding house updated successfully',
        data: boardingHouse,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: 'Failed to update boarding house',
        error: error.message,
      });
    }
  }

  async deleteOwnBoardingHouse(req, res) {
    try {
      if (req.user?.role !== 'owner') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ chủ trọ mới được xóa nhà trọ',
        });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid boarding house id' });
      }

      const boardingHouse = await BoardingHouse.findOneWithDeleted({
        _id: id,
        ...this.buildOwnFilter(req),
      });

      if (!boardingHouse) {
        return res.status(404).json({ success: false, message: 'Boarding house not found' });
      }

      if (boardingHouse.deleted) {
        return res.status(400).json({ success: false, message: 'Boarding house already deleted' });
      }

      const blockers = await this.getDeleteBlockers(id);
      if (blockers.length) {
        return res.status(409).json({
          success: false,
          message: `Không thể xóa nhà trọ khi còn ${blockers.join(', ')}.`,
          blockers,
        });
      }

      await boardingHouse.delete(this.getUserId(req));

      return res.status(200).json({
        success: true,
        message: 'Boarding house deleted successfully',
        data: boardingHouse,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete boarding house',
        error: error.message,
      });
    }
  }

  async getBoardingHouseTypes(req, res) {
    try {
      const types = await BoardingHouseType.find({})
        .sort({ name: 1 })
        .select('name codeName description')
        .lean();

      return res.status(200).json({
        success: true,
        data: types.map((type) => ({
          ...type,
          value: type._id,
          label: type.name,
        })),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch boarding house types',
        error: error.message,
      });
    }
  }

  async getAllBHOnDashBoard(req, res, next) {
    try {
      const boardingHData = await BoardingHouse.find()
        .populate('boardingHouseType')
        .populate({
          path: 'ownerId',
        })
        .sort({ createdAt: -1 });

      return res.status(200).json(boardingHData);
    } catch (error) {
      console.error('Error fetching boarding house data:', error);
      return res.status(500).json({
        message: 'Failed to fetch boarding house data. Please try again later.',
        error: error.message,
      });
    }
  }

  async updateBoardingHouseDetails(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const boardingHouse = await BoardingHouse.findById(id);
      if (!boardingHouse) {
        return res
          .status(404)
          .json({ success: false, message: 'Boarding house not found.' });
      }
      const images = [];
      let hasPrimary = false;
      if (req.body.boardingHouse) {
        const data = JSON.parse(req.body.boardingHouse);

        for (const img of data) {
          if (img.isPrimary) hasPrimary = true;
        }

        if (Array.isArray(data)) {
          images.push(...data);
        }
      }
      if (req.files) {
        req.files.forEach((file, index) => {
          images.push({
            imageUrl: file.path,
            publicId: file.filename,
            isPrimary: !hasPrimary && index === 0,
          });
        });
        // Delete old images from Cloudinary
        for (const oldImage of boardingHouse.images) {
          await cloudinary.uploader.destroy(oldImage.publicId);
        }

        updateData.images = images;
      }
      if (!updateData.address?.province?.name || !updateData.address?.province?.name_en ||
        !updateData.address?.district?.name || !updateData.address?.district?.name_en ||
        !updateData.address?.ward?.name || !updateData.address?.ward?.name_en) {
        return res.status(400).json({
          success: false,
          message: 'Missing required address fields.',
        });
      }

      const updatedBoardingHouse = await BoardingHouse.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('boardingHouseType', 'name codeName')
        .populate('ownerId', 'email');

      if (!updatedBoardingHouse) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house not found.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Boarding house updated successfully.',
        data: updatedBoardingHouse,
      });
    } catch (error) {
      console.error('Error updating boarding house details:', error);
      return res.status(500).json({
        success: false,
        message:
          'Failed to update boarding house details. Please try again later.',
        error: error.message,
      });
    }
  }

  async getAllBoardingHouseTypes(req, res) {
    try {
      const boardingHouseTypes = await BoardingHouseType.find().sort({
        createdAt: -1,
      });
      const formattedTypes = boardingHouseTypes.map((type) => ({
        value: type._id,
        label: type.name,
        code: type.codeName,
        roomSize: type.roomSize,
        peopleNumber: type.peopleNumber,
        description: type.description,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
      }));

      return res.status(200).json({
        success: true,
        data: formattedTypes,
      });
    } catch (error) {
      console.error('Error fetching boarding house types:', error.message);
      return res.status(500).json({
        success: false,
        message:
          'Failed to fetch boarding house types. Please try again later.',
      });
    }
  }
  async addBoardingHouseImage(req, res) {
    try {
      const { id } = req.params;
      const { imageUrl, isPrimary } = req.body;

      const boardingHouse = await BoardingHouse.findById(id);
      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house not found',
        });
      }

      // If isPrimary is true, set all other images to false
      if (isPrimary) {
        boardingHouse.images.forEach((image) => {
          image.isPrimary = false;
        });
      }

      boardingHouse.images.push({
        imageUrl,
        isPrimary,
      });

      await boardingHouse.save();

      return res.status(201).json({
        success: true,
        message: 'Image added successfully',
        data: boardingHouse,
      });
    } catch (error) {
      console.error('Error adding boarding house image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add image. Please try again later.',
        error: error.message,
      });
    }
  }

  async updateBoardingHouseImage(req, res) {
    try {
      const { id, imageId } = req.params;
      const { imageUrl, isPrimary } = req.body;

      const boardingHouse = await BoardingHouse.findById(id);
      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house not found',
        });
      }

      const image = boardingHouse.images.id(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Image not found',
        });
      }

      // If setting this image as primary, update other images
      if (isPrimary) {
        boardingHouse.images.forEach((img) => {
          img.isPrimary = false;
        });
      }

      if (imageUrl) image.imageUrl = imageUrl;
      image.isPrimary = isPrimary;

      await boardingHouse.save();

      return res.status(200).json({
        success: true,
        message: 'Image updated successfully',
        data: boardingHouse,
      });
    } catch (error) {
      console.error('Error updating boarding house image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update image. Please try again later.',
        error: error.message,
      });
    }
  }

  async deleteBoardingHouseImage(req, res) {
    try {
      const { id, imageId } = req.params;

      const boardingHouse = await BoardingHouse.findById(id);
      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house not found',
        });
      }

      const imageIndex = boardingHouse.images.findIndex(
        (img) => img._id.toString() === imageId
      );

      if (imageIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Image not found',
        });
      }

      boardingHouse.images.splice(imageIndex, 1);
      await boardingHouse.save();

      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting boarding house image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete image. Please try again later.',
        error: error.message,
      });
    }
  }
  async getBoardingHouseImages(req, res) {
    try {
      const { id } = req.params;

      const boardingHouse = await BoardingHouse.findById(id).select('images');

      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: boardingHouse.images,
      });
    } catch (error) {
      console.error('Error fetching boarding house images:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch boarding house images.',
        error: error.message,
      });
    }
  }
  async createBoardingHouse(req, res) {
    try {
      const {
        ownerUsername,
        boardingHouseType,
        name,
        address,
        location,
        description,
        priceRange,
        electricityPrice,
        waterPrice,
        totalRooms = 0,
        availableRooms = 0,
        likes = 0,
        rating = 5,
      } = req.body;

      const images = [];
      if (req.files && req.files.length > 0) {
        console.log(req.files);
        req.files.forEach((file) => {
          images.push({
            imageUrl: file.path,
            publicId: file.filename,
            isPrimary: images.length === 0, // First image is primary
          });
        });
      }

      if (images.length === 0) {
        console.error('No images uploaded.');
        return res
          .status(400)
          .json({ message: 'You must upload at least one image.' });
      }
      // Validate owner
      const ownerAccount = await Account.findOne({
        username: ownerUsername,
        role: 'owner',
      });
      if (!ownerAccount) {
        console.error('Invalid owner:', ownerUsername);
        return res.status(400).json({
          message: 'Invalid owner username or the user is not a landlord.',
        });
      }
      const ownerId = ownerAccount._id;

      // Validate boarding house type
      const boardingHouseTypeExists =
        await BoardingHouseType.findById(boardingHouseType);
      if (!boardingHouseTypeExists) {
        console.error('Invalid boarding house type:', boardingHouseType);
        return res
          .status(400)
          .json({ message: 'Invalid boarding house type.' });
      }

      // Validate name
      if (!name || /[!@#$%^&*(),.?":{}|<>]/g.test(name)) {
        console.error('Invalid name:', name);
        return res.status(400).json({
          message: 'Name is required and must not contain special characters.',
        });
      }
      // Check if the boarding house name already exists
      const existingBoardingHouse = await BoardingHouse.findOne({ name });
      if (existingBoardingHouse) {
        console.error('Boarding house name already exists:', name);
        return res
          .status(400)
          .json({ message: 'A boarding house with this name already exists.' });
      }

      // Validate address
      const { province, district, ward, detail } = address;
      if (!province || !district || !ward) {
        console.error('Invalid address:', address);
        return res.status(400).json({
          message:
            'Province, district, and ward are required fields in the address.',
        });
      }

      // Validate price fields
      if (priceRange <= 0 || electricityPrice <= 0 || waterPrice <= 0) {
        console.error('Invalid price fields:', {
          priceRange,
          electricityPrice,
          waterPrice,
        });
        return res
          .status(400)
          .json({ message: 'Price fields must be greater than 0.' });
      }

      // Tạo mới boarding house
      const newBoardingHouse = new BoardingHouse({
        ownerId,
        name,
        description: description || '',
        priceRange,
        electricityPrice,
        waterPrice,
        boardingHouseType,
        address: {
          province,
          district,
          ward,
          detail: detail || '',
        },
        location: {
          lat: location.lat,
          lon: location.lon,
        },
        images,
        totalRooms,
        availableRooms,
        likes,
        rating,
      });

      // Lưu boarding house vào database
      const savedBoardingHouse = await newBoardingHouse.save();

      return res.status(201).json({
        message: 'Boarding house created successfully!',
        data: savedBoardingHouse,
      });
    } catch (error) {
      console.error('Error creating boarding house:', error);
      return res.status(500).json({
        message: 'An unexpected error occurred while creating boarding house.',
        error: error.message,
      });
    }
  }

  async uploadFile(req, res) {
    const storagePath = './public/images/boardingHouse';

    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    try {
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, storagePath);
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      });

      const upload = multer({ storage }).single('file');

      upload(req, res, (err) => {
        if (err) {
          console.error('Error uploading file:', err);
          return res.status(500).json({ message: 'Failed to upload file.' });
        }

        if (!req.file) {
          return res.status(400).json({ message: 'No file provided.' });
        }
        const filePath = `/public/images/boardingHouse/${req.file.filename}`;
        res.status(200).json({ filePath });
      });
    } catch (error) {
      console.error('Error in uploadFile:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }

  async filterBoardingHouse(req, res) {
    try {
      let {
        boardingHouseType,
        district,
        name,
        priceRange,
        province,
        ward,
        startDate,
        endDate,
        rating,
        page = 1,
        limit = 10,
      } = req.query;

      page = Math.max(parseInt(page), 1);
      limit = Math.min(Math.max(parseInt(limit), 1), 100);

      let filter = {};

      if (boardingHouseType) {
        filter.boardingHouseType = new mongoose.Types.ObjectId(boardingHouseType);
      }
      if (rating) {
        const ratings = rating.split(',').map(Number);
        const validRatings = ratings.filter((r) => !isNaN(r) && r >= 0 && r <= 5);
        if (validRatings.length > 0) {
          filter.rating = { $in: validRatings };
        } else {
          return res.status(400).json({
            success: false,
            message:
              'Invalid rating format. Each rating must be a number between 0 and 5.',
          });
        }
      }
      if (priceRange && priceRange.length === 2) {
        filter.priceRange = { $gte: priceRange[0], $lte: priceRange[1] };
      }
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const paginatedResult = await paginate(BoardingHouse, { filter, page, limit }, req);
      paginatedResult.data = await BoardingHouse.populate(paginatedResult.data, [
        { path: "boardingHouseType", select: "name codeName" },
        { path: "ownerId" }
      ]);

      paginatedResult.data = paginatedResult.data.filter(bh => {
        return (!province || (bh.address?.province && bh.address.province.toLowerCase().includes(province.toLowerCase())))
          && (!district || (bh.address?.district && bh.address.district.toLowerCase().includes(district.toLowerCase())))
          && (!ward || (bh.address?.ward && bh.address.ward.toLowerCase().includes(ward.toLowerCase())))
          && (!name || (bh.name && bh.name.toLowerCase().includes(name.toLowerCase())));
      });

      res.status(200).json(paginatedResult);
    } catch (error) {
      console.error('Error filtering boarding houses:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }

  async getMaxPriceBH(req, res, next) {
    try {
      const maxPriceHouse = await BoardingHouse.findOne({
        totalRooms: { $gt: 0 },
        deleted: { $ne: true },
      }).sort({
        priceRange: -1,
      });
      if (!maxPriceHouse) {
        return res.status(200).json({ success: true, maxPrice: 0 });
      }

      const roundedPrice = Math.ceil(maxPriceHouse.priceRange / 100) * 100;

      res.status(200).json({ success: true, maxPrice: roundedPrice });
    } catch (error) {
      console.error('Error fetching max price:', error);
      res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    }
  }

  async softDeleteBoardingHouse(req, res) {
    try {
      const { id } = req.params;

      const boardingHouse = await BoardingHouse.findById(id);
      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house not found',
        });
      }

      if (boardingHouse.deleted) {
        return res.status(400).json({
          success: false,
          message: 'Boarding house is already soft deleted',
        });
      }

      boardingHouse.deleted = true;
      boardingHouse.deletedAt = new Date();
      await boardingHouse.save();

      return res.status(200).json({
        success: true,
        message: 'Boarding house soft deleted successfully',
      });
    } catch (error) {
      console.error('Error soft deleting boarding house:', error);
      return res.status(500).json({
        success: false,
        message:
          'Failed to soft delete boarding house. Please try again later.',
        error: error.message,
      });
    }
  }

  async createBoardingHouseType(req, res) {
    try {
      const { name, description } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Name is required.',
        });
      }

      const existingType = await BoardingHouseType.findOne({ name });
      if (existingType) {
        return res.status(400).json({
          success: false,
          message: 'Boarding house type already exists.',
        });
      }

      const newType = new BoardingHouseType({
        name,
        description,
      });

      const savedType = await newType.save();

      return res.status(201).json({
        success: true,
        message: 'Boarding house type created successfully.',
        data: savedType,
      });
    } catch (error) {
      console.error('Error creating boarding house type:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create boarding house type.',
        error: error.message,
      });
    }
  }

  async getBoardingHouseTypeDetails(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Boarding house type ID is required.',
        });
      }

      const boardingHouseType = await BoardingHouseType.findById(id);

      if (!boardingHouseType) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house type not found.',
        });
      }

      return res.status(200).json({
        success: true,
        data: boardingHouseType,
      });
    } catch (error) {
      console.error('Error fetching boarding house type details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch boarding house type details.',
        error: error.message,
      });
    }
  }

  async softDeleteBoardingHouseType(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Boarding house type ID is required.',
        });
      }
      const boardingHouseType = await BoardingHouseType.findById(id);
      if (!boardingHouseType) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house type not found.',
        });
      }

      boardingHouseType.deleted = true;
      await boardingHouseType.save();

      return res.status(200).json({
        success: true,
        message: 'Boarding house type soft deleted successfully.',
      });
    } catch (error) {
      console.error('Error soft deleting boarding house type:', error);
      return res.status(500).json({
        success: false,
        message:
          'Failed to soft delete boarding house type. Please try again later.',
        error: error.message,
      });
    }
  }

  async filterBoardingHouseType(req, res) {
    try {
      const { name, startDate, endDate } = req.query;

      const filter = {};
      if (name) {
        filter.name = { $regex: new RegExp(name, 'i') };
      }

      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      const boardingHouseTypes = await BoardingHouseType.find(filter).sort({
        createdAt: -1,
      });

      if (!boardingHouseTypes || boardingHouseTypes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No boarding house types found matching the criteria.',
        });
      }
      return res.status(200).json({
        success: true,
        data: boardingHouseTypes,
      });
    } catch (error) {
      console.error('Error filtering boarding house types:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to filter boarding house types.',
        error: error.message,
      });
    }
  }
}
export default new BoardingHouseController();
