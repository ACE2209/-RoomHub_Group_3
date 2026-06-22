
import mongoose from 'mongoose';
import RoomType from '../models/roomType.js';
import Room from '../models/room.js';
import '../models/facilities.js';
import paginate from '../utils/pagination.js';

class RoomTypeController {
  /**
   * View all Room Types of a Boarding House
   * GET /roomtype/boardinghouse/:id
   */
  async getRoomTypeByBhId(req, res, next) {
    try {
      const { id } = req.params;

      // Check valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Boarding House ID',
        });
      }

      // Filter RoomType by BoardingHouse
      const filter = {
        boardingHouseId: id,
      };

      // Pagination configuration
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

      // Get Room Types
      const result = await paginate(RoomType, paginationOptions, req);

      // Count available rooms for each RoomType
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

      // Convert to object map
      const roomCountMap = roomCounts.reduce((acc, item) => {
        acc[item._id.toString()] = item.count;
        return acc;
      }, {});

      // Add availableRoom field
      const enrichedData = result.data.map((roomType) => ({
        ...roomType,
        availableRoom: roomCountMap[roomType._id.toString()] || 0,
      }));

      return res.status(200).json({
        success: true,
        message: 'Get Room Types Successfully',
        ...result,
        data: enrichedData,
      });
    } catch (error) {
      console.error('Error in getRoomTypeByBhId:', error);
      next(error);
    }
  }
}

export default new RoomTypeController();
