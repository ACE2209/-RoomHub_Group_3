import { Account } from '../models/account.js';
import WatchLater from '../models/watchLater.js';

class watchLaterController {
  async getWatchLater(req, res) {
    try {
      const account = await Account.findById(req.user.userId); // Lấy user từ token
      if (!account) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Tìm tất cả danh sách xem sau của người dùng
      const watchLater = await WatchLater.find({ accountId: account._id })
        .populate({
          path: 'boardingHouseId',
          match: { deleted: false }, // Chỉ lấy BoardingHouse chưa bị xóa mềm
          select:
            'name priceRange images rating description address boardingHouseType timeAgo',
          populate: {
            path: 'boardingHouseType',
            select: 'name roomSize peopleNumber',
          },
        })
        .lean();

      // Lọc những mục mà boardingHouseId bị null (do match không thỏa)
      const validWatchLater = watchLater.filter((item) => item.boardingHouseId);

      return res.status(200).json({
        message: 'Successfully retrieved watch later',
        watchLater: validWatchLater.map((item) => ({
          id: item.boardingHouseId._id,
          name: item.boardingHouseId.name,
          price: item.boardingHouseId.priceRange,
          img: item.boardingHouseId.images,
          rating: item.boardingHouseId.rating,
          detail: item.boardingHouseId.description,
          address: item.boardingHouseId.address,
          timeAgo: item.boardingHouseId.timeAgo,
          isWatchLater: true,
          boardingHouseType: item.boardingHouseId.boardingHouseType
            ? item.boardingHouseId.boardingHouseType.name
            : 'undefined',
        })),
      });
    } catch (error) {
      console.error('Error in getWatchLater:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async createWatchLater(req, res) {
    try {
      const account = await Account.findById(req.user.userId);
      if (!account) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { boardingHouseId } = req.body;
      if (!boardingHouseId) {
        return res.status(400).json({ message: 'Missing boardingHouseId' });
      }

      const existingWatchLater = await WatchLater.findOne({
        accountId: account._id,
        boardingHouseId,
      });

      if (existingWatchLater) {
        await WatchLater.deleteOne({ _id: existingWatchLater._id });

        return res
          .status(200)
          .json({ message: 'Removed from watch later', isWatchLater: false });
      }

      const newWatchLater = new WatchLater({
        accountId: account._id,
        boardingHouseId,
      });
      await newWatchLater.save();

      return res
        .status(201)
        .json({ message: 'Added to watch later', isWatchLater: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export default new watchLaterController();
