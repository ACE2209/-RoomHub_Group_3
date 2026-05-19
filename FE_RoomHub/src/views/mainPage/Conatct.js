/* eslint-disable jsx-a11y/alt-text */
import { useState, useEffect } from "react";
import { Container, Row, Col, Badge, Spinner } from "react-bootstrap";
import {
    Calendar,
    Clock,
    ArrowRight,
    TrendingUp,
    Bookmark,
    Share2
} from "lucide-react";

import Header from "../layout/Header";
import Footer from "../layout/Footer";
import "./Contact.css";

// Dữ liệu bài viết được điều chỉnh cho phù hợp với App Đặt lịch Mentor
const MOCK_NEWS = [
    {
        id: 1,
        category: "Kinh nghiệm",
        title: "Làm sao để tìm được Mentor phù hợp với lộ trình nghề nghiệp của bạn?",
        excerpt: "Việc chọn đúng người dẫn dắt có thể giúp bạn tiết kiệm hàng năm trời loay hoay. Khám phá 5 tiêu chí quan trọng để chọn Mentor.",
        date: "12/03/2024",
        readTime: "6 phút đọc",
        author: "Mentor Hoàng Nam",
        image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800",
        featured: true
    },
    {
        id: 2,
        category: "Kỹ năng mềm",
        title: "Kỹ năng Networking: Xây dựng mối quan hệ chất lượng từ con số 0",
        excerpt: "Đừng chỉ đợi cơ hội đến, hãy học cách chủ động kết nối. Những bí kíp từ các chuyên gia hàng đầu trong mạng lưới Mentor.",
        date: "10/03/2024",
        readTime: "4 phút đọc",
        author: "Mentor Minh Thư",
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800",
        featured: false
    },
    {
        id: 3,
        category: "Lộ trình học",
        title: "Roadmap trở thành Senior Developer trong 2 năm tới",
        excerpt: "Các Mentor công nghệ chia sẻ về những chứng chỉ và kiến thức thực chiến bạn cần tập trung để thăng tiến nhanh nhất.",
        date: "08/03/2024",
        readTime: "8 phút đọc",
        author: "Mentor Quốc Bảo",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
        featured: false
    },
    {
        id: 4,
        category: "Career Talk",
        title: "Vượt qua hội chứng kẻ giả mạo (Imposter Syndrome)",
        excerpt: "Hầu hết các Mentee đều gặp phải tình trạng này khi bắt đầu vai trò mới. Hãy cùng lắng nghe lời khuyên từ những người đi trước.",
        date: "05/03/2024",
        readTime: "5 phút đọc",
        author: "Mentor Lan Anh",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
        featured: false
    }
];

export default function ContactPage() {
    const [activeCategory, setActiveCategory] = useState("Tất cả");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const categories = ["Tất cả", "Kinh nghiệm", "Kỹ năng mềm", "Lộ trình học", "Career Talk"];

    const filteredNews =
        activeCategory === "Tất cả"
            ? MOCK_NEWS
            : MOCK_NEWS.filter((item) => item.category === activeCategory);

    return (
        <div className="contactPage">
            <Header />

            <div className="contactContainer">
                <Container>

                    {/* Featured */}
                    <div className="featured-section">

                        <div className="section-title-box">
                            <TrendingUp size={20} />
                            <span>Góc nhìn từ Mentor</span>
                        </div>

                        {MOCK_NEWS.filter((n) => n.featured).map((item) => (
                            <div key={item.id} className="featured-card">
                                <Row className="g-0">
                                    <Col lg={7}>
                                        <img src={item.image} className="featured-img" />
                                    </Col>

                                    <Col lg={5}>
                                        <div className="featured-content">
                                            <Badge className="badge-soft">{item.category}</Badge>

                                            <h2>{item.title}</h2>

                                            <p>{item.excerpt}</p>

                                            <div className="meta-info">
                                                <span>
                                                    <Calendar size={14} /> {item.date}
                                                </span>

                                                <span>
                                                    <Clock size={14} /> {item.readTime}
                                                </span>
                                            </div>

                                            <button className="btn-read-more">
                                                Đọc chi tiết <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        ))}
                    </div>

                    {/* Filter */}

                    <div className="category-filter">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`filter-pill ${activeCategory === cat ? "active" : ""
                                    }`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* News list */}

                    {loading ? (
                        <div className="loadingBox">
                            <Spinner animation="border" variant="info" />
                        </div>
                    ) : (
                        <Row className="g-4">
                            {filteredNews.map((news) => (
                                <Col md={6} lg={4} key={news.id}>
                                    <div className="news-card">
                                        <div className="news-img">
                                            <img src={news.image} />
                                            <button className="bookmark-btn">
                                                <Bookmark size={16} />
                                            </button>
                                        </div>

                                        <div className="news-body">
                                            <div className="news-top">
                                                <span className="news-cat">{news.category}</span>
                                                <span className="news-date">{news.date}</span>
                                            </div>

                                            <h5>{news.title}</h5>

                                            <p>{news.excerpt}</p>

                                            <div className="news-footer">
                                                <span>{news.readTime}</span>

                                                <button className="icon-btn">
                                                    <Share2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    )}

                    {/* Map */}

                    <div className="mapBox">
                        <h4>Văn phòng</h4>

                        <iframe
                            title="Google Map Location"
                            src="https://www.google.com/maps?q=Can+Tho&output=embed"
                            width="100%"
                            height="400"
                            style={{ border: 0 }}
                            loading="lazy"
                        ></iframe>
                    </div>
                </Container>
            </div>

            <Footer />
        </div>
    );
}