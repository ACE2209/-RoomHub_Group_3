import { Account } from '../models/account.js';
import WatchLater from '../models/watchLater.js';

class watchLaterController {
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
