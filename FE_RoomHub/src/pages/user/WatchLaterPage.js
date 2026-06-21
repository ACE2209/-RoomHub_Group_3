import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWatchLater, deleteWatchLater } from "../../api/watchLater";
import { Clock, Star, MapPin, BedDouble, X } from "lucide-react";
import Footer from "../layout/homepage/footer";
import Header from "../layout/homepage/header";

const WatchLaterPage = () => {
    const [watchLater, setWatchLater] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            const res = await getWatchLater();
            if (res?.watchLater) setWatchLater(res.watchLater);
        };

        load();
    }, []);

    const formatCurrency = (value) => {
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) return "Contact";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(numberValue);
    };

    const formatAddress = (address) => {
        if (!address) return "";

        return [
            address.detail,
            address.ward?.name,
            address.district?.name,
            address.province?.name,
        ].filter(Boolean).join(", ");
    };

    // REMOVE FROM WATCH LATER
    const handleRemoveWatchLater = async (e, id) => {
        e.stopPropagation();

        try {
            await deleteWatchLater(id);

            setWatchLater(prev =>
                prev.filter(item => (item.id || item._id) !== id)
            );
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <Header />

            <div className="container mt-4">
                <h2 className="mb-4 d-flex align-items-center gap-2">
                    <Clock color="#ff6b00" /> Watch Later
                </h2>

                <div className="row g-3">
                    {watchLater.map((item) => {
                        const id = item.id || item._id;

                        return (
                            <div className="col-md-4" key={id}>
                                <div
                                    className="card shadow-sm border-0 h-100"
                                    style={{
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        position: "relative",
                                    }}
                                    onClick={() =>
                                        navigate(`/boarding-houses/${id}`)
                                    }
                                >
                                    {/* REMOVE BUTTON */}
                                    <button
                                        onClick={(e) => handleRemoveWatchLater(e, id)}
                                        style={{
                                            position: "absolute",
                                            top: 10,
                                            right: 10,
                                            zIndex: 10,
                                            border: "none",
                                            background: "rgba(255,255,255,0.9)",
                                            borderRadius: "50%",
                                            width: 32,
                                            height: 32,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <X size={16} color="#ff3b30" />
                                    </button>

                                    {/* IMAGE */}
                                    <div style={{ height: "180px" }}>
                                        <img
                                            src={
                                                item.img?.[0]?.imageUrl ||
                                                "/image/logoconen.png"
                                            }
                                            alt={item.name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </div>

                                    <div className="p-3 d-flex flex-column gap-2">
                                        {/* NAME + RATING */}
                                        <div className="d-flex justify-content-between">
                                            <h5>{item.name}</h5>

                                            <span className="text-warning d-flex align-items-center gap-1">
                                                <Star size={16} fill="currentColor" />
                                                {item.rating ?? 0}
                                            </span>
                                        </div>

                                        {/* ADDRESS */}
                                        <div className="text-muted small d-flex align-items-center gap-1">
                                            <MapPin size={14} />
                                            {formatAddress(item.address)}
                                        </div>

                                        {/* PRICE */}
                                        <div
                                            className="fw-bold"
                                            style={{ color: "#ff6b00" }}
                                        >
                                            {formatCurrency(item.price)}
                                        </div>

                                        {/* ROOMS */}
                                        <div className="text-secondary small d-flex align-items-center gap-2">
                                            <BedDouble size={16} />
                                            {item.availableRooms}/{item.totalRooms}
                                        </div>

                                        {/* DESCRIPTION */}
                                        <p className="text-muted small mb-0">
                                            {item.detail}
                                        </p>

                                        {/* FOOTER */}
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            <span style={{ color: "#ff6b00" }}>
                                                ⏰ Watch later
                                            </span>

                                            <button
                                                className="btn btn-sm rounded-pill"
                                                style={{
                                                    border: "1px solid #ff6b00",
                                                    color: "#ff6b00",
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(
                                                        `/boarding-houses/${id}`
                                                    );
                                                }}
                                            >
                                                View detail
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {watchLater.length === 0 && (
                    <div className="text-center mt-5 text-muted">
                        You don't have any watch later items yet ⏰
                    </div>
                )}
            </div>

            <Footer />
        </>
    );
};

export default WatchLaterPage;
