import mongoose from 'mongoose';
import BoardingHouse from '../models/boardingHouse.js';
import '../models/boardingHouseType.js';
import '../models/account.js';
import paginate from '../utils/pagination.js';

const buildTextRegex = (value) => new RegExp(value.trim(), 'i');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

class BoardingHouseController {
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
}

export default new BoardingHouseController();
