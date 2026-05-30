import Review from '../models/review.js';

class ReviewController {
  // View Review in Admin
  async getReviews(req, res) {
    try {
      const reviews = await Review.find({ parentId: null })
        .populate({
          path: 'accountId',
          select: 'username _id fullname avatarImage',
        })
        // .populate({
        //   path: 'boardingHouseId',
        //   select: 'name',
        // })
        .sort({ createdAt: 1 });

      return res.status(200).json(reviews);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // View Review Detail in Admin
  async getReviewDetail(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findById(reviewId)
        .populate({
          path: 'accountId',
          select: 'username _id fullname avatarImage',
        })
        // .populate({
        //   path: 'boardingHouseId',
        //   select: 'name',
        // })
;
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      const replies = await Review.find({ parentId: reviewId })
        .populate({
          path: 'accountId',
          select: 'username _id fullname avatarImage',
        })
        .sort({ createdAt: 1 });

      return res.status(200).json({
        success: true,
        data: { review, replies },
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export default new ReviewController();