import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    BedDouble,
    Clock,
    Droplets,
    Heart,
    Home,
    Mail,
    MapPin,
    Phone,
    Ruler,
    Star,
    User,
    Users,
    Zap,
} from "lucide-react";

import {
    getBoardingHouseDetail,
    getRoomTypesByBoardingHouseForGuest,
} from "../api/boardingHouse";
import Footer from "./layout/homepage/footer";
import Header from "./layout/homepage/header";
import "./BoardingHouseDetailPage.css";
import { getImageSource, setFallbackImage } from "../api/config";
import ReviewSection from "../components/ReviewSection";
import MapSection from "../components/MapSection";
import { toggleFavorite, getFavorites } from "../api/favorite";
import { toggleWatchLater } from "../api/watchLater";

const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return "Contact for price";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(numberValue);
};

const formatAddress = (address) => {
    if (!address) return "Address is updating";
    return [
        address.detail,
        address.ward?.name,
        address.district?.name,
        address.province?.name,
    ].filter(Boolean).join(", ");
};

const getPrimaryImage = (house) => {
    return getImageSource(house?.images || house?.image);
};

const getOwnerName = (owner) => (
    owner?.fullname ||
    owner?.username ||
    owner?.email ||
    "RoomHub owner"
);

const getRoomTypeImage = (roomType) => (
    getImageSource(roomType?.image || roomType?.images)
);

const getFacilityText = (facilities = []) => {
    if (!facilities.length) return "Facilities are updating";

    return facilities
        .map((facility) => facility?.name)
        .filter(Boolean)
        .join(", ");
};

const getListData = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
};

