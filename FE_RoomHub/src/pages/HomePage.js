<<<<<<< HEAD
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

=======
import './HomePage.css';
>>>>>>> 84d223bca6ed5242c47a561fa1e3a69d491e323c
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

const listings = [
    {
        id: 1,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA61CnW18cepl-84b14s2eDdmciq95Q1l7RgcfvUMrNhKfxPOknRoqHeicLvrnrbf1PozUN8R_X4XgX-DxUyFmmzL6uTpmUqGT2BNgoPrQsxzqrN0dPs8JBTf-UJplX-149-G74ThMjXawQJXOyDy16wtIoqfW_jDkHT_gooTVWUWfDO-ZlUoCQkPdBFlCaSz2jEUCSZKT4r29PGpq41PPmGH9XtDU9ReVxVEFAnb2TscrgB3W1ZwDrdOUxPvE-oG2IlNEh4La8Gkmj",
        badge: "Trống", badgeType: "vacant",
        title: "Phòng Studio Full Nội Thất", price: "2,8 triệu/tháng",
        area: "12m2", location: "Quận 7, TP.HCM",
        avatarText: "AN", ownerName: "Anh Nam",
    },
    {
        id: 2,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5xbEuqOe5aZbyokeaUkE3G1l5T4okFbaKsseRBP9epmfgGeWUW4vDEkXZEOmkGysmcuX7y0u10WQn-bEJcSI0swDGR5DdlwYrFUXVsFZgYgkA2ceLq6CdYoy7jgm_OYvvyMYiFj5G08kDUfKoXRAcXJvubXs2w1VNuqaHnuBH6F93y6_Xl-h9TEtBoRet85Zz7Fn6H7zPmsM-jlKq3UT9kErLdtARtUjj2uCA6ZLv-MMs0j_WtwzKym68mY6IUV3RrEk2OLZeSOER",
        badge: "Mới", badgeType: "new",
        title: "Ký Túc Xá Cao Cấp Gần Làng Đại Học", price: "1,5 triệu/tháng",
        area: "20m2", location: "Thủ Đức",
        avatarText: "CH", ownerName: "Chị Hoa",
    },
    {
        id: 3,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9BFInu9GKQzE1fKO4BpXxOWqWTLO9D4b1zbgQFDbN88w_yCfidjyiy5Pe_ado9zhTIuVe2RVOhCECiSyq3QDEm1MhkLq2hOZiygOd-P6iCCk8H6OkW0RIC1o-ZLPhE31PsuBnWjZvrVjD2mNq7AA698ECwCJcycfS-eIPw0N6pQ6MqTSofnbmnehpggBylar7MWa-ylUg4KldywUatFXsI8igmbLbUqdwrW3J23S_3OTBzJA0asax32efpKPB2urztXg7TucaL82F",
        badge: "Trống", badgeType: "vacant",
        title: "Phòng Ban Công View Landmark 81", price: "4,5 triệu/tháng",
        area: "25m2", location: "Bình Thạnh",
        avatarText: "QT", ownerName: "Quốc Trung",
    },
    {
        id: 4,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0sfKbgrsn7C2DoNU11xLyEmocZx4whnx88r6qBRNvXlJCM9eCAT28MKr1EZ75KKP0neq11W3eI7fyTG41ttuzs4jrrb2pziQnRuGnacul95Vj33XDy6DE3GsPPmkAab2yKkY3r3tI3t-ycdgh4-oYZZOvrhRmtFCwDycu-1Z4TPZZqr2k2AmWE3LGXgMkmuTSi4MKhliCPo2w9DU4xSUZhv4UT-Jlc6UxqA-DjgfokVA9i8MAuWG20uv6ZLCUS7ltoxVzB-oPpORG",
        badge: "Mới", badgeType: "new",
        title: "Phòng Loft Đẹp Ngay Trung Tâm Q1", price: "6,0 triệu/tháng",
        area: "30m2", location: "Quận 1, TP.HCM",
        avatarText: "ML", ownerName: "Minh Long",
    },
];

