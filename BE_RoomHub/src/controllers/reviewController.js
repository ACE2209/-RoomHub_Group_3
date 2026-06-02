import Review from "../models/review.js";
import paginate from "../utils/pagination.js";

class ReviewController {
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
          // {
          //   path: "boardingHouseId",
          //   select: "name",
          // },
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

  // View Review Detail in Admin
  async getReviewDetail(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findById(reviewId)
        .populate({
          path: "accountId",
          select: "username _id fullname avatarImage",
        })
        // .populate({
        //   path: "boardingHouseId",
        //   select: "name",
        // })
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
}

export default new ReviewController();