import './HomePage.css';
import Footer from "./layout/homepage/footer";
import Header from "./layout/homepage/header";
import { useNavigate } from "react-router-dom";

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
    const navigate = useNavigate();
    return (
        <>
            <Header />

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
                                            <button
                                                className="btn-detail"
                                                onClick={() => navigate(`/boarding-house/${item.id}`)}
                                            >
                                                Chi tiết
                                                <span
                                                    className="material-symbols-outlined"
                                                    style={{ fontSize: 18 }}
                                                >
                                                    chevron_right
                                                </span>
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

            <Footer />
        </>
    );
};

export default HomePage;



