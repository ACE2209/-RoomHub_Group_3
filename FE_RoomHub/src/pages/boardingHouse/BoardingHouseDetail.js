import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    getBoardingHouseDetail,
    getBoardingHouseReviews,
} from "../../api/boardingHouse";
import ReportModal from "../../components/ReportModal";
import { checkReportExist } from "../../api/reportAPI";

const BoardingHouseDetail = () => {
    const { id } = useParams();

    const [boardingHouse, setBoardingHouse] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportedReviews, setReportedReviews] = useState([]);
    const [reportedBoardingHouse, setReportedBoardingHouse] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const [detailResult, reviewResult] = await Promise.all([
                    getBoardingHouseDetail(id),
                    getBoardingHouseReviews(id),
                ]);

                if (detailResult.success) {
                    setBoardingHouse(detailResult.data);
                }

                if (reviewResult.success) {
                    setReviews(reviewResult.data || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const fetchReportState = async () => {
            try {
                const res = await checkReportExist({
                    reviewIds: reviews.map((review) => review._id),
                    boardingHouseId: id,
                });

                if (res?.success) {
                    setReportedReviews(res.reportedReviews || []);
                    setReportedBoardingHouse(Boolean(res.reportedBoardingHouse));
                }
            } catch (error) {
                console.error("Check report status failed:", error);
            }
        };

        fetchReportState();
    }, [id, reviews]);

    if (loading) return <h2>Loading...</h2>;

    if (!boardingHouse) return <h2>Không tìm thấy nhà trọ</h2>;

    const handleReportSubmitted = ({ targetId, reportType }) => {
        if (reportType === "boardingHouse") {
            setReportedBoardingHouse(true);
            return;
        }

        if (reportType === "review") {
            setReportedReviews((prev) => (
                prev.includes(targetId) ? prev : [...prev, targetId]
            ));
        }
    };

    return (
        <div className="container">
            <h1>{boardingHouse.name}</h1>

            <button
                type="button"
                disabled={reportedBoardingHouse}
                onClick={() => setReportTarget({ id: boardingHouse._id, type: "boardingHouse" })}
                style={{
                    marginBottom: 16,
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: reportedBoardingHouse ? "1px solid #d0d5dd" : "1px solid #fecdca",
                    background: reportedBoardingHouse ? "#f2f4f7" : "#fef3f2",
                    color: reportedBoardingHouse ? "#667085" : "#d92d20",
                    fontWeight: 700,
                    cursor: reportedBoardingHouse ? "not-allowed" : "pointer",
                }}
            >
                {reportedBoardingHouse ? "Already reported" : "Report this boarding house"}
            </button>

            <img
                src={boardingHouse.images?.[0]?.imageUrl}
                alt={boardingHouse.name}
                style={{
                    width: "100%",
                    maxHeight: "500px",
                    objectFit: "cover",
                    borderRadius: "12px",
                }}
            />

            <h3>Mô tả</h3>
            <p>{boardingHouse.description}</p>

            <h3>Thông tin</h3>

            <p>
                <strong>Loại:</strong>{" "}
                {boardingHouse.boardingHouseType?.name}
            </p>

            <p>
                <strong>Giá từ:</strong>{" "}
                {boardingHouse.priceRange?.toLocaleString()} VNĐ
            </p>

            <p>
                <strong>Số phòng:</strong>{" "}
                {boardingHouse.availableRooms}/
                {boardingHouse.totalRooms}
            </p>

            <p>
                <strong>Điện:</strong>{" "}
                {boardingHouse.electricityPrice?.toLocaleString()} VNĐ
            </p>

            <p>
                <strong>Nước:</strong>{" "}
                {boardingHouse.waterPrice?.toLocaleString()} VNĐ
            </p>

            <p>
                <strong>Đánh giá:</strong>{" "}
                {boardingHouse.rating} ⭐
            </p>

            <h3>Địa chỉ</h3>

            <p>
                {boardingHouse.address?.detail},{" "}
                {boardingHouse.address?.ward?.name},{" "}
                {boardingHouse.address?.district?.name},{" "}
                {boardingHouse.address?.province?.name}
            </p>

            <h3>Chủ trọ</h3>

            <p>{boardingHouse.ownerId?.fullname}</p>
            <p>{boardingHouse.ownerId?.email}</p>
            <p>{boardingHouse.ownerId?.username}</p>

            <h3>Reviews</h3>
            {reviews.length > 0 ? (
                <div style={{ display: "grid", gap: 12, marginBottom: 30 }}>
                    {reviews.map((review) => {
                        const isReported = reportedReviews.includes(review._id);

                        return (
                            <div
                                key={review._id}
                                style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 8,
                                    padding: 16,
                                    background: "#ffffff",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <div>
                                        <strong>{review.accountId?.fullname || review.accountId?.username || "User"}</strong>
                                        <p style={{ margin: "6px 0", color: "#667085" }}>
                                            Rating: {review.rating || "N/A"} ⭐
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isReported}
                                        onClick={() => setReportTarget({ id: review._id, type: "review" })}
                                        style={{
                                            alignSelf: "flex-start",
                                            padding: "8px 12px",
                                            borderRadius: 6,
                                            border: "1px solid #d0d5dd",
                                            background: isReported ? "#f2f4f7" : "#ffffff",
                                            color: isReported ? "#98a2b3" : "#344054",
                                            cursor: isReported ? "not-allowed" : "pointer",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {isReported ? "Reported" : "Report Review"}
                                    </button>
                                </div>
                                <p>{review.content || "No content"}</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p>No reviews yet.</p>
            )}

            <ReportModal
                isOpen={Boolean(reportTarget)}
                onClose={() => setReportTarget(null)}
                targetId={reportTarget?.id}
                reportType={reportTarget?.type}
                onSubmitted={handleReportSubmitted}
            />
        </div>
    );
};

export default BoardingHouseDetail;