const BoardingHouseDetailPage = () => {
    const { boardingHouseId } = useParams();
    const navigate = useNavigate();
    const [boardingHouse, setBoardingHouse] = useState(null);
    const [roomTypes, setRoomTypes] = useState([]);
    const [selectedImage, setSelectedImage] = useState("");
    const [loading, setLoading] = useState(true);
    const [roomTypesLoading, setRoomTypesLoading] = useState(false);
    const [roomTypesError, setRoomTypesError] = useState("");
    const [error, setError] = useState("");
    const [favorites, setFavorites] = useState([]);
    const [isWatchLater, setIsWatchLater] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await getBoardingHouseDetail(boardingHouseId);
                const detail = res?.data || res;

                if (!detail?._id) {
                    setBoardingHouse(null);
                    setError("Boarding house not found");
                    return;
                }

                setBoardingHouse(detail);
                setSelectedImage(getPrimaryImage(detail));
            } catch (err) {
                console.error("Get boarding house detail failed:", err);
                setBoardingHouse(null);
                setError(err.message || "Unable to load boarding house detail");
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [boardingHouseId]);

    useEffect(() => {
        if (!boardingHouse?._id) {
            setRoomTypes([]);
            setRoomTypesLoading(false);
            return;
        }

        const fetchRoomTypes = async () => {
            try {
                setRoomTypesLoading(true);
                setRoomTypesError("");

                const res = await getRoomTypesByBoardingHouseForGuest(boardingHouse._id);
                setRoomTypes(getListData(res));
            } catch (err) {
                console.error("Get room types failed:", err);
                setRoomTypes([]);
                setRoomTypesError(err.message || "Unable to load room types");
            } finally {
                setRoomTypesLoading(false);
            }
        };

        fetchRoomTypes();
    }, [boardingHouse]);

    const galleryImages = useMemo(() => {
        const images = Array.isArray(boardingHouse?.images)
            ? boardingHouse.images
            : boardingHouse?.images
                ? [boardingHouse.images]
                : [];

        if (!images.length) {
            return [{ imageUrl: "/image/logoconen.png", _id: "fallback" }];
        }

        return images;
    }, [boardingHouse]);

    const handleRoomTypeClick = (roomType) => {
        navigate(`/room-types/${roomType._id}/rooms`, {
            state: {
                boardingHouseId,
                boardingHouseName: boardingHouse?.name,
                roomTypeName: roomType.typeName,
            },
        });
    };

    useEffect(() => {
        const loadFavorites = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const res = await getFavorites();
                if (res?.favorites) {
                    setFavorites(res.favorites.map(f => f.id));
                }
            } catch (err) {
                console.log(err);
            }
        };

        loadFavorites();
    }, []);

    const handleFavorite = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const res = await toggleFavorite(boardingHouseId);

            if (res.isFavorite) {
                setFavorites(prev => [...prev, boardingHouseId]);
            } else {
                setFavorites(prev =>
                    prev.filter(id => id !== boardingHouseId)
                );
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleWatchLater = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const res = await toggleWatchLater(boardingHouseId);
            setIsWatchLater(Boolean(res?.isWatchLater));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <Header />

            <main className="detail-page">
                <section className="detail-hero">
                    <div className="container">
                        <Link className="detail-back" to="/">
                            <ArrowLeft size={18} />
                            Back to boarding houses
                        </Link>

                        {loading ? (
                            <div className="detail-shell detail-shell--loading">
                                <div className="detail-skeleton detail-skeleton--image" />
                                <div className="detail-skeleton-stack">
                                    <div className="detail-skeleton detail-skeleton--wide" />
                                    <div className="detail-skeleton" />
                                    <div className="detail-skeleton detail-skeleton--short" />
                                </div>
                            </div>
                        ) : error ? (
                            <div className="detail-empty">
                                <Home size={38} />
                                <h1>Cannot load boarding house</h1>
                                <p>{error}</p>
                                <button type="button" onClick={() => window.location.reload()}>
                                    Try again
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="detail-shell">
                                    <div className="detail-gallery">
                                        <div className="detail-main-image">
                                            <img
                                                src={selectedImage || getPrimaryImage(boardingHouse)}
                                                alt={boardingHouse.name || "Boarding house"}
                                                onError={setFallbackImage}
                                            />
                                        </div>

                                        <div className="detail-thumbs" aria-label="Boarding house images">
                                            {galleryImages.map((image) => (
                                                <button
                                                    type="button"
                                                    key={image._id || getImageSource(image)}
                                                    className={getImageSource(image) === selectedImage ? "active" : ""}
                                                    onClick={() => setSelectedImage(getImageSource(image))}
                                                >
                                                    <img
                                                        src={getImageSource(image)}
                                                        alt={boardingHouse.name || "Boarding house thumbnail"}
                                                        onError={setFallbackImage}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="detail-content">
                                        <span className="detail-type">
                                            {boardingHouse.boardingHouseType?.name || "Boarding house"}
                                        </span>

                                        <div className="detail-title-row">
                                            <h1>{boardingHouse.name || "Unnamed boarding house"}</h1>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="detail-rating">
                                                    <Star size={17} fill="currentColor" />
                                                    {boardingHouse.rating ?? "N/A"}
                                                </span>

                                                <button
                                                    onClick={handleFavorite}
                                                    className="btn p-0 border-0 bg-transparent"
                                                >
                                                    <Heart
                                                        size={22}
                                                        color={
                                                            favorites.includes(boardingHouseId)
                                                                ? "red"
                                                                : "black"
                                                        }
                                                        fill={
                                                            favorites.includes(boardingHouseId)
                                                                ? "red"
                                                                : "none"
                                                        }
                                                    />
                                                </button>

                                                <button
                                                    onClick={handleWatchLater}
                                                    className="btn p-0 border-0 bg-transparent"
                                                >
                                                    <Clock
                                                        size={22}
                                                        color={isWatchLater ? "#ff6b00" : "black"}
                                                        fill={isWatchLater ? "#ff6b00" : "none"}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="detail-address">
                                            <MapPin size={18} />
                                            <span>{formatAddress(boardingHouse.address)}</span>
                                        </p>

                                        <div className="detail-price">{formatCurrency(boardingHouse.priceRange)}</div>

                                        <div className="detail-stats">
                                            <div>
                                                <BedDouble size={20} />
                                                <span>Available rooms</span>
                                                <strong>
                                                    {boardingHouse.availableRooms ?? 0}/{boardingHouse.totalRooms ?? 0}
                                                </strong>
                                            </div>
                                            <div>
                                                <Zap size={20} />
                                                <span>Electricity</span>
                                                <strong>{formatCurrency(boardingHouse.electricityPrice)}</strong>
                                            </div>
                                            <div>
                                                <Droplets size={20} />
                                                <span>Water</span>
                                                <strong>{formatCurrency(boardingHouse.waterPrice)}</strong>
                                            </div>
                                            <div>
                                                <Heart size={20} />
                                                <span>Likes</span>
                                                <strong>{boardingHouse.likes ?? 0}</strong>
                                            </div>
                                        </div>

                                        <section className="detail-section">
                                            <h2>Description</h2>
                                            <p>
                                                {boardingHouse.description ||
                                                    "This boarding house is updating its detailed description."}
                                            </p>
                                        </section>

                                        <section className="detail-section detail-owner">
                                            <h2>Owner contact</h2>
                                            <div className="detail-owner-grid">
                                                <div>
                                                    <User size={18} />
                                                    <span>{getOwnerName(boardingHouse.ownerId)}</span>
                                                </div>
                                                {boardingHouse.ownerId?.phoneNumber && (
                                                    <a href={`tel:${boardingHouse.ownerId.phoneNumber}`}>
                                                        <Phone size={18} />
                                                        <span>{boardingHouse.ownerId.phoneNumber}</span>
                                                    </a>
                                                )}
                                                {boardingHouse.ownerId?.email && (
                                                    <a href={`mailto:${boardingHouse.ownerId.email}`}>
                                                        <Mail size={18} />
                                                        <span>{boardingHouse.ownerId.email}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                                {/* bảng máp */}
                                <MapSection
                                    latitude={boardingHouse?.location?.lat}
                                    longitude={boardingHouse?.location?.lon}
                                    address={formatAddress(boardingHouse?.address)}
                                />
                                {/* bảng đánh giá */}
                                <ReviewSection boardingHouseId={boardingHouseId} />

                            </>
                        )}

                        {!loading && !error && (
                            <section className="room-types-section">
                                <div className="room-types-heading">
                                    <div>
                                        <span>Available Room Types</span>
                                        <h2>Available Room Types in Boarding House</h2>
                                    </div>
                                    <strong>{roomTypes.length} types</strong>
                                </div>

                                {roomTypesLoading ? (
                                    <div className="room-types-grid">
                                        {[1, 2, 3].map((item) => (
                                            <div className="room-type-card room-type-card--loading" key={item}>
                                                <div className="detail-skeleton room-type-skeleton-image" />
                                                <div className="detail-skeleton room-type-skeleton-line" />
                                                <div className="detail-skeleton room-type-skeleton-line room-type-skeleton-line--short" />
                                            </div>
                                        ))}
                                    </div>
                                ) : roomTypesError ? (
                                    <div className="room-types-empty">
                                        <BedDouble size={34} />
                                        <h3>Cannot load room types</h3>
                                        <p>{roomTypesError}</p>
                                    </div>
                                ) : roomTypes.length ? (
                                    <div className="room-types-grid">
                                        {roomTypes.map((roomType) => (
                                            <button
                                                type="button"
                                                className="room-type-card room-flow-card"
                                                key={roomType._id}
                                                onClick={() => handleRoomTypeClick(roomType)}
                                            >
                                                <div className="room-type-image">
                                                    <img
                                                        src={getRoomTypeImage(roomType)}
                                                        alt={roomType.typeName || "Room type"}
                                                        onError={setFallbackImage}
                                                    />
                                                    <span>{roomType.availableRoom ?? 0} available</span>
                                                </div>

                                                <div className="room-type-body">
                                                    <div className="room-type-title-row">
                                                        <h3>{roomType.typeName || "Room type"}</h3>
                                                        <strong>{formatCurrency(roomType.price)}</strong>
                                                    </div>

                                                    <div className="room-type-meta">
                                                        <span>
                                                            <Ruler size={17} />
                                                            {roomType.roomSize || "Updating size"}
                                                        </span>
                                                        <span>
                                                            <Users size={17} />
                                                            {roomType.peopleNumber || 0} people
                                                        </span>
                                                    </div>

                                                    <p>{getFacilityText(roomType.facilities)}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="room-types-empty">
                                        <BedDouble size={34} />
                                        <h3>No available room types</h3>
                                        <p>This boarding house has no room type information right now.</p>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
};

export default BoardingHouseDetailPage;
