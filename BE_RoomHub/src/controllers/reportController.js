import Report from "../models/report.js";
import Review from "../models/review.js";

class reportController {
  // LIST REVIEW REPORTS
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

  // VIEW REPORT DETAIL
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

  // DELETE REVIEW REPORT
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

  // Filter multiple report reviews
  async filterReviewReports(req, res) {
  try {
    const { startDate, endDate, reason, status } = req.query;

    const validReasons = [
      "Spam",
      "Misleading information",
      "Privacy violation",
      "Inappropriate content",
    ];

    const validStatuses = ["pending", "processed", "rejected"];

    const filter = {
      reportType: { $regex: /^review$/i },
    };

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let start = null;
    let end = null;

    if (startDate) {
      start = new Date(`${startDate}T00:00:00.000Z`);

      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: "Invalid start date" });
      }

      if (start > today) {
        return res.status(400).json({
          message: "Start date cannot be in the future",
        });
      }
    }

    if (endDate) {
      end = new Date(`${endDate}T23:59:59.999Z`);

      if (isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid end date" });
      }

      if (end > today) {
        return res.status(400).json({
          message: "End date cannot be in the future",
        });
      }
    }

    if (start && end && start > end) {
      return res.status(400).json({
        message: "Start date cannot be greater than end date",
      });
    }

    if (status) {
      const normalizedStatus = status.trim().toLowerCase();

      const matchedStatus = validStatuses.find(
        (item) => item.toLowerCase() === normalizedStatus
      );

      if (!matchedStatus) {
        return res.status(400).json({ message: "Invalid status" });
      }

      filter.status = matchedStatus;
    }

    if (reason) {
      const normalizedReason = reason.trim().toLowerCase();

      const matchedReason = validReasons.find(
        (item) => item.toLowerCase() === normalizedReason
      );

      if (!matchedReason) {
        return res.status(400).json({ message: "Invalid reason" });
      }

      filter.reason = { $regex: matchedReason, $options: "i" };
    }

    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = start;
      if (end) filter.createdAt.$lte = end;
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "reporter",
        select: "fullname email",
      })
      .populate({
        path: "processedBy",
        select: "fullname",
      });

    return res.status(200).json(reports);
  } catch (error) {
    console.error("Error filtering review reports:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
}
}

export default new reportController();