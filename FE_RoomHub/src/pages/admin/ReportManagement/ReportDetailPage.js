import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../../layout/admin/AdminLayout";
import { getReportDetail } from "../../../api/report";

const statusColors = {
  pending: { background: "#fffaeb", color: "#b54708", borderColor: "#fedf89" },
  processing: { background: "#eef4ff", color: "#3538cd", borderColor: "#c7d7fe" },
  resolved: { background: "#ecfdf3", color: "#087443", borderColor: "#abefc6" },
  rejected: { background: "#fef3f2", color: "#b42318", borderColor: "#fecdca" },
};

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getReportDetail(reportId);
        setReport(res?.data || (res?._id ? res : null));
      } catch (err) {
        setReport(null);
        setError(err.message || "Unable to load review report detail");
      } finally {
        setLoading(false);
      }
    };

    if (reportId) fetchDetail();
  }, [reportId]);

  const review = report?.target;
  const boardingHouse = review?.boardingHouseId;

  return (
    <AdminLayout>
      <div style={topStyle}>
        <div>
          <h2 style={titleStyle}>Review Report Detail</h2>
          <p style={subTitleStyle}>Detailed report information and the reported review.</p>
        </div>
        <Link to="/admin/review-reports" style={backBtnStyle}>Back to List</Link>
      </div>

      {loading ? (
        <div style={cardStyle}>Loading review report detail...</div>
      ) : error ? (
        <div style={{ ...cardStyle, color: "#b42318" }}>{error}</div>
      ) : report ? (
        <div style={pageGridStyle}>
          <section style={cardStyle}>
            <h3 style={sectionHeadingStyle}>Report Information</h3>
            <div style={infoGridStyle}>
              <Info label="Report ID" value={report._id} />
              <Info label="Status" value={<StatusBadge status={report.status} />} />
              <Info label="Reason" value={report.reason} />
              <Info label="Submitted At" value={formatDate(report.createdAt)} />
              <Info label="Last Updated" value={formatDate(report.updatedAt)} />
              <Info label="Processed By" value={report.processedBy?.fullname || "Not processed yet"} />
            </div>

            <Block title="Reporter">
              <div style={personRowStyle}>
                {report.reporter?.avatarImage && <img src={report.reporter.avatarImage} alt="Reporter" style={avatarStyle} />}
                <div>
                  <strong>{report.reporter?.fullname || "N/A"}</strong>
                  <div style={mutedStyle}>{report.reporter?.email || "N/A"}</div>
                  {report.reporter?.phoneNumber && <div style={mutedStyle}>{report.reporter.phoneNumber}</div>}
                </div>
              </div>
            </Block>

            <Block title="Report Description">
              <p style={textBoxStyle}>{report.details || "No description"}</p>
            </Block>

            <Block title="Admin Response">
              <p style={textBoxStyle}>{report.detailReport || "No response yet"}</p>
            </Block>

            <ImageGallery title="Report Evidence" images={report.images} />
          </section>

          <section style={cardStyle}>
            <h3 style={sectionHeadingStyle}>Reported Review</h3>
            {review ? (
              <>
                <div style={infoGridStyle}>
                  <Info label="Review ID" value={review._id} />
                  <Info label="Rating" value={review.rating != null ? `${review.rating}/5` : "N/A"} />
                  <Info label="Review Date" value={formatDate(review.createdAt)} />
                  <Info label="Boarding House" value={boardingHouse?.name || "N/A"} />
                </div>

                <Block title="Review Author">
                  <div style={personRowStyle}>
                    {review.accountId?.avatarImage && <img src={review.accountId.avatarImage} alt="Review author" style={avatarStyle} />}
                    <div>
                      <strong>{review.accountId?.fullname || "N/A"}</strong>
                      <div style={mutedStyle}>{review.accountId?.email || "N/A"}</div>
                    </div>
                  </div>
                </Block>

                <Block title="Review Content">
                  <p style={textBoxStyle}>{review.content || "No review content"}</p>
                </Block>

                {boardingHouse && (
                  <Block title="Boarding House">
                    <div style={targetBoxStyle}>
                      <strong>{boardingHouse.name || "N/A"}</strong>
                      <span style={mutedStyle}>{formatAddress(boardingHouse.address)}</span>
                    </div>
                  </Block>
                )}

                <ImageGallery title="Review Images" images={review.images} />
              </>
            ) : (
              <div style={emptyTargetStyle}>The reported review was deleted or no longer exists. The report history is still preserved.</div>
            )}
          </section>
        </div>
      ) : (
        <div style={cardStyle}>No review report found.</div>
      )}
    </AdminLayout>
  );
}

function Info({ label, value }) {
  return <div style={infoItemStyle}><span style={labelStyle}>{label}</span><div style={valueStyle}>{value || "N/A"}</div></div>;
}
function Block({ title, children }) { return <div style={sectionStyle}><h4 style={blockTitleStyle}>{title}</h4>{children}</div>; }
function StatusBadge({ status = "pending" }) {
  const style = statusColors[status] || statusColors.pending;
  return <span style={{ ...badgeStyle, ...style }}>{status}</span>;
}
function ImageGallery({ title, images = [] }) {
  if (!images?.length) return null;
  return <Block title={title}><div style={imageListStyle}>{images.map((img, index) => <a key={img._id || img.publicId || img.imageUrl || index} href={img.imageUrl} target="_blank" rel="noreferrer"><img src={img.imageUrl} alt={`${title} ${index + 1}`} style={imageStyle} /></a>)}</div></Block>;
}
const formatDate = (value) => value ? new Date(value).toLocaleString("en-GB") : "N/A";
const formatAddress = (address) => [address?.detail, address?.ward?.name, address?.district?.name, address?.province?.name].filter(Boolean).join(", ") || "No address";

const topStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" };
const titleStyle = { fontSize: 28, fontWeight: 700, color: "#27364a", margin: 0 };
const subTitleStyle = { color: "#667085", marginTop: 6 };
const backBtnStyle = { background: "#2f80ed", color: "white", padding: "10px 18px", borderRadius: 6, textDecoration: "none", fontWeight: 600 };
const pageGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20, alignItems: "start" };
const cardStyle = { background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" };
const sectionHeadingStyle = { margin: "0 0 18px", color: "#27364a", fontSize: 20 };
const infoGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 };
const infoItemStyle = { background: "#f8fafc", borderRadius: 8, padding: 14, minWidth: 0 };
const labelStyle = { display: "block", color: "#667085", fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" };
const valueStyle = { color: "#344054", fontWeight: 600, overflowWrap: "anywhere" };
const sectionStyle = { marginTop: 22 };
const blockTitleStyle = { margin: "0 0 10px", color: "#27364a", fontSize: 16 };
const textBoxStyle = { margin: 0, whiteSpace: "pre-wrap", background: "#f8fafc", borderRadius: 8, padding: 14, color: "#344054", lineHeight: 1.6 };
const personRowStyle = { display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", borderRadius: 8, padding: 14 };
const avatarStyle = { width: 46, height: 46, borderRadius: "50%", objectFit: "cover" };
const mutedStyle = { color: "#667085", marginTop: 3, overflowWrap: "anywhere" };
const targetBoxStyle = { background: "#f8fafc", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 5 };
const imageListStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 };
const imageStyle = { width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" };
const badgeStyle = { display: "inline-flex", border: "1px solid", borderRadius: 999, padding: "4px 9px", fontSize: 12, fontWeight: 700, textTransform: "capitalize" };
const emptyTargetStyle = { background: "#fffaeb", color: "#b54708", border: "1px solid #fedf89", borderRadius: 8, padding: 14 };
