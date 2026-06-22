import mongoose from 'mongoose';
import BoardingHouse from '../models/boardingHouse.js';
import BoardingHouseType from '../models/boardingHouseType.js';
import '../models/boardingHouseType.js';
import '../models/account.js';
import paginate from '../utils/pagination.js';

const buildTextRegex = (value) => new RegExp(value.trim(), 'i');

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
    return {
      $or: [
        { ownerId: new mongoose.Types.ObjectId(userId) },
        { staffId: new mongoose.Types.ObjectId(userId) },
      ],
    };
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
        lat: parseNumber(body.location?.lat || body['location[lat]'] || 0),
        lon: parseNumber(body.location?.lon || body['location[lon]'] || 0),
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

      await boardingHouse.delete(req.user?._id);

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
      return res.status(500).json({
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

      const typeExists = await BoardingHouseType.exists({ _id: payload.boardingHouseType });
      if (!typeExists) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy loại nhà trọ' });
      }

      Object.assign(boardingHouse, payload);
      await boardingHouse.save();

      return res.status(200).json({
        success: true,
        message: 'Boarding house updated successfully',
        data: boardingHouse,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update boarding house',
        error: error.message,
      });
    }
  }

  async deleteOwnBoardingHouse(req, res) {
    try {
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
}

export default new BoardingHouseController();
