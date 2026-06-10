import Report from "../models/report.js";
import Review from "../models/review.js";

class reportController {
  // ==========================
  // LIST REVIEW REPORTS
  // ==========================
  async getReviewReports(req, res) {
    try {
      const reviewReports = await Report.find({
        reportType: { $regex: /^review$/i },
      })
        .sort({ createdAt: -1 })
        .populate({
          path: "reporter",
          select: "fullname email",
        })
        .populate({
          path: "processedBy",
          select: "fullname",
        });

      return res.status(200).json(reviewReports);
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  // ==========================
  // VIEW REPORT DETAIL
  // ==========================
  async getReportReviewDetail(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findById(reportId)
        .populate({
          path: "reporter",
          select: "fullname email avatarImage",
        })
        .populate({
          path: "processedBy",
          select: "fullname",
        });

      if (!report) {
        return res.status(404).json({
          message: "Report not found",
        });
      }

      const review = await Review.findOne(
        { _id: report.targetId },
        null,
        { withDeleted: true }
      ).populate({
        path: "accountId",
        select: "fullname email avatarImage",
      });

      return res.status(200).json({
        ...report.toObject(),
        target: review,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  // ==========================
  // DELETE REVIEW REPORT
  // ==========================
  async softDeleteReport(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findByIdAndUpdate(
        reportId,
        {
          deleted: true,
        },
        {
          new: true,
        }
      );

      if (!report) {
        return res.status(404).json({
          error: "Report not found",
        });
      }

      return res.status(200).json({
        message: "Report soft deleted successfully",
        report,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }
}

export default new reportController();