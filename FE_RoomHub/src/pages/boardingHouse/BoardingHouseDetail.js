import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBoardingHouseDetail } from "../../api/boardingHouse";
import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";

const BoardingHouseDetail = () => {
    const { id } = useParams();

    const [boardingHouse, setBoardingHouse] = useState(null);
    const [loading, setLoading] = useState(true);

    const lat = boardingHouse?.location?.lat;
    const lon = boardingHouse?.location?.lon;

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const result = await getBoardingHouseDetail(id);

                if (result.success) {
                    setBoardingHouse(result.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    const fakeAmenities = [
        "Wifi tốc độ cao",
        "Máy lạnh",
        "Camera an ninh",
        "Bãi giữ xe",
        "Máy giặt",
        "Giờ giấc tự do",
    ];

    const fakeReviews = [
        {
            name: "Thanh Nam",
            rating: 5,
            comment:
                "Phòng sạch sẽ, đúng như mô tả, chủ trọ hỗ trợ rất nhiệt tình.",
        },
        {
            name: "Lan Hương",
            rating: 4,
            comment:
                "Khu vực an ninh tốt, gần trung tâm, rất đáng để thuê.",
        },
    ];

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <h3>Loading...</h3>
            </div>
        );
    }

    if (!boardingHouse) {
        return (
            <div className="container py-5 text-center">
                <h3>Không tìm thấy nhà trọ</h3>
            </div>
        );
    }

    const colors = {
        primary: "#ab3600",
        primaryLight: "#ff5f1f",
        background: "#f8f9ff",
        border: "#e3bfb3",
        text: "#0d1c2e",
    };

    return (
        <div>
            <Header />


            {/* HEADER */}
            <div className="container py-5">

                <h1 className="fw-bold display-5">
                    {boardingHouse.name}
                </h1>

                <div className="d-flex flex-wrap gap-4 text-muted mt-2">

                    <span>
                        ⭐ {boardingHouse.rating}
                    </span>

                    <span>
                        ❤️ {boardingHouse.likes}
                    </span>

                    <span>
                        📍 {boardingHouse.address?.detail},{" "}
                        {boardingHouse.address?.ward?.name},{" "}
                        {boardingHouse.address?.district?.name},{" "}
                        {boardingHouse.address?.province?.name}
                    </span>
                </div>

                <h2
                    className="fw-bold mt-3"
                    style={{ color: colors.primaryLight }}
                >
                    {boardingHouse.priceRange?.toLocaleString()} VNĐ / tháng
                </h2>



                {/* GALLERY */}
                <div className="row g-2 mb-5">

                    <div className="col-lg-6">

                        <img
                            src={boardingHouse.images?.[0]?.imageUrl}
                            alt={boardingHouse.name}
                            className="w-100 rounded shadow"
                            style={{
                                height: "500px",
                                objectFit: "cover",
                            }}
                        />

                    </div>

                    <div className="col-lg-6">

                        <div className="row g-2">

                            {[...boardingHouse.images,
                            ...boardingHouse.images,
                            ...boardingHouse.images]
                                .slice(1, 5)
                                .map((img, index) => (
                                    <div
                                        className="col-6"
                                        key={index}
                                    >
                                        <img
                                            src={img.imageUrl}
                                            alt=""
                                            className="w-100 rounded shadow-sm"
                                            style={{
                                                height: "245px",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </div>
                                ))}

                        </div>

                    </div>

                </div>

                <div className="row">
                    <div className="col-lg-8">
                        <div
                            className="card shadow-sm mb-4"
                            style={{
                                border: `1px solid ${colors.border}`,
                                borderRadius: "16px",
                                background: "#fff",
                            }}
                        >
                            <div className="card-body">

                                <div className="row text-center">

                                    <div className="col-md-3">
                                        <h6 className="text-muted">
                                            Loại
                                        </h6>

                                        <p className="fw-bold">
                                            {boardingHouse.boardingHouseType?.name}
                                        </p>
                                    </div>

                                    <div className="col-md-3">
                                        <h6 className="text-muted">
                                            Phòng trống
                                        </h6>

                                        <p className="fw-bold">
                                            {boardingHouse.availableRooms}/
                                            {boardingHouse.totalRooms}
                                        </p>
                                    </div>

                                    <div className="col-md-3">
                                        <h6 className="text-muted">
                                            Điện
                                        </h6>

                                        <p className="fw-bold">
                                            {boardingHouse.electricityPrice?.toLocaleString()}đ
                                        </p>
                                    </div>

                                    <div className="col-md-3">
                                        <h6 className="text-muted">
                                            Nước
                                        </h6>

                                        <p className="fw-bold">
                                            {boardingHouse.waterPrice?.toLocaleString()}đ
                                        </p>
                                    </div>

                                </div>

                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        <div
                            className="card shadow-sm mb-4"
                            style={{
                                border: `1px solid ${colors.border}`,
                                borderRadius: "16px",
                                background: "#fff",
                            }}
                        >                            <div className="card-body">

                                <h4 className="fw-bold mb-3">
                                    Mô tả chi tiết
                                </h4>

                                <p
                                    style={{
                                        color: "#5b4138",
                                        lineHeight: "1.8",
                                    }}
                                >
                                    {boardingHouse.description}
                                </p>

                            </div>
                        </div>

                        {/* AMENITIES */}
                        <div
                            className="card shadow-sm mb-4"
                            style={{
                                border: `1px solid ${colors.border}`,
                                borderRadius: "16px",
                                background: "#fff",
                            }}
                        >                            <div className="card-body">

                                <h4 className="fw-bold mb-4">
                                    Tiện nghi
                                </h4>

                                <div className="row">

                                    {fakeAmenities.map((item, index) => (
                                        <div
                                            className="col-md-4 mb-3"
                                            key={index}
                                        >
                                            ✅ {item}
                                        </div>
                                    ))}

                                </div>

                            </div>
                        </div>

                        {/* LOCATION */}
                        {lat && lon ? (
                            <iframe
                                title="map"
                                width="100%"
                                height="400"
                                style={{
                                    border: 0,
                                    borderRadius: "12px",
                                }}
                                loading="lazy"
                                allowFullScreen
                                src={`https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`}
                            />
                        ) : (
                            <div
                                style={{
                                    background: "#eff4ff",
                                    color: "#545f73",
                                    padding: "16px",
                                    borderRadius: "12px",
                                    border: `1px solid ${colors.border}`,
                                }}
                            >                                Chưa có dữ liệu vị trí
                            </div>
                        )}

                        {/* REVIEWS */}
                        <div className="card border-0 shadow-sm">

                            <div className="card-body">

                                <h4 className="fw-bold mb-4">
                                    Đánh giá
                                </h4>

                                {fakeReviews.map((review, index) => (
                                    <div
                                        key={index}
                                        className="border-bottom pb-3 mb-3"
                                    >
                                        <h6 className="fw-bold">
                                            {review.name}
                                        </h6>

                                        <div className="mb-2">
                                            {"⭐".repeat(review.rating)}
                                        </div>

                                        <p className="text-muted">
                                            {review.comment}
                                        </p>
                                    </div>
                                ))}

                            </div>

                        </div>

                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="col-lg-4">

                        <div
                            className="card shadow-sm"
                            style={{
                                position: "sticky",
                                top: "100px",
                                border: `1px solid ${colors.border}`,
                                borderRadius: "16px",
                                background: "#fff",
                            }}
                        >

                            <div className="card-body">

                                <div className="text-center">

                                    <img
                                        src="https://i.pravatar.cc/150"
                                        alt=""
                                        className="rounded-circle mb-3"
                                        width="90"
                                        height="90"
                                    />

                                    <h5>
                                        {boardingHouse.ownerId?.fullname}
                                    </h5>

                                    <p className="text-muted">
                                        Chủ trọ đã xác thực
                                    </p>

                                </div>

                                <hr />

                                <h3
                                    className="fw-bold mb-4"
                                    style={{ color: colors.primaryLight }}
                                >
                                    {boardingHouse.priceRange?.toLocaleString()}
                                    {" "}VNĐ

                                </h3>

                                <div className="mb-3">

                                    <strong>Email:</strong>
                                    <br />
                                    {boardingHouse.ownerId?.email}

                                </div>

                                <div className="mb-4">

                                    <strong>Username:</strong>
                                    <br />
                                    {boardingHouse.ownerId?.username}

                                </div>

                                <button className="btn btn-primary w-100 mb-2">
                                    📞 Gọi ngay
                                </button>

                                <button className="btn btn-outline-primary w-100">
                                    💬 Nhắn tin
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

                {/* RELATED */}
                <div className="mt-5">

                    <h3 className="fw-bold mb-4">
                        Nhà trọ tương tự
                    </h3>

                    <div className="row">

                        {[1, 2, 3].map((item) => (
                            <div
                                className="col-md-4 mb-4"
                                key={item}
                            >

                                <div className="card border-0 shadow-sm h-100">

                                    <img
                                        src={`https://picsum.photos/400/250?random=${item}`}
                                        alt=""
                                        className="card-img-top"
                                        style={{
                                            height: "220px",
                                            objectFit: "cover",
                                        }}
                                    />

                                    <div className="card-body">

                                        <h5 className="fw-bold">
                                            Nhà trọ cao cấp
                                        </h5>

                                        <p className="text-muted">
                                            Ninh Kiều, Cần Thơ
                                        </p>

                                        <h6 className="text-danger fw-bold">
                                            3.000.000 VNĐ
                                        </h6>

                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>

                </div>
            </div>
            <Footer />


        </div>
    );
};

export default BoardingHouseDetail;