import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BedDouble, Home, Ruler, Users } from "lucide-react";

import { getRoomDetails } from "../api/room";
import { getImageSource, setFallbackImage } from "../api/config";
import Footer from "./layout/homepage/footer";
import Header from "./layout/homepage/header";
import "./BoardingHouseDetailPage.css";

const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return "Contact for price";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(numberValue);
};

const getRoomImage = (room) => (
    getImageSource(room?.images || room?.image)
);

const RoomDetailPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRoomDetail = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await getRoomDetails(roomId);
                const detail = res?.data || res;

                if (!detail?._id) {
                    setRoom(null);
                    setError("Room not found");
                    return;
                }

                setRoom(detail);
            } catch (err) {
                console.error("Get room detail failed:", err);
                setRoom(null);
                setError(err.message || "Unable to load room detail");
            } finally {
                setLoading(false);
            }
        };

        fetchRoomDetail();
    }, [roomId]);

    return (
        <>
            <Header />

            <main className="detail-page">
                <section className="detail-hero">
                    <div className="container">
                        <button
                            type="button"
                            className="detail-back detail-back-button"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>

                        {loading ? (
                            <div className="room-detail-card">
                                <div className="detail-skeleton room-detail-skeleton-image" />
                                <div className="room-detail-info">
                                    <div className="detail-skeleton room-card-skeleton-line" />
                                    <div className="detail-skeleton room-card-skeleton-line room-card-skeleton-line--short" />
                                </div>
                            </div>
                        ) : error ? (
                            <div className="detail-empty">
                                <Home size={38} />
                                <h1>Cannot load room detail</h1>
                                <p>{error}</p>
                                <button type="button" onClick={() => window.location.reload()}>
                                    Try again
                                </button>
                            </div>
                        ) : (
                            <section className="room-detail-page-section">
                                <div className="room-types-heading rooms-heading">
                                    <div>
                                        <span>Room Detail</span>
                                        <h2>Room {room.roomNumber || "N/A"}</h2>
                                    </div>
                                </div>

                                <div className="room-detail-card">
                                    <div className="room-detail-image">
                                        <img
                                            src={getRoomImage(room)}
                                            alt={room.roomNumber || "Room detail"}
                                            onError={setFallbackImage}
                                        />
                                    </div>

                                    <div className="room-detail-info">
                                        <span className={room.isAvailable ? "room-status available" : "room-status unavailable"}>
                                            {room.isAvailable ? "Available" : "Unavailable"}
                                        </span>
                                        <h3>Room {room.roomNumber || "N/A"}</h3>
                                        <p>
                                            {room.description ||
                                                "This room has no description yet."}
                                        </p>

                                        {room.roomTypeId && (
                                            <div className="room-detail-meta">
                                                <span>
                                                    <BedDouble size={17} />
                                                    {room.roomTypeId.typeName || "Room type"}
                                                </span>
                                                <span>
                                                    <Ruler size={17} />
                                                    {room.roomTypeId.roomSize || "Updating size"}
                                                </span>
                                                <span>
                                                    <Users size={17} />
                                                    {room.roomTypeId.peopleNumber || 0} people
                                                </span>
                                                <span>
                                                    {formatCurrency(room.roomTypeId.price)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
};

export default RoomDetailPage;
