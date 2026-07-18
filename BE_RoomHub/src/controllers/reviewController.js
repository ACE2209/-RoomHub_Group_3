import Review from "../models/review.js";
import paginate from "../utils/pagination.js";
import BoardingHouse from "../models/boardingHouse.js";
import { v2 as cloudinary } from "cloudinary";

class ReviewController {
  getUserId(req) {
    return req.user?.userId || req.user?._id;
  }

  async canManageBoardingHouse(req, boardingHouseId) {
    const userId = this.getUserId(req);
    if (!userId || !boardingHouseId) return false;

    const role = req.user?.role;
    const manageFilter = role === "staff"
      ? { staffId: userId }
      : { ownerId: userId };

    const boardingHouse = await BoardingHouse.findOne({
      _id: boardingHouseId,
      ...manageFilter,
    }).select("_id");

    return Boolean(boardingHouse);
  }

  async recalculateBoardingHouseRating(boardingHouseId) {
    const reviews = await Review.find({
      boardingHouseId,
      parentId: null,
      deleted: false,
    });

    const nextRating = reviews.length
      ? Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1))
      : 5;

    await BoardingHouse.findByIdAndUpdate(
      boardingHouseId,
      { rating: nextRating },
      { new: true, timestamps: false }
    );

    return nextRating;
  }

  async getManagedReviewByBhId(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "bhId is required",
        });
      }

      const hasPermission = await this.canManageBoardingHouse(req, id);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view reviews of this boarding house",
        });
      }

      return this.getReviewByBhId(req, res);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getManagedReviews(req, res) {
    try {
      const userId = this.getUserId(req);
      const role = req.user?.role;
      const manageFilter = role === "staff"
        ? { staffId: userId }
        : { ownerId: userId };

      const boardingHouses = await BoardingHouse.find(manageFilter).select("_id");
      const boardingHouseIds = boardingHouses.map((house) => house._id);

      const result = await paginate(
        Review,
        {
          filter: {
            boardingHouseId: { $in: boardingHouseIds },
            parentId: null,
          },
          populate: [
            {
              path: "accountId",
              select: "fullname username avatarImage",
            },
            {
              path: "boardingHouseId",
              select: "name address",
            },
          ],
          defaultLimit: 10,
          maxLimit: 50,
          sortField: "createdAt",
          sortableFields: ["updatedAt", "createdAt", "rating"],
          includeUrls: false,
          includeTotalData: false,
        },
        req
      );

      const data = await Promise.all(
        result.data.map(async (review) => {
          const reply = await Review.findOne({ parentId: review._id })
            .select("_id content createdAt accountId")
            .populate({
              path: "accountId",
              select: "fullname avatarImage username",
            })
            .lean();

          return {
            ...review,
            replyContent: reply ? {
              _id: reply._id,
              content: reply.content,
              createdAt: reply.createdAt,
              account: reply.accountId,
            } : null,
          };
        })
      );

      return res.status(200).json({
        ...result,
        data,
        meta: {
          managedBoardingHouseCount: boardingHouseIds.length,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async replyReview(req, res) {
    try {
      const accountId = this.getUserId(req);
      const { parentId, content } = req.body;

      if (!accountId) {
        return res.status(401).json({ success: false, message: "Account ID not found." });
      }

      if (!parentId || !content?.trim()) {
        return res.status(400).json({ success: false, message: "parentId and content are required" });
      }

      const parentReview = await Review.findById(parentId);
      if (!parentReview || parentReview.parentId) {
        return res.status(404).json({ success: false, message: "Parent review not found" });
      }

      const hasPermission = await this.canManageBoardingHouse(req, parentReview.boardingHouseId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to reply to this review",
        });
      }

      const existingReply = await Review.findOne({ parentId: parentReview._id });
      if (existingReply) {
        return res.status(400).json({
          success: false,
          message: "This review already has a reply",
        });
      }

      const reply = await Review.create({
        accountId,
        boardingHouseId: parentReview.boardingHouseId,
        content: content.trim(),
        parentId: parentReview._id,
      });

      await reply.populate({
        path: "accountId",
        select: "fullname avatarImage username",
      });

      return res.status(201).json({
        success: true,
        message: "Reply added successfully",
        data: reply,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async updateReplyReview(req, res) {
    try {
      const accountId = this.getUserId(req);
      const { replyId } = req.params;
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ success: false, message: "Content is required" });
      }

      const reply = await Review.findById(replyId);
      if (!reply || !reply.parentId) {
        return res.status(404).json({ success: false, message: "Reply not found" });
      }

      const hasPermission = await this.canManageBoardingHouse(req, reply.boardingHouseId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this reply",
        });
      }

      const isCreator = reply.accountId?.toString() === accountId?.toString();
      if (!isCreator && !hasPermission) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }

      reply.content = content.trim();
      await reply.save();
      await reply.populate({
        path: "accountId",
        select: "fullname avatarImage username",
      });

      return res.status(200).json({
        success: true,
        message: "Reply updated successfully",
        data: reply,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async softDeleteReplyReview(req, res) {
    try {
      const accountId = this.getUserId(req);
      const { replyId } = req.params;

      const reply = await Review.findById(replyId);
      if (!reply || !reply.parentId) {
        return res.status(404).json({ success: false, message: "Reply not found" });
      }

      const hasPermission = await this.canManageBoardingHouse(req, reply.boardingHouseId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this reply",
        });
      }

      const isCreator = reply.accountId?.toString() === accountId?.toString();
      if (!isCreator && !hasPermission) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }

      await reply.delete();

      return res.status(200).json({
        success: true,
        message: "Reply deleted successfully",
        data: reply,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getReviewsByBoardingHouse(req, res) {
    try {
      const { boardingHouseId } = req.params;

      const reviews = await Review.find({
        boardingHouseId,
        parentId: null,
      })
        .populate({
          path: "accountId",
          select: "username _id fullname avatarImage",
        })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // View Review in Admin
  async getReviews(req, res) {
    try {
      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
        sortField: "createdAt",
        sortOrder: "asc",
        filter: {
          parentId: null,
        },
        populate: [
          {
            path: "accountId",
            select: "username _id fullname avatarImage",
          },
        ],
        includeTotalData: true,
      };

      const result = await paginate(Review, paginationOptions, req);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Filter Reviews in Admin
  async filterReviews(req, res) {
    try {
      const { startDate, endDate, ratings } = req.query;

      let filter = {
        parentId: null,
      };

      // Filter theo ngày
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate",
          });
        }

        if (end && isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate",
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

      // Filter theo rating
      if (ratings) {
        let ratingArray = [];

        if (Array.isArray(ratings)) {
          ratingArray = ratings.map((item) => Number(item));
        } else {
          ratingArray = [Number(ratings)];
        }

        const validRating = ratingArray.every(
          (item) => item >= 1 && item <= 5
        );

        if (!validRating) {
          return res.status(400).json({
            success: false,
            message: "Rating must be between 1 and 5",
          });
        }

        filter.rating = {
          $in: ratingArray,
        };
      }

      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
        sortField: "createdAt",
        sortOrder: "asc",
        filter,
        populate: [
          {
            path: "accountId",
            select: "username _id fullname avatarImage",
          },
        ],
        includeTotalData: true,
      };

      const result = await paginate(
        Review,
        paginationOptions,
        req
      );

      return res.status(200).json(result);

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // View Review Detail in Admin
  async getReviewDetail(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findById(reviewId)
        .populate({
          path: "accountId",
          select: "username _id fullname avatarImage",
        })
        .lean();

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      const replies = await Review.find({ parentId: reviewId })
        .populate({
          path: "accountId",
          select: "username _id fullname avatarImage",
        })
        .sort({ createdAt: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        data: {
          review,
          replies,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Delete Review in Admin (Soft Delete)
  async softDeleteReview(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findById(reviewId);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      if (review.deleted === true) {
        return res.status(400).json({
          success: false,
          message: "Review has already been deleted",
        });
      }

      review.deleted = true;
      review.deletedAt = new Date();

      await review.save();

      return res.status(200).json({
        success: true,
        message: "Review deleted successfully",
        data: review,
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // xem review của nhà trọ
  async getReviewByBhId(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'bhId is required'
        });
      }

      // ✅ Đếm tổng số review trước khi paginate
      const totalItems = await Review.countDocuments({
        boardingHouseId: id,
        parentId: null
      });

      const result = await paginate(
        Review,
        {
          filter: {
            boardingHouseId: id,
            parentId: null
          },

          // Populate thông tin account
          populate: [{
            path: 'accountId',
            select: 'fullname avatarImage'
          }],

          // Cấu hình pagination
          defaultLimit: 10,
          maxLimit: 50,
          sortField: 'updatedAt',

          // Cho phép search theo content và rating
          searchableFields: ['content'],
          allowQueryFilters: [
            'rating',
            'rating_gte',
            'rating_lte',
            'createdAt_gte',
            'createdAt_lte'
          ],

          // Cho phép sort theo các trường
          sortableFields: ['updatedAt', 'createdAt', 'rating'],

          // Không cần URLs và totalData để tối ưu performance
          includeUrls: false,
          includeTotalData: false
        },
        req
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching reviews',
          error: result.error
        });
      }

      // ✅ Duyệt qua từng review để lấy nội dung của reply (nếu có)
      const reviewsWithReply = await Promise.all(
        result.data.map(async (review) => {
          const reply = await Review.findOne({
            parentId: review._id
          }).select('_id content createdAt accountId')
            .populate({
              path: 'accountId',
              select: 'fullname avatarImage'
            });

          return {
            ...review,
            replyContent: reply ? {
              _id: reply._id,
              content: reply.content,
              createdAt: reply.createdAt,
              account: reply.accountId
            } : null
          };
        })
      );

      // ✅ Trả về kết quả với totalItems
      res.status(200).json({
        success: true,
        pagination: {
          ...result.pagination,
          totalItems: totalItems // Thêm totalItems vào pagination
        },
        data: reviewsWithReply,
        meta: {
          boardingHouseId: id,
          totalReviews: totalItems, // Thêm totalReviews vào meta để dễ sử dụng
          ...result.meta
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
  // Thêm review cho nhà trọ
  async addReview(req, res) {
    try {
      console.log("USER:", req.user);
      console.log("BODY:", req.body);
      const accountId = req.user.userId;
      if (!accountId) {
        return res.status(401).json({
          success: false,
          message: 'Account ID not found.',
        });
      }

      const { boardingHouseId, content, rating, images } = req.body;

      if (!rating) {
        return res.status(400).json({
          success: false,
          message: 'Rating is required.',
        });
      }

      const boardingHouse = await BoardingHouse.findById(boardingHouseId);
      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: 'Boarding house not found.',
        });
      }

      // Kiểm tra nếu user đã review boarding house này
      const existingReview = await Review.findOne({
        accountId,
        boardingHouseId,
        parentId: null, // Chỉ kiểm tra với review gốc
      });

      if (existingReview) {
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            cloudinary.uploader.destroy(file.filename);
          }
        }
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this boarding house.',
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5 stars.',
        });
      }



      // Tạo review mới
      const newReview = new Review({
        accountId,
        boardingHouseId,
        content,
        rating,
      });
      if (req.files && req.files.length > 0) {
        newReview.images = req.files.map((file) => ({
          imageUrl: file.path,
          publicId: file.filename,
        }));
      }

      await newReview.save();

      // 🔥 Chỉ lấy review gốc (không có parentId) và chưa bị xóa
      const reviews = await Review.find({
        boardingHouseId,
        parentId: null, // Chỉ lấy review gốc
        deleted: false,
      });

      if (reviews.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error calculating average rating.',
        });
      }

      // 🔥 Tính trung bình rating từ review gốc
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = (totalRating / reviews.length).toFixed(1);

      // 🔥 Cập nhật BoardingHouse nhưng không cập nhật `updatedAt`
      await BoardingHouse.findByIdAndUpdate(
        boardingHouseId,
        {
          rating: averageRating,
        },
        { new: true, timestamps: false } // 🔥 Ngăn Mongoose cập nhật `updatedAt`
      );

      return res.status(201).json({
        success: true,
        message: 'Review added successfully.',
        review: newReview,
        newRating: averageRating,
      });
    } catch (error) {
      console.error('Error adding review:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  }
  // Cập nhật review
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const accountId = req.user?.userId;


      const { content, rating } = req.body;

      if (!accountId) {
        if (req.files?.images) {
          await Promise.all(req.files.images.map(
            file => cloudinary.uploader.destroy(file.filename)
          ));
        }
        return res.status(401).json(
          { success: false, message: 'Account ID not found.' }
        );
      }

      const review = await Review.findOne({ _id: reviewId, accountId });
      if (!review) {
        if (req.files?.images) {
          await Promise.all(req.files.images.map(
            file => cloudinary.uploader.destroy(file.filename)
          ));
        }
        return res.status(403).json(
          { success: false, message: 'Unauthorized' }
        );
      }

      if (rating !== undefined && rating !== null && rating !== '') {
        const nextRating = Number(rating);
        if (!Number.isFinite(nextRating) || nextRating < 1 || nextRating > 5) {
          return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5 stars.',
          });
        }

        review.rating = nextRating;
      }

      review.content = content ?? review.content;

      if (req.files?.images && req.files.images.length > 0) {
        if (review.images && review.images.length > 0) {
          await Promise.all(review.images.map(
            oldImg => cloudinary.uploader.destroy(oldImg.publicId)
          ));
        }

        review.images = req.files.images.map(file => ({
          imageUrl: file.path,
          publicId: file.filename
        }));
      }

      await review.save();
      await this.recalculateBoardingHouseRating(review.boardingHouseId);

      return res.status(200).json(
        { success: true, message: 'Review updated successfully', review }
      );
    } catch (error) {
      console.error('Error:', error);
      if (req.files?.images) {
        await Promise.all(req.files.images.map(file => cloudinary.uploader.destroy(file.filename)));
      }
      return res.status(500).json(
        { success: false, message: 'Server Error', error: error.message }
      );
    }
  }
  // Xem review của user
  async softDeleteOwnReview(req, res) {
    try {
      const { reviewId } = req.params;
      const accountId = req.user?.userId;

      if (!accountId) {
        return res.status(401).json({
          success: false,
          message: 'Account ID not found.',
        });
      }

      const review = await Review.findOne({
        _id: reviewId,
        accountId,
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found',
        });
      }

      if (review.deleted === true) {
        return res.status(400).json({
          success: false,
          message: 'Review has already been deleted',
        });
      }

      await review.delete();

      if (!review.parentId) {
        await this.recalculateBoardingHouseRating(review.boardingHouseId);
      }

      return res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
        data: review,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message,
      });
    }
  }

  async getReviewsUser(req, res) {
    try {
      // 🔥 Lấy toàn bộ review gốc (không có parentId)
      const allReviews = await Review.find({ parentId: null }) // Chỉ lấy review gốc
        .populate({ path: 'accountId', select: 'username' })
        .populate({ path: 'boardingHouseId', select: 'name' }) // Chỉ lấy tên nhà trọ
        .sort({ createdAt: -1 });

      // 🔥 Tạo một object để lưu review gốc và reply
      const reviewMap = {};
      const reviews = [];

      allReviews.forEach((review) => {
        reviewMap[review._id.toString()] = {
          ...review.toObject(),
          replies: [], // Mảng chứa reply
          rating: review.rating, // Chỉ lấy rating của review gốc
        };
        reviews.push(reviewMap[review._id.toString()]);
      });

      // 🔥 Lấy tất cả reply (có parentId)
      const replies = await Review.find({ parentId: { $ne: null } }) // Chỉ lấy reply
        .populate({ path: 'accountId', select: 'username' })
        .populate({ path: 'boardingHouseId', select: 'name' }) // Chỉ lấy tên nhà trọ
        .sort({ createdAt: 1 });

      // 🔥 Gán reply vào review gốc tương ứng
      replies.forEach((reply) => {
        const parentId = reply.parentId.toString();
        if (reviewMap[parentId]) {
          reviewMap[parentId].replies.push(reply.toObject());
        }
      });

      return res.status(200).json({
        success: true,
        reviews,
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
        error: error.message,
      });
    }
  }
  // Xem chi tiết review của user
  async getReviewDetail(req, res) {
    try {
      const { reviewId } = req.params;

      // Tìm review theo ID và đảm bảo review tồn tại
      const review = await Review.findById(reviewId)
        .populate({
          path: 'accountId',
          select: 'username _id fullname avatarImage',
        })
        .populate({
          path: 'boardingHouseId',
          select: 'name',
        });

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Lấy danh sách phản hồi (replies) của review này
      const replies = await Review.find({ parentId: reviewId })
        .populate({
          path: 'accountId',
          select: 'username _id fullname avatarImage',
        })
        .sort({ createdAt: 1 });

      return res.status(200).json({ success: true, data: { review, replies } });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

}

export default new ReviewController();
