import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    BedDouble,
    ChevronLeft,
    ChevronRight,
    Home,
    MapPin,
    Search,
    Star,
    ArrowRight, // Thêm icon cho nút See More
} from "lucide-react";

import {
    getAllBoardingHousesForGuest,
    getNewestBH,
    getHighRatingBH
} from "../api/boardingHouse";

import Footer from "./layout/homepage/footer";
import Header from "./layout/homepage/header";
import "./HomePage.css";

const PAGE_LIMIT = 9;
const SECTION_LIMIT = 4; // Số lượng hiển thị ở Newest & High Rating

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
    const primaryImage = house.images?.find((image) => image.isPrimary);
    return (
        primaryImage?.imageUrl ||
        house.images?.[0]?.imageUrl ||
        "/image/logoconen.png"
    );
};

// Component Card
const BoardingHouseCard = ({ house }) => (
    <Link className="guest-card guest-card--link" to={`/boarding-houses/${house._id}`}>
        <div className="guest-card__media">
            <img
                src={getPrimaryImage(house)}
                alt={house.name || "Boarding house"}
            />
            <span className="guest-card__type">
                {house.boardingHouseType?.name || "Boarding house"}
            </span>
        </div>

        <div className="guest-card__body">
            <div className="guest-card__topline">
                <h3>{house.name || "Unnamed boarding house"}</h3>
                <span className="guest-rating">
                    <Star size={15} fill="currentColor" />
                    {house.rating ?? "N/A"}
                </span>
            </div>

            <p className="guest-card__address">
                <MapPin size={16} />
                <span>{formatAddress(house.address)}</span>
            </p>

            <p className="guest-card__description">
                {house.description ||
                    "Comfortable boarding house with essential facilities for tenants."}
            </p>

            <div className="guest-card__footer">
                <strong>{formatCurrency(house.priceRange)}</strong>
                <span>
                    <BedDouble size={16} />
                    {house.availableRooms ?? 0}/{house.totalRooms ?? 0} rooms
                </span>
            </div>
        </div>
    </Link>
);

