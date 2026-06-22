import { Account } from '../models/account.js';
import FavoriteBH from '../models/favoriteBH.js';
import BoardingHouse from '../models/boardingHouse.js';
import paginate from '../utils/pagination.js';

class favoriteController {
  async getFavorites(req, res) {
    try {
      const account = await Account.findById(req.user.userId); // Lấy user từ token
      if (!account) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Tìm tất cả danh sách yêu thích của người dùng
      const favorites = await FavoriteBH.find({ accountId: account._id })
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
      const validFavorites = favorites.filter((fav) => fav.boardingHouseId);

      return res.status(200).json({
        message: 'Successfully retrieved favorites',
        favorites: validFavorites.map((fav) => ({
          id: fav.boardingHouseId._id,
          name: fav.boardingHouseId.name,
          price: fav.boardingHouseId.priceRange,
          img: fav.boardingHouseId.images,
          rating: fav.boardingHouseId.rating,
          detail: fav.boardingHouseId.description,
          address: fav.boardingHouseId.address,
          timeAgo: fav.boardingHouseId.timeAgo,
          isFavorite: true,
          boardingHouseType: fav.boardingHouseId.boardingHouseType
            ? fav.boardingHouseId.boardingHouseType.name
            : 'undefined',
        })),
      });
    } catch (error) {
      console.error('Error in getFavorites:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async createFavorite(req, res) {
    try {
      const account = await Account.findById(req.user.userId);
      if (!account) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { boardingHouseId } = req.body;
      if (!boardingHouseId) {
        return res.status(400).json({ message: 'Missing boardingHouseId' });
      }

      const existingFavorite = await FavoriteBH.findOne({
        accountId: account._id,
        boardingHouseId,
      });

      if (existingFavorite) {
        await FavoriteBH.deleteOne({ _id: existingFavorite._id });

        // Giảm số like mà không cập nhật `updatedAt`
        await BoardingHouse.updateOne(
          { _id: boardingHouseId },
          { $inc: { likes: -1 } },
          { timestamps: false }
        );

        return res
          .status(200)
          .json({ message: 'Removed from favorites', isFavorite: false });
      }

      // Thêm vào danh sách yêu thích
      const newFavorite = new FavoriteBH({
        accountId: account._id,
        boardingHouseId,
      });
      await newFavorite.save();

      // Tăng số like mà không cập nhật `updatedAt`
      await BoardingHouse.updateOne(
        { _id: boardingHouseId },
        { $inc: { likes: 1 } },
        { timestamps: false }
      );

      return res
        .status(201)
        .json({ message: 'Added to favorites', isFavorite: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  async deleteFavorite(req, res) {
    try {
      const account = await Account.findById(req.user.userId);
      if (!account) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { boardingHouseId } = req.params;
      if (!boardingHouseId) {
        return res.status(400).json({ message: 'Missing boardingHouseId' });
      }
      const favorite = await FavoriteBH.findOne({
        accountId: account._id,
        boardingHouseId,
      });
      if (!favorite) {
        return res.status(404).json({ message: 'Favorite not found' });
      }
      await FavoriteBH.deleteOne({ _id: favorite._id });

      await BoardingHouse.updateOne(
        { _id: boardingHouseId },
        { $inc: { likes: -1 } },
        { timestamps: false }
      );

      return res
        .status(200)
        .json({ message: 'Deleted from favorites', isFavorite: false });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  async getAllFavorites(req, res) {
    try {
      const account = await Account.findById(req.user.userId);
      if (!account) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      // Cấu hình pagination
      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 5,
        maxLimit: 100,
        sortField: 'createdAt',
        sortOrder: 'desc',
        filter: { accountId: account._id },
        allowQueryFilters: [], // Thêm nếu muốn lọc theo status, etc.
        allowSearchFields: ['boardingHouseId.name'], // Nếu cần search theo tên nhà
        fields: '-__v',
        populate: [
          {
            path: 'boardingHouseId',
            select:
              'name priceRange images rating description address boardingHouseType timeAgo',
            populate: {
              path: 'boardingHouseType',
              select: 'name roomSize peopleNumber',
            },
          },
        ],
        includeTotalData: true,
      };

      // Gọi helper phân trang
      const result = await paginate(FavoriteBH, paginationOptions, req);

      // const transformedFavorites = result.docs.map((fav) => {
      //   const bh = fav.boardingHouseId;
      //   return {
      //     id: bh._id,
      //     name: bh.name,
      //     price: bh.priceRange,
      //     img: bh.images,
      //     rating: bh.rating,
      //     detail: bh.description,
      //     address: bh.address,
      //     timeAgo: bh.timeAgo,
      //     isFavorite: true,
      //     boardingHouseType: bh.boardingHouseType?.name || 'undefined',
      //   };
      // });

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error in getAllFavorites:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new favoriteController();
