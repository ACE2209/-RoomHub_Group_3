import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    BadgeCheck,
    BedDouble,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock,
    Droplets,
    Heart,
    Home,
    Images,
    Info,
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
} from "../../api/boardingHouse";
import Footer from "../layout/homepage/footer";
import Header from "../layout/homepage/header";
import "./BoardingHouseDetailPage.css";
import { getImageSource, setFallbackImage } from "../../api/config";
import ReviewSection from "../../components/ReviewSection";
import MapSection from "../../components/MapSection";
import { toggleFavorite, getFavorites } from "../../api/favorite";
import { toggleWatchLater, getWatchLater } from "../../api/watchLater";
import { toastSuccess, toastInfo, confirmAction } from "../../utils/notify";

const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return "Contact for price";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(numberValue);
};

const getPriceRangeLabel = (roomTypes = [], fallbackPrice) => {
    const prices = roomTypes
        .map((roomType) => Number(roomType?.price))
        .filter((price) => !Number.isNaN(price) && price > 0);

    if (!prices.length) {
        return formatCurrency(fallbackPrice);
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) {
        return formatCurrency(min);
    }

    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
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

const formatJoinDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
    }).format(date);
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

const getOwnerInitials = (owner) => {
    const name = getOwnerName(owner);
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "RH";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getRoomTypeImage = (roomType) => (
    getImageSource(roomType?.image || roomType?.images)
);

const getFacilityChips = (facilities = []) => {
    return facilities
        .map((facility) => facility?.name)
        .filter(Boolean);
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
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [roomTypesLoading, setRoomTypesLoading] = useState(false);
    const [roomTypesError, setRoomTypesError] = useState("");
    const [error, setError] = useState("");
    const [favorites, setFavorites] = useState([]);
    const [isWatchLater, setIsWatchLater] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

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
                setSelectedIndex(0);
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

    const facilityCoverage = useMemo(() => {
        const unique = new Map();
        roomTypes.forEach((roomType) => {
            (roomType.facilities || []).forEach((facility) => {
                if (facility?.name && !unique.has(facility.name)) {
                    unique.set(facility.name, facility);
                }
            });
        });
        return Array.from(unique.values());
    }, [roomTypes]);

    const isCompanyOwner = boardingHouse?.ownerId?.businessType === "company";
    const ownerJoinDate = formatJoinDate(boardingHouse?.ownerId?.createdAt);
    const listedSince = formatJoinDate(boardingHouse?.createdAt);
    const isTopRated = Number(boardingHouse?.rating) >= 4.5;
    const priceLabel = useMemo(
        () => getPriceRangeLabel(roomTypes, boardingHouse?.priceRange),
        [roomTypes, boardingHouse]
    );
    const hasPriceRange = priceLabel.includes(" - ");

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

    useEffect(() => {
        const loadWatchLater = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const res = await getWatchLater();
                if (res?.watchLater) {
                    const inWatchLater = res.watchLater.some(
                        (item) => (item.id || item._id) === boardingHouseId
                    );
                    setIsWatchLater(inWatchLater);
                }
            } catch (err) {
                console.log(err);
            }
        };

        loadWatchLater();
    }, [boardingHouseId]);

    const handleFavorite = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setFavoriteLoading(true);
            const res = await toggleFavorite(boardingHouseId);

            if (res.isFavorite) {
                setFavorites(prev => [...prev, boardingHouseId]);
                toastSuccess("Added to favorites");
            } else {
                setFavorites(prev =>
                    prev.filter(id => id !== boardingHouseId)
                );
                toastInfo("Removed from favorites");
            }

            window.dispatchEvent(new Event("favoriteUpdated"));

            try {
                const updatedRes = await getBoardingHouseDetail(boardingHouseId);
                const updatedDetail = updatedRes?.data || updatedRes;
                if (updatedDetail?._id) {
                    setBoardingHouse(updatedDetail);
                }
            } catch (reloadErr) {
                console.error("Failed to reload boarding house:", reloadErr);
            }
        } catch (err) {
            console.error(err);
            toastInfo("Error updating favorite. Please try again.");
        } finally {
            setFavoriteLoading(false);
        }
    };

    // ✅ Handle watch later
    const handleWatchLater = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        // Đang trong watch later -> bấm lần nữa để gỡ thì xác nhận trước
        if (isWatchLater) {
            const confirmed = await confirmAction({
                title: "Remove from Watch Later?",
                text: "This boarding house will be removed from your watch later list.",
                confirmText: "Yes, remove",
            });

            if (!confirmed) return;
        }

        try {
            const res = await toggleWatchLater(boardingHouseId);
            const added = Boolean(res?.isWatchLater);
            setIsWatchLater(added);

            if (added) {
                toastSuccess("Added to Watch Later");
            } else {
                toastInfo("Removed from Watch Later");
            }
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
                                            <span className="detail-gallery-count">
                                                <Images size={14} />
                                                {selectedIndex + 1}/{galleryImages.length}
                                            </span>
                                        </div>

                                        <div className="detail-thumbs" aria-label="Boarding house images">
                                            {galleryImages.map((image, index) => (
                                                <button
                                                    type="button"
                                                    key={image._id || getImageSource(image)}
                                                    className={getImageSource(image) === selectedImage ? "active" : ""}
                                                    onClick={() => {
                                                        setSelectedImage(getImageSource(image));
                                                        setSelectedIndex(index);
                                                    }}
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
                                        <div className="detail-type-row">
                                            <span className="detail-type">
                                                {boardingHouse.boardingHouseType?.name || "Boarding house"}
                                            </span>

                                            {boardingHouse.boardingHouseType?.description && (
                                                <span
                                                    className="detail-type-info"
                                                    title={boardingHouse.boardingHouseType.description}
                                                >
                                                    <Info size={14} />
                                                </span>
                                            )}

                                            {isTopRated && (
                                                <span className="detail-badge-top">
                                                    <BadgeCheck size={14} />
                                                    Top rated
                                                </span>
                                            )}
                                        </div>

                                        <div className="detail-title-row">
                                            <h1>{boardingHouse.name || "Unnamed boarding house"}</h1>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="detail-rating">
                                                    <Star size={17} fill="currentColor" />
                                                    {boardingHouse.rating ?? "N/A"}
                                                </span>

                                                <button
                                                    onClick={handleFavorite}
                                                    disabled={favoriteLoading}
                                                    className="btn p-0 border-0 bg-transparent"
                                                    title={favorites.includes(boardingHouseId) ? "Remove from favorites" : "Add to favorites"}
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
                                                        style={{
                                                            opacity: favoriteLoading ? 0.6 : 1,
                                                            cursor: favoriteLoading ? "not-allowed" : "pointer",
                                                            transition: "all 0.3s ease",
                                                        }}
                                                    />
                                                </button>

                                                <button
                                                    onClick={handleWatchLater}
                                                    className="btn p-0 border-0 bg-transparent"
                                                    title={isWatchLater ? "Remove from watch later" : "Add to watch later"}
                                                >
                                                    <Clock
                                                        size={22}
                                                        fill="none"
                                                        color={isWatchLater ? "#ff6b00" : "black"}
                                                        style={{ transition: "all 0.3s ease" }}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="detail-address">
                                            <MapPin size={18} />
                                            <span>{formatAddress(boardingHouse.address)}</span>
                                        </p>

                                        <div className="detail-price-row">
                                            <div>
                                                <span className="detail-price-label">
                                                    {hasPriceRange ? "Price range" : "Starting from"}
                                                </span>
                                                <div className="detail-price detail-price--range">{priceLabel}</div>
                                                <span className="detail-price-unit">per month</span>
                                            </div>
                                            {listedSince && (
                                                <span className="detail-listed-since">
                                                    <CalendarDays size={14} />
                                                    Listed since {listedSince}
                                                </span>
                                            )}
                                        </div>

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
                                                <strong>{formatCurrency(boardingHouse.electricityPrice)}<em>/kWh</em></strong>
                                            </div>
                                            <div>
                                                <Droplets size={20} />
                                                <span>Water</span>
                                                <strong>{formatCurrency(boardingHouse.waterPrice)}<em>/m³</em></strong>
                                            </div>
                                            <div>
                                                <Heart size={20} />
                                                <span>Likes</span>
                                                {/* ✅ FIX: Display updated likes count in real-time */}
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

                                        {facilityCoverage.length > 0 && (
                                            <section className="detail-section">
                                                <h2>Facilities available</h2>
                                                <div className="detail-facility-chips">
                                                    {facilityCoverage.map((facility) => (
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
                                            </section>
                                        )}

                                        <section className="detail-section detail-owner">
                                            <h2>Owner contact</h2>
                                            <div className="detail-owner-card">
                                                <div className="detail-owner-avatar">
                                                    {getOwnerInitials(boardingHouse.ownerId)}
                                                </div>
                                                <div className="detail-owner-info">
                                                    <div className="detail-owner-name-row">
                                                        <User size={16} />
                                                        <span>{getOwnerName(boardingHouse.ownerId)}</span>
                                                        {isCompanyOwner && (
                                                            <span className="detail-owner-tag">
                                                                <Building2 size={12} />
                                                                Company
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isCompanyOwner && boardingHouse.ownerId?.businessName && (
                                                        <div className="detail-owner-business">
                                                            {boardingHouse.ownerId.businessName}
                                                        </div>
                                                    )}

                                                    <div className="detail-owner-grid">
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

                                                    {ownerJoinDate && (
                                                        <span className="detail-owner-since">
                                                            Host on RoomHub since {ownerJoinDate}
                                                        </span>
                                                    )}
                                                </div>
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
                                        {roomTypes.map((roomType) => {
                                            const chips = getFacilityChips(roomType.facilities);
                                            const visibleChips = chips.slice(0, 3);
                                            const extraChips = chips.length - visibleChips.length;

                                            return (
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

                                                        {visibleChips.length > 0 ? (
                                                            <div className="room-type-facility-chips">
                                                                {visibleChips.map((name) => (
                                                                    <span key={name}>{name}</span>
                                                                ))}
                                                                {extraChips > 0 && (
                                                                    <span className="room-type-facility-more">
                                                                        +{extraChips}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p>Facilities are updating</p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
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