const HomePage = () => {
    // ==================== States ====================
    const [boardingHouses, setBoardingHouses] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchValue, setSearchValue] = useState("");

    const [newestHouses, setNewestHouses] = useState([]);
    const [highRatingHouses, setHighRatingHouses] = useState([]);
    const [newestLoading, setNewestLoading] = useState(true);
    const [highRatingLoading, setHighRatingLoading] = useState(true);

    // ==================== Fetch Functions ====================
    const fetchBoardingHouses = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError("");
            const res = await getAllBoardingHousesForGuest({ page, limit: PAGE_LIMIT });

            if (res?.success && Array.isArray(res.data)) {
                setBoardingHouses(res.data);
                setPagination((prev) => ({ ...prev, ...(res.pagination || {}) }));
            } else {
                setBoardingHouses([]);
                setError(res?.message || "Unable to load boarding houses");
            }
        } catch (err) {
            console.error("Get guest boarding houses failed:", err);
            setBoardingHouses([]);
            setError(err.message || "Unable to load boarding houses");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchNewestHouses = useCallback(async () => {
        try {
            setNewestLoading(true);
            const res = await getNewestBH();
            if (res?.success && Array.isArray(res.data)) {
                setNewestHouses(res.data.slice(0, SECTION_LIMIT));
            } else {
                setNewestHouses([]);
            }
        } catch (err) {
            console.error("Get newest boarding houses failed:", err);
            setNewestHouses([]);
        } finally {
            setNewestLoading(false);
        }
    }, []);

    const fetchHighRatingHouses = useCallback(async () => {
        try {
            setHighRatingLoading(true);
            const res = await getHighRatingBH();
            if (res?.success && Array.isArray(res.data)) {
                setHighRatingHouses(res.data.slice(0, SECTION_LIMIT));
            } else {
                setHighRatingHouses([]);
            }
        } catch (err) {
            console.error("Get high rating boarding houses failed:", err);
            setHighRatingHouses([]);
        } finally {
            setHighRatingLoading(false);
        }
    }, []);

    // ==================== Filtered Houses ====================
    const filteredBoardingHouses = useMemo(() => {
        const keyword = searchValue.trim().toLowerCase();
        if (!keyword) return boardingHouses;

        return boardingHouses.filter((house) => {
            const searchableText = [
                house.name,
                house.boardingHouseType?.name,
                formatAddress(house.address),
            ].join(" ").toLowerCase();
            return searchableText.includes(keyword);
        });
    }, [boardingHouses, searchValue]);


    // THÊM ĐOẠN NÀY
    const visiblePages = useMemo(() => {
        const totalPages = pagination.totalPages || 1;
        const currentPage = pagination.currentPage || 1;

        const pages = [];

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, currentPage + 2);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    }, [pagination.currentPage, pagination.totalPages]);


    // ==================== Effects ====================
    useEffect(() => {
        fetchBoardingHouses(1);
        fetchNewestHouses();
        fetchHighRatingHouses();
    }, [fetchBoardingHouses, fetchNewestHouses, fetchHighRatingHouses]);

    const handlePageChange = (page) => {
        if (page < 1 || page > pagination.totalPages || loading) return;
        fetchBoardingHouses(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSeeMoreNewest = () => {
        // TODO: Điều hướng đến trang Newest (có thể dùng react-router)
        alert("Chuyển đến trang tất cả boarding house mới nhất");
        // navigate('/newest'); // nếu dùng react-router
    };

    const handleSeeMoreHighRating = () => {
        alert("Chuyển đến trang boarding house đánh giá cao");
        // navigate('/high-rating');
    };

    return (
        <>
            <Header />

            <main className="guest-home">
                {/* Hero Section */}
                <section className="guest-hero">
                    <div className="container">
                        <div className="guest-hero__content">
                            <span className="guest-hero__eyebrow">RoomHub Boarding Houses</span>
                            <h1>Find a boarding house that feels easy to live in.</h1>
                            <p>Browse available boarding houses, compare locations, room availability, ratings, and prices in one place.</p>

                            <div className="guest-search" role="search">
                                <Search size={20} />
                                <input
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder="Search by name, type, or address"
                                    aria-label="Search boarding houses"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ALL BOARDING HOUSES - ĐƯA LÊN TRÊN */}
                <section className="container guest-listing-section">
                    <div className="guest-section-header">
                        <div>
                            <span className="guest-section-kicker">Explore All</span>
                            <h2>All Boarding Houses</h2>
                        </div>
                        <div className="guest-count">
                            <Home size={18} />
                            <span>{pagination.totalItems || 0} houses</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="guest-grid">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div className="guest-card guest-card--loading" key={index}>
                                    <div className="guest-card__image-skeleton" />
                                    <div className="guest-card__line guest-card__line--wide" />
                                    <div className="guest-card__line" />
                                    <div className="guest-card__line guest-card__line--short" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="guest-empty">
                            <Home size={36} />
                            <h3>Cannot load boarding houses</h3>
                            <p>{error}</p>
                            <button type="button" onClick={() => fetchBoardingHouses(1)}>
                                Try again
                            </button>
                        </div>
                    ) : filteredBoardingHouses.length > 0 ? (
                        <>
                            <div className="guest-grid">
                                {filteredBoardingHouses.map((house) => (
                                    <BoardingHouseCard key={house._id} house={house} />
                                ))}
                            </div>

                            <div className="guest-pagination">
                                <button
                                    type="button"
                                    disabled={!pagination.hasPrevPage || loading}
                                    onClick={() => handlePageChange((pagination.currentPage || 1) - 1)}
                                >
                                    <ChevronLeft size={18} /> Previous
                                </button>

                                <div className="guest-pagination__numbers">
                                    {visiblePages.map((page) => (  // visiblePages vẫn giữ nguyên
                                        <button
                                            key={page}
                                            className={page === pagination.currentPage ? "active" : ""}
                                            disabled={loading}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    disabled={!pagination.hasNextPage || loading}
                                    onClick={() => handlePageChange((pagination.currentPage || 1) + 1)}
                                >
                                    Next <ChevronRight size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="guest-empty">
                            <Search size={36} />
                            <h3>No boarding houses found</h3>
                            <p>Try another keyword or clear the search box.</p>
                        </div>
                    )}
                </section>

                {/* NEWEST BOARDING HOUSES */}
                <section className="container guest-listing-section">
                    <div className="guest-section-header">
                        <div>
                            <span className="guest-section-kicker">New Arrivals</span>
                            <h2>Boarding Houses Mới Nhất</h2>
                        </div>
                        <button className="guest-see-more" onClick={handleSeeMoreNewest}>
                            See More <ArrowRight size={18} />
                        </button>
                    </div>

                    {newestLoading ? (
                        <div className="guest-grid">
                            {Array.from({ length: SECTION_LIMIT }).map((_, i) => (
                                <div className="guest-card guest-card--loading" key={i} />
                            ))}
                        </div>
                    ) : newestHouses.length > 0 ? (
                        <div className="guest-grid">
                            {newestHouses.map((house) => (
                                <BoardingHouseCard key={house._id} house={house} />
                            ))}
                        </div>
                    ) : (
                        <div className="guest-empty">
                            <p>Chưa có boarding house mới nào.</p>
                        </div>
                    )}
                </section>

                {/* HIGH RATING BOARDING HOUSES */}
                <section className="container guest-listing-section">
                    <div className="guest-section-header">
                        <div>
                            <span className="guest-section-kicker">Highly Rated</span>
                            <h2>Boarding Houses Đánh Giá Cao</h2>
                        </div>
                        <button className="guest-see-more" onClick={handleSeeMoreHighRating}>
                            See More <ArrowRight size={18} />
                        </button>
                    </div>

                    {highRatingLoading ? (
                        <div className="guest-grid">
                            {Array.from({ length: SECTION_LIMIT }).map((_, i) => (
                                <div className="guest-card guest-card--loading" key={i} />
                            ))}
                        </div>
                    ) : highRatingHouses.length > 0 ? (
                        <div className="guest-grid">
                            {highRatingHouses.map((house) => (
                                <BoardingHouseCard key={house._id} house={house} />
                            ))}
                        </div>
                    ) : (
                        <div className="guest-empty">
                            <p>Chưa có boarding house nào đạt rating cao.</p>
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </>
    );
};

export default HomePage;
