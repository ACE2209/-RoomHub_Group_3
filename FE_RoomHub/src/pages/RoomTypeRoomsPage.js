import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BedDouble } from "lucide-react";

import { getRoomsByRoomType } from "../api/room";
import { getImageSource, setFallbackImage } from "../api/config";
import CreateAppointmentModal from "../components/CreateAppointmentModal";
import Footer from "./layout/homepage/footer";
import Header from "./layout/homepage/header";
import "./BoardingHouseDetailPage.css";

const getListData = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
};

const getRoomImage = (room) => {
    return getImageSource(room?.images || room?.image);
};

const RoomTypeRoomsPage = () => {
    const { roomTypeId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedRoom, setSelectedRoom] = useState(null);

    const roomTypeName = useMemo(() => {
        return (
            location.state?.roomTypeName ||
            rooms[0]?.roomTypeId?.typeName ||
            "selected type"
        );
    }, [location.state?.roomTypeName, rooms]);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await getRoomsByRoomType(roomTypeId);
                setRooms(getListData(res));
            } catch (err) {
                console.error("Get rooms by room type failed:", err);
                setRooms([]);
                setError(err.message || "Unable to load rooms");
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, [roomTypeId]);

    const handleRoomClick = (room) => {
        navigate(`/rooms/${room._id}`);
    };

    const handleDepositClick = (e, roomId) => {
        e.stopPropagation();
        navigate(`/deposits/create/${roomId}`);
    };

    const handleAppointmentClick = (e, room) => {
        e.stopPropagation();
        setSelectedRoom(room);
    };

    return (
        <>
            <Header />

            <main className="detail-page">
                <section className="detail-hero">
                    <div className="container">
                        {location.state?.boardingHouseId ? (
                            <Link
                                className="detail-back"
                                to={`/boarding-houses/${location.state.boardingHouseId}`}
                            >
                                <ArrowLeft size={18} />
                                Back to {location.state.boardingHouseName || "boarding house"}
                            </Link>
                        ) : (
                            <button
                                type="button"
                                className="detail-back detail-back-button"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                        )}

                        <section className="rooms-section">
                            <div className="room-types-heading rooms-heading">
                                <div>
                                    <span>Rooms</span>
                                    <h2>Rooms in {roomTypeName}</h2>
                                </div>

                                {!loading && !error && (
                                    <strong>{rooms.length} rooms</strong>
                                )}
                            </div>

                            {loading ? (
                                <div className="rooms-grid">
                                    {[1, 2, 3].map((item) => (
                                        <div
                                            className="room-card room-card--loading"
                                            key={item}
                                        >
                                            <div className="detail-skeleton room-card-skeleton-image" />
                                            <div className="detail-skeleton room-card-skeleton-line" />
                                            <div className="detail-skeleton room-card-skeleton-line room-card-skeleton-line--short" />
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="room-types-empty">
                                    <BedDouble size={34} />
                                    <h3>Cannot load rooms</h3>
                                    <p>{error}</p>
                                </div>
                            ) : rooms.length ? (
                                <div className="rooms-grid">
                                    {rooms.map((room) => (
                                        <article
                                            role="button"
                                            tabIndex={0}
                                            className="room-card room-flow-card"
                                            key={room._id}
                                            onClick={() => handleRoomClick(room)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    handleRoomClick(room);
                                                }
                                            }}
                                        >
                                            <div className="room-card-image">
                                                <img
                                                    src={getRoomImage(room)}
                                                    alt={room.roomNumber || "Room"}
                                                    onError={setFallbackImage}
                                                />

                                                <span
                                                    className={
                                                        room.isAvailable
                                                            ? "available"
                                                            : "unavailable"
                                                    }
                                                >
                                                    {room.isAvailable
                                                        ? "Available"
                                                        : "Unavailable"}
                                                </span>
                                            </div>

                                            <div className="room-card-body">
                                                <h3>Room {room.roomNumber || "N/A"}</h3>

                                                <p>
                                                    {room.description ||
                                                        "This room has no description yet."}
                                                </p>

                                                <div className="room-card-actions">
                                                    <button
                                                        type="button"
                                                        className="room-action-btn room-action-btn--deposit"
                                                        onClick={(e) =>
                                                            handleDepositClick(e, room._id)
                                                        }
                                                    >
                                                        Deposit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="room-action-btn room-action-btn--appointment"
                                                        onClick={(e) =>
                                                            handleAppointmentClick(e, room)
                                                        }
                                                    >
                                                        Appointment
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="room-types-empty">
                                    <BedDouble size={34} />
                                    <h3>No rooms found</h3>
                                    <p>
                                        This room type has no room information right now.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                </section>
            </main>

            {selectedRoom && (
                <CreateAppointmentModal
                    room={selectedRoom}
                    onClose={() => setSelectedRoom(null)}
                />
            )}

            <Footer />
        </>
    );
};

export default RoomTypeRoomsPage;