const tours = [
    { id: 1, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcuTVyvDCOYVBhF2h30ySYY-urJBKLVEJRJWTICL4CFoT0ZHJW1maRjRQ1L3o2j3ZhbJJyjavPFm0KV2UGfCkaRQ4pR7qiBVEJcFzyQEMy20X4Iw0Fjwces9kH2ZIp7GM73bdJY5mVbAxb8JQhsFurUJFe0rgcfSNeaOxMaJXNFewTb6Pwe9Nb9dVrGxDB7gN7HQnEJbRiBNeO2qvxBNA6EqkH6VC0A5VRMkdJeVAy3dncvnvG6kjx1ETZr1u3mvHGmigL48kLJFCI", name: "Căn hộ Sunrise Quận 7", type: "360° Virtual Tour" },
    { id: 2, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFIz9IsdnuqFnjR9WHRdZPFTMeyMOzFAfbV4BKxRAMMDnPUCZ78GGqXAOBQOk0039CmEDt3xJdBwNMHXcvBVq9IXEpNC9L_2zV7LMFtKK-mMZkSuE3VmjfIYgHeq3rbZXs-HMsX0NbdZIjQdrI2vPdcz0YqvIAv6kuaeXXa3GfWdX0s89UR8zoolr1oJuEolYnqECA6uIiK0_tD8LOtfRc60qcDiTKdFmpJ3MgCbYYQQMI5pwsjsTGUCby-wYixvPKOMW5uQnpmJ3u", name: "Nhà trọ Hẻm Xe Hơi - Phú Nhuận", type: "Video Review" },
    { id: 3, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5cJ2mmddHqdneEC1Ax25W2f6pL9Ew8eH4NGNL78Lvq53UHNN76nVE3gO7TsNH_O3aKXoWZQEIThFDikpC6eZty13JWDQ8R2_PLItS-U2Opg3RYHH3cpI9argkfAImdxlcjBKr9wUXGAr6q1-U-KwUiGoIy-e7SJGLGV-6ESDaVxMOLzgFhdWzfQgKVAelUnEtVa7GmCNeS7hUliZH36BQzgEXSLmpTLK9lWMRaMy3HCH2dUmE6kH0RSUjS_tSRX0l_aAqh1qMcNZm", name: "Penthouse mini - Thảo Điền", type: "VR Experience" },
    { id: 4, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNNzFC2SWdvsjCjfV115X5JGc-_9oTiKMGGwA5jkK458SlrArrDjwzjw0SLZ1YgKWhlKQVTV9m_DVv26uD1fwexDxIfYG98_jqTiBG95V1Cb19WmgEVX412YhXYzIZryX72DW8b7qtOQXx6qYQxNt5VirkJJpRhCAOg2VV8rXfTWl7Pn4mdwi2WqlTxZWJ0fckyPdYtLNXZrcGYjhJWaGinhBs6v7R6HzzXlmdu_sEBCYBwlhNpzpJTIPiPVcmXcDRzwegHrN14a8w", name: "Phòng Full-Option Bình Thạnh", type: "Video 4K" },
];

const filterLabels = ["Dưới 1 triệu", "1 - 2 triệu", "2 - 5 triệu", "Căn hộ", "Nhà trọ", "Quận 1", "Bình Thạnh", "Thủ Đức"];

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

<<<<<<< HEAD
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

=======
            <main className="home-main">
                {/* Filter Bar */}
                <div className="filter-bar">
                    <button className="btn-filter-primary">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
                        Tất cả bộ lọc
                    </button>
                    <div className="filter-divider" />
                    {filterLabels.map(label => (
                        <button key={label} className="btn-filter">{label}</button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="content-grid">
                    {/* Listings Column */}
                    <div className="listings-col">
                        <div className="sort-row">
                            <h2>Tin đăng nổi bật</h2>
                            <div className="sort-controls">
                                <span className="sort-label">Sắp xếp:</span>
                                <select className="sort-select">
                                    <option>Mới nhất</option>
                                    <option>Giá tăng dần</option>
                                    <option>Giá giảm dần</option>
                                </select>
                            </div>
                        </div>

                        <div className="cards-grid">
                            {listings.map(item => (
                                <div key={item.id} className="listing-card">
                                    <div className="card-image-wrap">
                                        <img src={item.img} alt={item.title} />
                                        <span className={`card-badge ${item.badgeType}`}>{item.badge}</span>
                                        <button className="card-fav-btn">
                                            <span className="material-symbols-outlined">favorite</span>
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        <div className="card-top">
                                            <h3 className="card-title">{item.title}</h3>
                                            <span className="card-price">{item.price}</span>
                                        </div>
                                        <div className="card-meta">
                                            <div className="card-meta-item">
                                                <span className="material-symbols-outlined">square_foot</span>
                                                {item.area}
                                            </div>
                                            <div className="card-meta-item">
                                                <span className="material-symbols-outlined">location_on</span>
                                                {item.location}
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <div className="card-avatar-row">
                                                <div className="card-avatar">{item.avatarText}</div>
                                                <span className="card-owner">{item.ownerName}</span>
                                            </div>
                                            <button className="btn-detail">
                                                Chi tiết
                                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="load-more-wrap">
                            <button className="btn-load-more">Xem thêm kết quả</button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="sidebar">
                        <div className="filter-panel">
                            <h3 className="filter-panel-title">
                                <span className="material-symbols-outlined">filter_list</span>
                                Bộ lọc chi tiết
                            </h3>

                            <div className="filter-group">
                                <label className="filter-label">Khu vực</label>
                                <select className="filter-select">
                                    <option>Tất cả Thành phố</option>
                                    <option>Hồ Chí Minh</option>
                                    <option>Hà Nội</option>
                                    <option>Đà Nẵng</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">Khoảng giá (VNĐ)</label>
                                <div className="price-range">
                                    <input className="price-input" placeholder="Từ" type="number" />
                                    <span className="price-dash">—</span>
                                    <input className="price-input" placeholder="Đến" type="number" />
                                </div>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">Diện tích (m2)</label>
                                <div className="area-grid">
                                    {["Dưới 15m2", "15m2 - 25m2", "25m2 - 45m2", "Trên 45m2"].map(a => (
                                        <label key={a} className="area-option">
                                            <input type="checkbox" />
                                            <span>{a}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">Tiện ích</label>
                                <div className="amenity-list">
                                    {["WC riêng", "Tự do giờ giấc", "Có máy lạnh"].map(a => (
                                        <label key={a} className="amenity-option">
                                            <span>{a}</span>
                                            <input type="checkbox" />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button className="btn-apply-filter">Áp dụng bộ lọc</button>
                            <button className="btn-clear-filter">Xóa tất cả</button>
                        </div>

                        <div className="cta-banner">
                            <div className="cta-content">
                                <h4 className="cta-title">Đăng tin ngay?</h4>
                                <p className="cta-desc">Kết nối với hơn 100,000 khách thuê tiềm năng mỗi tháng.</p>
                                <button className="btn-cta">Bắt đầu miễn phí</button>
                            </div>
                            <span className="material-symbols-outlined cta-icon">home</span>
                        </div>
                    </aside>
                </div>

                {/* Virtual Tour Section */}
                <section style={{ marginTop: 32, paddingTop: 32 }}>
                    <div className="section-header">
                        <div>
                            <h2>Xem nhà tận cảnh</h2>
                            <p className="section-subtitle">Khám phá không gian sống chân thực qua Virtual Tour 360 &amp; Video.</p>
                        </div>
                        <button className="btn-see-all">
                            Xem tất cả
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                        </button>
                    </div>
                    <div className="tour-grid">
                        {tours.map(t => (
                            <div key={t.id} className="tour-card">
                                <img src={t.img} alt={t.name} />
                                <div className="tour-overlay" />
                                <div className="tour-play-wrap">
                                    <div className="tour-play-btn">
                                        <span className="material-symbols-outlined">play_arrow</span>
                                    </div>
                                </div>
                                <div className="tour-info">
                                    <p className="tour-name">{t.name}</p>
                                    <p className="tour-type">{t.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* About Section */}
                <section className="about-section">
                    <div className="about-inner">
                        <h2 className="about-title">Tìm phòng trọ ưng ý cùng RoomHub</h2>
                        <p className="about-text">RoomHub là nền tảng quản lý và tìm kiếm phòng trọ hàng đầu, giúp kết nối trực tiếp chủ nhà và khách thuê một cách minh bạch và hiệu quả nhất.</p>
                        <p className="about-text">Với hơn 50,000+ tin đăng đã qua kiểm duyệt, chúng tôi cam kết mang lại trải nghiệm tìm nhà hoàn toàn mới với các công nghệ hiện đại như Virtual Tour 360, xem video thực tế và đặt lịch hẹn trực tuyến chỉ với một chạm.</p>
                        <div className="features-grid">
                            <div className="feature-item">
                                <span className="material-symbols-outlined">verified_user</span>
                                <h4 className="feature-title">Tin đăng thật</h4>
                                <p className="feature-desc">Mọi phòng đều được xác thực thông tin và hình ảnh thực tế.</p>
                            </div>
                            <div className="feature-item">
                                <span className="material-symbols-outlined">flash_on</span>
                                <h4 className="feature-title">Kết nối nhanh</h4>
                                <p className="feature-desc">Liên hệ trực tiếp chủ nhà không qua trung gian, phí môi giới.</p>
                            </div>
                            <div className="feature-item">
                                <span className="material-symbols-outlined">support_agent</span>
                                <h4 className="feature-title">Hỗ trợ 24/7</h4>
                                <p className="feature-desc">Đội ngũ CSKH sẵn sàng giải đáp thắc mắc của bạn bất cứ lúc nào.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="mobile-nav">
                <button className="nav-btn active">
                    <span className="material-symbols-outlined">explore</span>
                    <span className="nav-label">Khám phá</span>
                </button>
                <button className="nav-btn inactive">
                    <span className="material-symbols-outlined">favorite</span>
                    <span className="nav-label">Yêu thích</span>
                </button>
                <button className="nav-btn inactive">
                    <span className="material-symbols-outlined">add_circle</span>
                    <span className="nav-label">Đăng tin</span>
                </button>
                <button className="nav-btn inactive">
                    <span className="material-symbols-outlined">chat</span>
                    <span className="nav-label">Tin nhắn</span>
                </button>
                <button className="nav-btn inactive">
                    <span className="material-symbols-outlined">person</span>
                    <span className="nav-label">Cá nhân</span>
                </button>
            </div>

>>>>>>> 84d223bca6ed5242c47a561fa1e3a69d491e323c
            <Footer />
        </>
    );
};

export default HomePage;
<<<<<<< HEAD
=======



>>>>>>> 84d223bca6ed5242c47a561fa1e3a69d491e323c
