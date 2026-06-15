import Report from '../models/report.js';
import Review from '../models/review.js';
import { Account } from '../models/account.js';
import nodemailer from 'nodemailer';

class reportController {
  async createReport(req, res) {
    try {
      const { reportType, targetId, reason, details, images = [] } = req.body;
      const reporter = req.user.userId;

      if (!reportType || !targetId || !reason || !details) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }

      const existingReport = await Report.findOne({
        reporter,
        targetId,
        status: 'pending',
      });

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: `You already reported this ${reportType}. Please wait for admin to process.`,
        });
      }

      const reportTypeRef = reportType === 'boardingHouse' ? 'BoardingHouse' : 'Review';

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
        { targetId: report.targetId, reason: report.reason },
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
}

export default new reportController();
