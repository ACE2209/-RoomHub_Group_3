import Report from '../models/report.js';
import { Account } from '../models/account.js';
import nodemailer from 'nodemailer';

class reportController {
  async createReport(req, res) {
    try {
      const { reportType, targetId, reason, details } = req.body;
      const reporter = req.user.userId;

      if (!reportType || !targetId || !reason || !details) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }

      // Check if already reported
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

      const newReport = new Report({
        reportType,
        targetId,
        reason,
        details,
        reporter,
        reportTypeRef: reportType === 'review' ? 'Review' : 'Room',
      });

      await newReport.save();
      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: newReport,
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating report',
      });
    }
  }

  async getReportsByAdmin(req, res) {
    try {
      const reports = await Report.find({ deleted: false })
        .populate('reporter', 'fullname email')
        .populate('processedBy', 'fullname')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching reports',
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

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error fetching report detail:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching report detail',
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

      // Get original report
      const report = await Report.findById(reportId)
        .populate('reporter', 'fullname email')
        .populate('processedBy', 'fullname');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      // Find all related reports (same targetId and reason)
      const relatedReports = await Report.find({
        targetId: report.targetId,
        reason: report.reason,
        deleted: false,
      }).populate('reporter', 'fullname email');

      if (relatedReports.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No related reports found',
        });
      }

      // Set processedBy if not set
      if (!report.processedBy) {
        const account = await Account.findById(req.user.userId).select(
          'fullname'
        );
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

      // Update all related reports
      await Report.updateMany(
        { targetId: report.targetId, reason: report.reason },
        { $set: { status, detailReport, processedBy: report.processedBy } }
      );

      // Configure email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'support@roomhub.com',
          pass: process.env.GMAIL_PASSWORD || '',
        },
      });

      // Send email to all reporters
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

      res.status(200).json({
        success: true,
        message: 'Report processed and emails sent successfully',
      });
    } catch (error) {
      console.error('Error sending report reply:', error);
      res.status(500).json({
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

      res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting report',
      });
    }
  }
}

export default new reportController();
