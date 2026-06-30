import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import {
    BedDouble,
    ChevronLeft,
    ChevronRight,
    Home,
    MapPin,
    Search,
    Star,
    // eslint-disable-next-line no-unused-vars
    ArrowRight, // Thêm icon cho nút See More
} from "lucide-react";

import {
    getNewestBH,
    getHighRatingBH
} from "../api/boardingHouse";
import { getBhByArea } from "../api/boardingHouseAPI";
import { getImageSource, setFallbackImage } from "../api/config";

import Footer from "./layout/homepage/footer";
import Header from "./layout/homepage/header";
import FilterBoardingHouseUser from "./FilterBoardingHouseUser";
import "./HomePage.css";

const PAGE_LIMIT = 9;
const SECTION_LIMIT = 4; // Số lượng hiển thị ở Newest & High Rating
const LIVE_SEARCH_DELAY = 120;

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

const normalizeBoardingHouse = (house) => ({
    ...house,
    _id: house._id || house.id,
    name: house.name || "Unnamed boarding house",
    address: house.address || {},
    images: house.images || [],
    priceRange: Number(house.priceRange || 0),
    totalRooms: Number(house.totalRooms || 0),
    availableRooms: Number(house.availableRooms || 0),
    rating: house.rating ?? "N/A",
    boardingHouseType: house.boardingHouseType || null,
});

const getCarouselItems = (items, startIndex) => {
    if (items.length <= SECTION_LIMIT) return items;

    return Array.from({ length: SECTION_LIMIT }, (_, index) => {
        return items[(startIndex + index) % items.length];
    });
};

