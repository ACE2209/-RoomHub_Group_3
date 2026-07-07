import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    BedDouble,
    CalendarDays,
    CheckCircle2,
    Droplets,
    Home,
    MapPin,
    Ruler,
    Users,
    Zap,
} from "lucide-react";

import { getRoomDetails } from "../../api/room";
import { getImageSource, setFallbackImage } from "../../api/config";
import CreateAppointmentModal from "../../components/CreateAppointmentModal";
import Footer from "../layout/homepage/footer";
import Header from "../layout/homepage/header";
import "./RoomDetailPage.css";

const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return "Contact for price";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(numberValue);
};

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
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

const getRoomImage = (room) => (
    getImageSource(room?.images || room?.image)
);

const hasAcceptedDeposit = (room) =>
    room?.hasAcceptedDeposit || room?.depositStatus === "accepted";

const getRoomStatus = (room) => {
    if (hasAcceptedDeposit(room)) {
        return {
            className: "room-status deposited",
            label: "Đã đặt cọc",
        };
    }

    return {
        className: room?.isAvailable
            ? "room-status available"
            : "room-status unavailable",
        label: room?.isAvailable ? "Available" : "Unavailable",
    };
};

const RoomDetailPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);

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

    const roomType =
        room?.roomTypeId && typeof room.roomTypeId === "object"
            ? room.roomTypeId
            : null;

    const boardingHouse =
        room?.boardingHouseId && typeof room.boardingHouseId === "object"
            ? room.boardingHouseId
            : null;

    const tenants = Array.isArray(room?.rentBy)
        ? room.rentBy.filter((tenant) => tenant && typeof tenant === "object")
        : [];

    const electricityUsage = room
        ? Math.max(
            0,
            (Number(room.currentElectricityReading) || 0) -
            (Number(room.previousElectricityReading) || 0)
        )
        : null;

    const waterUsage = room
        ? Math.max(
            0,
            (Number(room.currentWaterReading) || 0) -
            (Number(room.previousWaterReading) || 0)
        )
        : null;

    const listedDate = formatDate(room?.createdAt);
    const isActionDisabled = room ? (hasAcceptedDeposit(room) || !room.isAvailable) : true;

    const handleDepositClick = () => {
        if (!room?._id) return;
        navigate(`/deposits/create/${room._id}`);
    };

    const handleAppointmentClick = () => {
        if (!room?._id) {
            alert("Room information is unavailable.");
            return;
        }

        if (!room.isAvailable || hasAcceptedDeposit(room)) {
            alert("This room is not available.");
            return;
        }

        setShowAppointmentModal(true);
    };

    const handleAppointmentSuccess = (appointment) => {
        console.log("Appointment created:", appointment);
        setShowAppointmentModal(false);
    };

    return (
        <>
            <Header />

            <main className="detail-page">
                <section className="detail-hero">
                    <div className="container">
                        {boardingHouse?._id ? (
                            <Link
                                className="detail-back"
                                to={`/boarding-houses/${boardingHouse._id}`}
                            >
                                <ArrowLeft size={18} />
                                Back to {boardingHouse.name || "boarding house"}
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
                                        <span className={getRoomStatus(room).className}>
                                            {getRoomStatus(room).label}
                                        </span>

                                        <h3>Room {room.roomNumber || "N/A"}</h3>

                                        {boardingHouse?.name && (
                                            <Link
                                                className="room-detail-house-link"
                                                to={`/boarding-houses/${boardingHouse._id}`}
                                            >
                                                <MapPin size={15} />
                                                {boardingHouse.name}
                                                {boardingHouse.address && (
                                                    <span> · {formatAddress(boardingHouse.address)}</span>
                                                )}
                                            </Link>
                                        )}

                                        <p>
                                            {room.description ||
                                                "This room has no description yet."}
                                        </p>

                                        {roomType && (
                                            <>
                                                <div className="room-detail-meta">
                                                    <span>
                                                        <BedDouble size={17} />
                                                        {roomType.typeName || "Room type"}
                                                    </span>
                                                    <span>
                                                        <Ruler size={17} />
                                                        {roomType.roomSize || "Updating size"}
                                                    </span>
                                                    <span>
                                                        <Users size={17} />
                                                        {roomType.peopleNumber || 0} people
                                                    </span>
                                                    <span className="room-detail-price">
                                                        {formatCurrency(roomType.price)}
                                                        <em>/month</em>
                                                    </span>
                                                </div>

                                                {roomType.facilities?.length > 0 && (
                                                    <div className="detail-section room-detail-subsection">
                                                        <h4>Facilities</h4>
                                                        <div className="detail-facility-chips">
                                                            {roomType.facilities.map((facility) => (
                                                                <span
                                                                    className="detail-facility-chip"
                                                                    key={facility._id || facility.name}
                                                                    title={facility.description || facility.name}
                                                                >
                                                                    <CheckCircle2 size={14} />
                                                                    {facility.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="detail-section room-detail-subsection">
                                            <h4>Utility readings</h4>
                                            <div className="room-detail-utility-grid">
                                                <div className="room-detail-utility-item">
                                                    <Zap size={17} />
                                                    <div>
                                                        <span>Electricity</span>
                                                        <strong>
                                                            {room.previousElectricityReading ?? 0} → {room.currentElectricityReading ?? 0} kWh
                                                        </strong>
                                                        {electricityUsage !== null && (
                                                            <em>Used {electricityUsage} kWh</em>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="room-detail-utility-item">
                                                    <Droplets size={17} />
                                                    <div>
                                                        <span>Water</span>
                                                        <strong>
                                                            {room.previousWaterReading ?? 0} → {room.currentWaterReading ?? 0} m³
                                                        </strong>
                                                        {waterUsage !== null && (
                                                            <em>Used {waterUsage} m³</em>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {tenants.length > 0 && (
                                            <div className="detail-section room-detail-subsection">
                                                <h4>Current tenant(s)</h4>
                                                <div className="room-detail-tenants">
                                                    {tenants.map((tenant) => (
                                                        <span key={tenant._id}>
                                                            <Users size={15} />
                                                            {tenant.fullname || tenant.username || tenant.email}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {listedDate && (
                                            <span className="room-detail-listed">
                                                <CalendarDays size={14} />
                                                Listed on {listedDate}
                                            </span>
                                        )}

                                        <div className="room-card-actions room-detail-actions">
                                            <button
                                                type="button"
                                                className="room-action-btn room-action-btn--deposit"
                                                onClick={handleDepositClick}
                                                disabled={isActionDisabled}
                                            >
                                                Deposit
                                            </button>

                                            <button
                                                type="button"
                                                className="room-action-btn room-action-btn--appointment"
                                                onClick={handleAppointmentClick}
                                                disabled={isActionDisabled}
                                            >
                                                Appointment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </section>
            </main>

            {showAppointmentModal && room && (
                <CreateAppointmentModal
                    room={room}
                    onClose={() => setShowAppointmentModal(false)}
                    onSuccess={handleAppointmentSuccess}
                />
            )}

            <Footer />
        </>
    );
};

export default RoomDetailPage;