import Report from '../models/report.js';
import Review from '../models/review.js';
import BoardingHouse from '../models/boardingHouse.js';
import { Account } from '../models/account.js';
import nodemailer from 'nodemailer';
import paginate from '../utils/pagination.js';
import mongoose from 'mongoose';

const ACTIVE_REPORT_STATUSES = ['pending', 'processing'];
const VALID_REPORT_STATUSES = ['pending', 'processing', 'resolved', 'rejected'];
const VALID_REPORT_REASONS = [
  'Spam',
  'Misleading information',
  'Privacy violation',
  'Inappropriate content',
  'Offensive language',
  'Other',
];

const reportTypeRefMap = {
  review: 'Review',
  boardingHouse: 'BoardingHouse',
};

class reportController {
  async createReport(req, res) {
    try {
      const { reportType, targetId, reason, details } = req.body;
      const reporter = req.user.userId;
      const images = (req.files || []).map((file) => ({
        imageUrl: file.path,
        publicId: file.filename || file.public_id || '',
      }));

      if (!reportType || !targetId || !reason || !details) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }

      if (!reportTypeRefMap[reportType]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or unsupported report type',
        });
      }

      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report target',
        });
      }

      if (!VALID_REPORT_REASONS.includes(reason)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report reason',
        });
      }

      const target = await this.resolveReportTarget({ reportType, targetId });
      if (!target) {
        return res.status(404).json({
          success: false,
          message: 'Report target not found',
        });
      }

      const existingReport = await Report.findOne({
        reporter,
        reportType,
        targetId,
        status: { $in: ACTIVE_REPORT_STATUSES },
        deleted: { $ne: true },
      });

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: `You already reported this ${reportType}. Please wait for admin to process.`,
        });
      }

      const reportTypeRef = reportTypeRefMap[reportType];

      const newReport = new Report({
        reportType,
        targetId,
        reason,
        details,
        reporter,
        reportTypeRef,
        images,
      });

      await newReport.save();

      return res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: newReport,
      });
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error creating report',
      });
    }
  }

  async getReportsByAdmin(req, res) {
    try {
      const reports = await Report.find({ deleted: { $ne: true } })
        .populate('reporter', 'fullname email')
        .populate('processedBy', 'fullname')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error fetching reports',
      });
    }
  }

  async getReviewReports(req, res) {
    try {
      const reviewReports = await Report.find({
        reportType: { $regex: /^review$/i },
        deleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .populate('reporter', 'fullname email')
        .populate('processedBy', 'fullname');

      return res.status(200).json(reviewReports);
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async getBoardingHouseReports(req, res) {
    try {
      const reports = await Report.find({
        reportType: { $regex: /^boardingHouse$/i },
        deleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .populate('reporter', 'fullname email avatarImage phone')
        .populate('processedBy', 'fullname')
        .populate('targetId', 'name description address priceRange rating totalRooms availableRooms images');

      return res.status(200).json(reports);
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async filterBoardingHouseReports(req, res) {
    try {
      const { startDate, endDate, reason, status } = req.query;

      const filter = {
        reportType: { $regex: /^boardingHouse$/i },
        deleted: { $ne: true },
      };

      const validStatuses = ['pending', 'processing', 'resolved', 'rejected'];
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      let start = null;
      let end = null;

      if (startDate) {
        start = new Date(`${startDate}T00:00:00.000Z`);

        if (isNaN(start.getTime())) {
          return res.status(400).json({ message: 'Invalid start date' });
        }

        if (start > today) {
          return res.status(400).json({
            message: 'Start date cannot be in the future',
          });
        }
      }

      if (endDate) {
        end = new Date(`${endDate}T23:59:59.999Z`);

        if (isNaN(end.getTime())) {
          return res.status(400).json({ message: 'Invalid end date' });
        }

        if (end > today) {
          return res.status(400).json({
            message: 'End date cannot be in the future',
          });
        }
      }

      if (start && end && start > end) {
        return res.status(400).json({
          message: 'Start date cannot be greater than end date',
        });
      }

      if (status) {
        const normalizedStatus = status.trim().toLowerCase();
        const matchedStatus = validStatuses.find(
          (item) => item.toLowerCase() === normalizedStatus
        );

        if (!matchedStatus) {
          return res.status(400).json({ message: 'Invalid status' });
        }

        filter.status = matchedStatus;
      }

      if (reason) {
        filter.reason = { $regex: reason.trim(), $options: 'i' };
      }

      if (start || end) {
        filter.createdAt = {};
        if (start) filter.createdAt.$gte = start;
        if (end) filter.createdAt.$lte = end;
      }

      const reports = await Report.find(filter)
        .sort({ createdAt: -1 })
        .populate('reporter', 'fullname email avatarImage phone')
        .populate('processedBy', 'fullname')
        .populate('targetId', 'name description address priceRange rating totalRooms availableRooms images');

      return res.status(200).json(reports);
    } catch (error) {
      console.error('Error filtering boarding house reports:', error);
      return res.status(500).json({
        message: 'Server Error',
        error: error.message,
      });
    }
  }

  async getReportDetail(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findById(reportId)
        .populate('reporter', 'fullname email')
        .populate('processedBy', 'fullname');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error fetching report detail:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error fetching report detail',
      });
    }
  }

  async getReportReviewDetail(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findById(reportId)
        .populate('reporter', 'fullname email avatarImage')
        .populate('processedBy', 'fullname');

      if (!report) {
        return res.status(404).json({
          message: 'Report not found',
        });
      }

      const review = await Review.findOne(
        { _id: report.targetId },
        null,
        { withDeleted: true }
      ).populate({
        path: 'accountId',
        select: 'fullname email avatarImage',
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

  async getOwnReports(req, res) {
    try {
      const reporter = req.user.userId;
      req.query.page = req.query.page || '1';
      req.query.limit = req.query.limit || '10';

      const result = await paginate(
        Report,
        {
          defaultPage: 1,
          defaultLimit: 10,
          sortField: 'createdAt',
          filter: {
            reporter,
            deleted: { $ne: true },
          },
          populate: [
            { path: 'reporter', select: 'fullname email avatarImage' },
            { path: 'processedBy', select: 'fullname' },
          ],
        },
        req
      );

      const data = await Promise.all(
        result.data.map(async (report) => {
          const target = await this.resolveReportTarget(report);
          return {
            ...report,
            target,
            targetName: target?.name || target?.content || target?.accountId?.fullname || 'N/A',
          };
        })
      );

      return res.status(200).json({
        ...result,
        data,
      });
    } catch (error) {
      console.error('Error fetching own reports:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error fetching own reports',
      });
    }
  }

  async getOwnReportDetail(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findOne({
        _id: reportId,
        reporter: req.user.userId,
        deleted: { $ne: true },
      })
        .populate('reporter', 'fullname email avatarImage')
        .populate('processedBy', 'fullname')
        .lean();

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      const target = await this.resolveReportTarget(report);

      return res.status(200).json({
        success: true,
        data: {
          ...report,
          target,
        },
      });
    } catch (error) {
      console.error('Error fetching own report detail:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error fetching own report detail',
      });
    }
  }

  async checkReportExist(req, res) {
    try {
      const { reviewIds, boardingHouseId } = req.query;
      const reporter = req.user.userId;
      const ids = Array.isArray(reviewIds)
        ? reviewIds
        : String(reviewIds || '')
            .split(',')
            .filter(Boolean);

      const reportedReviews = ids.length
        ? await Report.find({
            reporter,
            reportType: 'review',
            targetId: { $in: ids },
            status: { $in: ACTIVE_REPORT_STATUSES },
            deleted: { $ne: true },
          }).distinct('targetId')
        : [];

      const boardingHouseReport = boardingHouseId
        ? await Report.exists({
            reporter,
            reportType: 'boardingHouse',
            targetId: boardingHouseId,
            status: { $in: ACTIVE_REPORT_STATUSES },
            deleted: { $ne: true },
          })
        : null;

      return res.status(200).json({
        success: true,
        reportedReviews: reportedReviews.map(String),
        reportedBoardingHouse: Boolean(boardingHouseReport),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error checking report status',
      });
    }
  }

  async resolveReportTarget(report) {
    if (!report?.targetId) return null;

    if (report.reportType === 'review') {
      return Review.findOne({ _id: report.targetId }, null, { withDeleted: true })
        .populate('accountId', 'fullname email avatarImage')
        .lean();
    }

    if (report.reportType === 'boardingHouse') {
      return BoardingHouse.findOne({ _id: report.targetId }, null, { withDeleted: true })
        .populate('boardingHouseType', 'name codeName')
        .populate('ownerId', 'fullname email')
        .lean();
    }

    return null;
  }

  async sendReportReplyByEmail(req, res) {
    try {
      const { reportId } = req.params;
      const { status, detailReport } = req.body;

      if (!status || !detailReport) {
        return res.status(400).json({
          success: false,
          message: 'Status and detail report are required',
        });
      }

      if (!VALID_REPORT_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report status',
        });
      }

      const report = await Report.findById(reportId)
        .populate('reporter', 'fullname email')
        .populate('processedBy', 'fullname');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      const relatedReports = await Report.find({
        targetId: report.targetId,
        reason: report.reason,
        deleted: { $ne: true },
      }).populate('reporter', 'fullname email');

      if (relatedReports.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No related reports found',
        });
      }

      if (!report.processedBy) {
        const account = await Account.findById(req.user.userId).select('fullname');
        if (!account) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }
        report.processedBy = account._id;
        await report.save();
      }

      const updatedReport = await Report.findById(reportId).populate(
        'processedBy',
        'fullname'
      );
      const processedByName = updatedReport.processedBy
        ? updatedReport.processedBy.fullname
        : 'Admin';

      await Report.updateMany(
        {
          targetId: report.targetId,
          reportType: report.reportType,
          reason: report.reason,
          deleted: { $ne: true },
        },
        { $set: { status, detailReport, processedBy: report.processedBy } }
      );

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'support@roomhub.com',
          pass: process.env.GMAIL_PASSWORD || '',
        },
      });

      for (const relatedReport of relatedReports) {
        const mailOptions = {
          from: 'RoomHub Support <support@roomhub.com>',
          to: relatedReport.reporter.email,
          subject: `Report Response: #${relatedReport._id}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <p>Dear ${relatedReport.reporter.fullname},</p>
              <p>Thank you for submitting a report about <strong>"${relatedReport.reason}"</strong> on RoomHub.</p>
              <p>We are pleased to inform you that your report has been processed with the following results:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Report Status:</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${status}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Report Date:</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${new Date(
                    relatedReport.createdAt
                  ).toLocaleDateString()}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Processed By:</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${processedByName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Process Date:</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${new Date().toLocaleDateString()}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 10px; border: 1px solid #ddd; vertical-align: top;"><strong>Result:</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${detailReport}</td>
                </tr>
              </table>
              <p>If you have any further questions or need additional support, please contact us at <a href="mailto:support@roomhub.com">support@roomhub.com</a>.</p>
              <p>Thank you,<br>RoomHub Support Team</p>
            </div>
          `,
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Report processed and emails sent successfully',
      });
    } catch (error) {
      console.error('Error sending report reply:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error processing report',
      });
    }
  }

  async softDeleteReport(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findByIdAndUpdate(
        reportId,
        { deleted: true },
        { new: true }
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
        report,
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error deleting report',
      });
    }
  }

  // Filter multiple report reviews
  async filterReviewReports(req, res) {
  try {
    const { startDate, endDate, reason, status } = req.query;

    const filter = {
      reportType: { $regex: /^review$/i },
      deleted: { $ne: true },
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

      const matchedStatus = VALID_REPORT_STATUSES.find(
        (item) => item.toLowerCase() === normalizedStatus
      );

      if (!matchedStatus) {
        return res.status(400).json({ message: "Invalid status" });
      }

      filter.status = matchedStatus;
    }

    if (reason) {
      const normalizedReason = reason.trim().toLowerCase();

      const matchedReason = VALID_REPORT_REASONS.find(
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