// Component Card
const BoardingHouseCard = ({ house }) => (
    <Link className="guest-card guest-card--link" to={`/boarding-houses/${house._id}`}>
        <div className="guest-card__media">
            <img
                src={getPrimaryImage(house)}
                alt={house.name || "Boarding house"}
                onError={setFallbackImage}
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

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
const tours = [
    { id: 1, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcuTVyvDCOYVBhF2h30ySYY-urJBKLVEJRJWTICL4CFoT0ZHJW1maRjRQ1L3o2j3ZhbJJyjavPFm0KV2UGfCkaRQ4pR7qiBVEJcFzyQEMy20X4Iw0Fjwces9kH2ZIp7GM73bdJY5mVbAxb8JQhsFurUJFe0rgcfSNeaOxMaJXNFewTb6Pwe9Nb9dVrGxDB7gN7HQnEJbRiBNeO2qvxBNA6EqkH6VC0A5VRMkdJeVAy3dncvnvG6kjx1ETZr1u3mvHGmigL48kLJFCI", name: "Căn hộ Sunrise Quận 7", type: "360° Virtual Tour" },
    { id: 2, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFIz9IsdnuqFnjR9WHRdZPFTMeyMOzFAfbV4BKxRAMMDnPUCZ78GGqXAOBQOk0039CmEDt3xJdBwNMHXcvBVq9IXEpNC9L_2zV7LMFtKK-mMZkSuE3VmjfIYgHeq3rbZXs-HMsX0NbdZIjQdrI2vPdcz0YqvIAv6kuaeXXa3GfWdX0s89UR8zoolr1oJuEolYnqECA6uIiK0_tD8LOtfRc60qcDiTKdFmpJ3MgCbYYQQMI5pwsjsTGUCby-wYixvPKOMW5uQnpmJ3u", name: "Nhà trọ Hẻm Xe Hơi - Phú Nhuận", type: "Video Review" },
    { id: 3, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5cJ2mmddHqdneEC1Ax25W2f6pL9Ew8eH4NGNL78Lvq53UHNN76nVE3gO7TsNH_O3aKXoWZQEIThFDikpC6eZty13JWDQ8R2_PLItS-U2Opg3RYHH3cpI9argkfAImdxlcjBKr9wUXGAr6q1-U-KwUiGoIy-e7SJGLGV-6ESDaVxMOLzgFhdWzfQgKVAelUnEtVa7GmCNeS7hUliZH36BQzgEXSLmpTLK9lWMRaMy3HCH2dUmE6kH0RSUjS_tSRX0l_aAqh1qMcNZm", name: "Penthouse mini - Thảo Điền", type: "VR Experience" },
    { id: 4, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNNzFC2SWdvsjCjfV115X5JGc-_9oTiKMGGwA5jkK458SlrArrDjwzjw0SLZ1YgKWhlKQVTV9m_DVv26uD1fwexDxIfYG98_jqTiBG95V1Cb19WmgEVX412YhXYzIZryX72DW8b7qtOQXx6qYQxNt5VirkJJpRhCAOg2VV8rXfTWl7Pn4mdwi2WqlTxZWJ0fckyPdYtLNXZrcGYjhJWaGinhBs6v7R6HzzXlmdu_sEBCYBwlhNpzpJTIPiPVcmXcDRzwegHrN14a8w", name: "Phòng Full-Option Bình Thạnh", type: "Video 4K" },
];

// eslint-disable-next-line no-unused-vars
const filterLabels = ["Dưới 1 triệu", "1 - 2 triệu", "2 - 5 triệu", "Căn hộ", "Nhà trọ", "Quận 1", "Bình Thạnh", "Thủ Đức"];

const HomePage = () => {
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
    const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
    const [filterValue, setFilterValue] = useState({});

    const [newestHouses, setNewestHouses] = useState([]);
    const [highRatingHouses, setHighRatingHouses] = useState([]);
    const [newestStartIndex, setNewestStartIndex] = useState(0);
    const [highRatingStartIndex, setHighRatingStartIndex] = useState(0);
    const [newestLoading, setNewestLoading] = useState(true);
    const [highRatingLoading, setHighRatingLoading] = useState(true);
    const latestSearchRequestRef = useRef(0);

    const mergedFilterValue = useMemo(() => {
        const keyword = debouncedSearchValue.trim();

        return {
            ...filterValue,
            name: keyword || filterValue.name,
            page: pagination.currentPage || 1,
            limit: PAGE_LIMIT,
        };
    }, [debouncedSearchValue, filterValue, pagination.currentPage]);

    const fetchBoardingHouses = useCallback(async () => {
        const requestId = latestSearchRequestRef.current + 1;
        latestSearchRequestRef.current = requestId;

        try {
            setLoading(true);
            setError("");
            const res = await getBhByArea(mergedFilterValue);

            if (requestId !== latestSearchRequestRef.current) return;

            if (res?.success && Array.isArray(res.data)) {
                setBoardingHouses(res.data.map(normalizeBoardingHouse));
                setPagination((prev) => ({ ...prev, ...(res.pagination || {}) }));
            } else {
                setBoardingHouses([]);
                setError(res?.message || "Unable to load boarding houses");
            }
        } catch (err) {
            if (requestId !== latestSearchRequestRef.current) return;
            console.error("Get guest boarding houses failed:", err);
            setBoardingHouses([]);
            setError(err.message || "Unable to load boarding houses");
        } finally {
            if (requestId === latestSearchRequestRef.current) {
                setLoading(false);
            }
        }
    }, [mergedFilterValue]);

    const fetchNewestHouses = useCallback(async () => {
        try {
            setNewestLoading(true);
            const res = await getNewestBH();
            if (res?.success && Array.isArray(res.data)) {
                setNewestHouses(res.data.map(normalizeBoardingHouse));
                setNewestStartIndex(0);
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
                setHighRatingHouses(res.data.map(normalizeBoardingHouse));
                setHighRatingStartIndex(0);
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

    const visibleNewestHouses = useMemo(
        () => getCarouselItems(newestHouses, newestStartIndex),
        [newestHouses, newestStartIndex]
    );

    const visibleHighRatingHouses = useMemo(
        () => getCarouselItems(highRatingHouses, highRatingStartIndex),
        [highRatingHouses, highRatingStartIndex]
    );

    useEffect(() => {
        fetchNewestHouses();
        fetchHighRatingHouses();
    }, [fetchNewestHouses, fetchHighRatingHouses]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearchValue(searchValue);
            setPagination((prev) => ({ ...prev, currentPage: 1 }));
        }, LIVE_SEARCH_DELAY);

        return () => window.clearTimeout(timeoutId);
    }, [searchValue]);

    useEffect(() => {
        fetchBoardingHouses();
    }, [fetchBoardingHouses]);

    const handlePageChange = (page) => {
        if (page < 1 || page > pagination.totalPages || loading) return;
        setPagination((prev) => ({ ...prev, currentPage: page }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleFilterChange = (filters) => {
        setFilterValue(filters);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleCarouselMove = (section, direction) => {
        const items = section === "newest" ? newestHouses : highRatingHouses;
        if (items.length <= SECTION_LIMIT) return;

        const setStartIndex = section === "newest" ? setNewestStartIndex : setHighRatingStartIndex;
        setStartIndex((currentIndex) => {
            return (currentIndex + direction + items.length) % items.length;
        });
    };

    // eslint-disable-next-line no-unused-vars
    const handleSeeMoreNewest = () => {
        // TODO: Điều hướng đến trang Newest (có thể dùng react-router)
        alert("Chuyển đến trang tất cả boarding house mới nhất");
        // navigate('/newest'); // nếu dùng react-router
    };

    // eslint-disable-next-line no-unused-vars
    const handleSeeMoreHighRating = () => {
        alert("Chuyển đến trang boarding house đánh giá cao");
        // navigate('/high-rating');
    };

    return (
        <>
            <Header />

            <main className="guest-home">
                <section className="guest-hero">
                    <div className="container">
                        <div className="guest-hero__content">
                            <span className="guest-hero__eyebrow">RoomHub Boarding Houses</span>
                            <h1>Find a boarding house that feels easy to live in.</h1>
                            <p>Browse available boarding houses, compare locations, room availability, ratings, and prices in one place.</p>
                        </div>
                    </div>
                </section>
                <section className="container guest-listing-section">
                    <div className="guest-results-layout">
                        <aside className="guest-results-layout__sidebar">
                            <FilterBoardingHouseUser setFilterValue={handleFilterChange} />
                        </aside>

                        <div className="guest-results-layout__main">
                            <div className="guest-search guest-search--listing" role="search">
                                <Search size={20} />
                                <input
                                    type="search"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder="Tìm kiếm theo tên phòng, địa điểm, khu vực..."
                                    aria-label="Search boarding houses"
                                    autoComplete="off"
                                />
                                <button type="button" onClick={fetchBoardingHouses}>
                                    Tìm kiếm
                                </button>
                            </div>

                            <div className="guest-results-toolbar">
                                <div className="guest-results-toolbar__title">
                                    <h2>
                                        Tìm thấy <span>{pagination.totalItems || 0}</span> kết quả phù hợp
                                    </h2>
                                </div>
                                <label className="guest-sort">
                                    <span>Sắp xếp theo:</span>
                                    <select defaultValue="newest" aria-label="Sort boarding houses">
                                        <option value="newest">Mới nhất</option>
                                    </select>
                                </label>
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
                            <button type="button" onClick={fetchBoardingHouses}>
                                Try again
                            </button>
                        </div>
                    ) : boardingHouses.length > 0 ? (
                        <>
                            <div className="guest-grid">
                                {boardingHouses.map((house) => (
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
                            <p>Try another name or reset the filters.</p>
                        </div>
                    )}
                        </div>
                    </div>
                </section>
                <section className="container guest-listing-section">
                    <div className="guest-section-header">
                        <div>
                            <span className="guest-section-kicker">New Arrivals</span>
                            <h2>Boarding Houses Mới Nhất</h2>
                        </div>
                    </div>

                    {newestLoading ? (
                        <div className="guest-carousel-shell">
                            <div className="guest-carousel-grid">
                                {Array.from({ length: SECTION_LIMIT }).map((_, i) => (
                                    <div className="guest-card guest-card--loading" key={i} />
                                ))}
                            </div>
                        </div>
                    ) : newestHouses.length > 0 ? (
                        <div className="guest-carousel-shell">
                            <button
                                className="guest-carousel-arrow guest-carousel-arrow--prev"
                                type="button"
                                aria-label="Previous newest boarding houses"
                                disabled={newestHouses.length <= SECTION_LIMIT}
                                onClick={() => handleCarouselMove("newest", -1)}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div className="guest-carousel-grid">
                                {visibleNewestHouses.map((house) => (
                                    <BoardingHouseCard key={house._id} house={house} />
                                ))}
                            </div>
                            <button
                                className="guest-carousel-arrow guest-carousel-arrow--next"
                                type="button"
                                aria-label="Next newest boarding houses"
                                disabled={newestHouses.length <= SECTION_LIMIT}
                                onClick={() => handleCarouselMove("newest", 1)}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    ) : (
                        <div className="guest-empty">
                            <p>Chưa có boarding house mới nào.</p>
                        </div>
                    )}
                </section>
                <section className="container guest-listing-section">
                    <div className="guest-section-header">
                        <div>
                            <span className="guest-section-kicker">Highly Rated</span>
                            <h2>Boarding Houses Đánh Giá Cao</h2>
                        </div>
                    </div>

                    {highRatingLoading ? (
                        <div className="guest-carousel-shell">
                            <div className="guest-carousel-grid">
                                {Array.from({ length: SECTION_LIMIT }).map((_, i) => (
                                    <div className="guest-card guest-card--loading" key={i} />
                                ))}
                            </div>
                        </div>
                    ) : highRatingHouses.length > 0 ? (
                        <div className="guest-carousel-shell">
                            <button
                                className="guest-carousel-arrow guest-carousel-arrow--prev"
                                type="button"
                                aria-label="Previous high rating boarding houses"
                                disabled={highRatingHouses.length <= SECTION_LIMIT}
                                onClick={() => handleCarouselMove("highRating", -1)}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div className="guest-carousel-grid">
                                {visibleHighRatingHouses.map((house) => (
                                    <BoardingHouseCard key={house._id} house={house} />
                                ))}
                            </div>
                            <button
                                className="guest-carousel-arrow guest-carousel-arrow--next"
                                type="button"
                                aria-label="Next high rating boarding houses"
                                disabled={highRatingHouses.length <= SECTION_LIMIT}
                                onClick={() => handleCarouselMove("highRating", 1)}
                            >
                                <ChevronRight size={24} />
                            </button>
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
