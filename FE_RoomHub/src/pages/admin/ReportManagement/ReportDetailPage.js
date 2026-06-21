import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../../layout/admin/AdminLayout";
import { getReportDetail } from "../../../api/report";

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await getReportDetail(reportId);
        console.log("REPORT DETAIL RESPONSE:", res);
        setReport(res?._id ? res : null);
      } catch (error) {
        console.error("Fetch report detail failed:", error);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchDetail();
    } else {
      setLoading(false);
    }
  }, [reportId]);

  return (
    <AdminLayout>
      <div style={topStyle}>
        <div>
          <h2 style={titleStyle}>Report Detail</h2>
          <p style={subTitleStyle}>View report content and target review</p>
        </div>

        <Link to="/admin/reports" style={backBtnStyle}>
          Back
        </Link>
      </div>

      {loading ? (
        <div style={cardStyle}>Loading report detail...</div>
      ) : report ? (
        <div style={cardStyle}>
          <div style={infoGridStyle}>
            <div style={infoItemStyle}>
              <span style={labelStyle}>Reporter</span>
              <b>{report.reporter?.fullname || report.reporter?.email || "N/A"}</b>
            </div>

            <div style={infoItemStyle}>
              <span style={labelStyle}>Type</span>
              <b>{report.reportType || "N/A"}</b>
            </div>

            <div style={infoItemStyle}>
              <span style={labelStyle}>Status</span>
              <b>{report.status || (report.deleted ? "deleted" : "pending")}</b>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Reason</h3>
            <p style={contentStyle}>{report.reason || "N/A"}</p>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Details</h3>
            <p style={contentStyle}>{report.details || "N/A"}</p>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Target Review</h3>
            <pre style={preStyle}>
              {JSON.stringify(report.target || null, null, 2)}
            </pre>
          </div>

          {report.images?.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Images</h3>
              <div style={imageListStyle}>
                {report.images.map((img, index) => (
                  <img
                    key={img.publicId || img.imageUrl || index}
                    src={img.imageUrl}
                    alt="report"
                    style={imageStyle}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={cardStyle}>No report found</div>
      )}
    </AdminLayout>
  );
}

const topStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "28px",
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#27364a",
  margin: 0,
};

const subTitleStyle = {
  color: "#667085",
  marginTop: "6px",
};

const backBtnStyle = {
  background: "#2f80ed",
  color: "white",
  padding: "10px 18px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "600",
};

const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "28px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "18px",
};

const infoItemStyle = {
  background: "#f8fafc",
  borderRadius: "10px",
  padding: "16px",
};

const labelStyle = {
  display: "block",
  color: "#667085",
  fontSize: "14px",
  marginBottom: "6px",
};

const sectionStyle = {
  marginTop: "28px",
};

const sectionTitleStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#27364a",
};

const contentStyle = {
  background: "#f8fafc",
  padding: "18px",
  borderRadius: "10px",
  color: "#344054",
  lineHeight: "1.6",
};

const preStyle = {
  background: "#f8fafc",
  padding: "18px",
  borderRadius: "10px",
  color: "#344054",
  overflowX: "auto",
};

const imageListStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const imageStyle = {
  width: "120px",
  height: "120px",
  objectFit: "cover",
  borderRadius: "8px",
};
