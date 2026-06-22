import Review from "../models/review.js";
import paginate from "../utils/pagination.js";

class ReviewController {
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
}

export default new ReviewController();
