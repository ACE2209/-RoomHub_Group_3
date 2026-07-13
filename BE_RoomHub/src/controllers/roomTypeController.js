import RoomType from '../models/roomType.js';
import Room from '../models/room.js';
import { v2 as cloudinary } from 'cloudinary';
import BoardingHouse from '../models/boardingHouse.js';
import facilities from '../models/facilities.js';
import mongoose from 'mongoose';
import paginate from '../utils/pagination.js';

class RoomTypeController {
  getUserId(req) {
    return req.user?.userId || req.user?._id;
  }

  canManageBoardingHouse(boardingHouse, req) {
    const userId = this.getUserId(req);

    if (!boardingHouse || !userId) return false;

    return [boardingHouse.ownerId, boardingHouse.staffId]
      .filter(Boolean)
      .some((id) => id.toString() === userId.toString());
  }

  async getRoomTypeByBhId(req, res, next) {
    try {
      const { id } = req.params;

      // ✅ Bước 1: Filter theo boardingHouseId
      const filter = {
        boardingHouseId: id,
      };

      // ✅ Bước 2: Cấu hình phân trang
      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
        sortField: 'createdAt',
        sortOrder: 'desc',
        filter,
        allowSearchFields: [],
        populate: ['facilities', 'boardingHouseId'],
        includeTotalData: true,
      };

      // ✅ Bước 3: Gọi paginate
      const result = await paginate(RoomType, paginationOptions, req);

      // ✅ Bước 4: Lấy danh sách room count
      const roomCounts = await Room.aggregate([
        {
          $match: {
            boardingHouseId: new mongoose.Types.ObjectId(id),
            isAvailable: true,
          },
        },
        {
          $group: {
            _id: '$roomTypeId',
            count: { $sum: 1 },
          },
        },
      ]);

      const roomCountMap = roomCounts.reduce((acc, cur) => {
        acc[cur._id.toString()] = cur.count;
        return acc;
      }, {});

      // ✅ Bước 5: Thêm trường availableRoom vào từng record
      const enrichedData = result.data.map((roomType) => ({
        ...roomType,
        availableRoom: roomCountMap[roomType._id.toString()] || 0,
      }));

      // ✅ Bước 6: Trả kết quả phân trang với dữ liệu đã enrich
      return res.status(200).json({
        ...result,
        data: enrichedData,
      });
    } catch (error) {
      next(error);
    }
  }

  async addRoomTypeToBoardingHouse(req, res, next) {
    try {
      const { id } = req.params; // ID của BoardingHouse
      let { typeName, facilities, price, roomSize, peopleNumber } = req.body;

      // 🔥 Kiểm tra BoardingHouse có tồn tại không
      const boardingHouse = await BoardingHouse.findById(id);
      if (!boardingHouse) {
        return res.status(404).json({ message: 'Boarding House not found' });
      }

      if (req.user && !this.canManageBoardingHouse(boardingHouse, req)) {
        return res.status(403).json({
          message: 'You do not have permission to manage this boarding house.',
        });
      }

      // ✅ Kiểm tra typeName: Không chứa ký tự đặc biệt, không trùng
      const typeNameRegex = /^[a-zA-Z0-9 ]+$/; // ✅ Chỉ cho phép chữ, số, khoảng trắng
      if (!typeNameRegex.test(typeName)) {
        return res
          .status(400)
          .json({ message: 'Type Name must not contain special characters.' });
      }

      // ✅ Kiểm tra typeName có trùng không
      const existingRoomType = await RoomType.findOne({
        boardingHouseId: id,
        typeName,
      });
      if (existingRoomType) {
        return res.status(400).json({
          message: 'Type Name already exists for this Boarding House.',
        });
      }
      // ✅ Kiểm tra Room Size: Chỉ chấp nhận "20x30" hoặc "30x40"
      // const validRoomSizes = ['20x30', '30x40'];
      // if (!validRoomSizes.includes(roomSize)) {
      //   return res.status(400).json({
      //     message: 'Room size must be either "20x30" or "30x40".',
      //   });
      // }

      // ✅ Convert `facilities` từ string JSON thành array ObjectId
      if (!facilities || facilities === 'null' || facilities === '[]') {
        facilities = []; // 👉 Nếu không có, gán mặc định là []
      } else if (typeof facilities === 'string') {
        try {
          facilities = JSON.parse(facilities);
        } catch (error) {
          return res.status(400).json({ message: 'Invalid facilities format' });
        }
      }

      if (!Array.isArray(facilities)) {
        return res.status(400).json({ message: 'Facilities must be an array' });
      }

      // 👉 Nếu `facilities` không phải `["None"]`, convert sang `ObjectId`
      if (facilities[0] !== 'None') {
        facilities = facilities.map((id) => new mongoose.Types.ObjectId(id));
      }

      // 🔥 Kiểm tra và xử lý ảnh upload lên Cloudinary
      if (!req.file) {
        return res.status(400).json({ message: 'You must upload an image.' });
      }

      const image = {
        imageUrl: req.file.path,
        publicId: req.file.filename,
      };

      // ✅ Tạo mới RoomType
      const newRoomType = new RoomType({
        boardingHouseId: id,
        typeName,
        facilities,
        price,
        roomSize,
        peopleNumber,
        image, // Lưu ảnh duy nhất
      });

      // 🔥 Lưu vào database
      await newRoomType.save();

      res.status(201).json({
        message: 'Room Type added successfully',
        data: newRoomType,
      });
    } catch (error) {
      console.error('🔥 Error in addRoomTypeToBoardingHouse:', error);
      return res.status(500).json({
        message: 'An unexpected error occurred while adding room type.',
        error: error.message,
      });
    }
  }
  async updateRoomTypeToBoardingHouse(req, res, next) {
    try {
      const { roomTypeId } = req.params; // ID của RoomType
      let { typeName, facilities, price, roomSize, peopleNumber } = req.body;

      // 🔥 Kiểm tra RoomType có tồn tại không
      const roomType = await RoomType.findById(roomTypeId);
      if (!roomType) {
        return res.status(404).json({ message: 'Room Type not found' });
      }

      // ✅ Kiểm tra typeName không chứa ký tự đặc biệt
      const boardingHouse = await BoardingHouse.findById(roomType.boardingHouseId);
      if (!this.canManageBoardingHouse(boardingHouse, req)) {
        return res.status(403).json({
          message: 'You do not have permission to update this room type.',
        });
      }

      const typeNameRegex = /^[a-zA-Z0-9 ]+$/;
      if (typeName && !typeNameRegex.test(typeName)) {
        return res
          .status(400)
          .json({ message: 'Type Name must not contain special characters.' });
      }

      // ✅ Kiểm tra typeName có trùng không (trừ chính nó)
      if (typeName !== undefined) {
        const existingRoomType = await RoomType.findOne({
          boardingHouseId: roomType.boardingHouseId,
          typeName,
          _id: { $ne: roomTypeId },
        });
        if (existingRoomType) {
          return res.status(400).json({
            message: 'Type Name already exists for this Boarding House.',
          });
        }
      }
      // const validRoomSizes = ['20x30', '30x40'];
      // if (!validRoomSizes.includes(roomSize)) {
      //   return res.status(400).json({
      //     message: 'Room size must be either "20x30" or "30x40".',
      //   });
      // }

      if (facilities !== undefined) {
        // ✅ Convert `facilities` từ string JSON thành array ObjectId
        if (!facilities || facilities === 'null' || facilities === '[]') {
          facilities = [];
        } else if (typeof facilities === 'string') {
          try {
            facilities = JSON.parse(facilities);
          } catch (error) {
            return res.status(400).json({ message: 'Invalid facilities format' });
          }
        }

        if (!Array.isArray(facilities)) {
          return res.status(400).json({ message: 'Facilities must be an array' });
        }

        // ✅ Nếu `facilities.length === 0`, cập nhật RoomType thành không có facilities
        if (facilities.length === 0) {
          roomType.facilities = []; // Xóa hết facilities
        } else {
          // Nếu vẫn còn facilities, chuyển đổi chúng thành ObjectId
          roomType.facilities = facilities.map(
            (id) => new mongoose.Types.ObjectId(id)
          );
        }
      }

      // ✅ Xử lý ảnh: Nếu có ảnh mới -> Xóa ảnh cũ trên Cloudinary, upload ảnh mới
      let image = roomType.image; // Giữ ảnh cũ nếu không có ảnh mới
      if (req.file) {
        // 🔥 Xóa ảnh cũ trên Cloudinary nếu có
        if (roomType.image?.publicId) {
          await cloudinary.uploader.destroy(roomType.image.publicId);
        }

        // 🔥 Lưu ảnh mới lên Cloudinary
        image = {
          imageUrl: req.file.path,
          publicId: req.file.filename,
        };
      }

      // ✅ Cập nhật RoomType
      if (typeName !== undefined) roomType.typeName = typeName;
      if (price !== undefined) roomType.price = price;
      if (roomSize !== undefined) roomType.roomSize = roomSize;
      if (peopleNumber !== undefined) roomType.peopleNumber = peopleNumber;
      roomType.image = image;

      // 🔥 Lưu vào database
      await roomType.save();

      res.status(200).json({
        message: 'Room Type updated successfully',
        data: roomType,
      });
    } catch (error) {
      console.error('🔥 Error in updateRoomTypeToBoardingHouse:', error);
      return res.status(500).json({
        message: 'An unexpected error occurred while updating room type.',
        error: error.message,
      });
    }
  }
  async softDeleteRoomType(req, res, next) {
    try {
      const { roomTypeId } = req.params;

      // 🔥 Kiểm tra RoomType có tồn tại không
      const roomType = await RoomType.findById(roomTypeId);
      if (!roomType) {
        return res.status(404).json({ message: 'Room Type not found' });
      }

      // ✅ Nếu đã bị xóa trước đó, thông báo lỗi
      const boardingHouse = await BoardingHouse.findById(roomType.boardingHouseId);
      if (!this.canManageBoardingHouse(boardingHouse, req)) {
        return res.status(403).json({
          message: 'You do not have permission to delete this room type.',
        });
      }

      if (roomType.deleted) {
        return res
          .status(400)
          .json({ message: 'Room Type has already been deleted.' });
      }

      // ✅ Cập nhật trạng thái `deleted` thành `true`
      roomType.deleted = true;
      roomType.deletedAt = new Date(); // Ghi lại thời gian xóa

      // 🔥 Lưu vào database
      await roomType.save();

      return res.status(200).json({
        message: 'Room Type deleted successfully (soft delete).',
        data: roomType,
      });
    } catch (error) {
      console.error('🔥 Error in softDeleteRoomType:', error);
      return res.status(500).json({
        message: 'An unexpected error occurred while deleting room type.',
        error: error.message,
      });
    }
  }
}

export default new RoomTypeController();
