import "./Footer.css";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footerTop">
                <div className="footerBrand">
                    <h3>TIKO Planner</h3>
                    <p>
                        TIKO Planner là nền tảng kết nối sinh viên với mentor trong ngành,
                        giúp đặt lịch học 1–1 nhanh chóng, linh hoạt và hiệu quả.
                    </p>
                </div>

                <div>
                    <div className="footerTitle">Chính sách</div>
                    <ul className="footerList">
                        <li><a href="/privacy">Chính sách bảo mật</a></li>
                        <li><a href="/terms">Điều khoản sử dụng</a></li>
                        <li><a href="/refund">Chính sách hoàn tiền</a></li>
                        <li><a href="/contact">Liên hệ hỗ trợ</a></li>
                    </ul>
                </div>

                <div>
                    <div className="footerTitle">Dành cho Mentor</div>
                    <ul className="footerList">
                        <li><a href="/mentor/register">Đăng ký mentor</a></li>
                        <li><a href="/mentor/dashboard">Quản lý lịch dạy</a></li>
                        <li><a href="/mentor/reviews">Đánh giá & phản hồi</a></li>
                    </ul>
                </div>

                <div>
                    <div className="footerTitle">Menu</div>
                    <ul className="footerList">
                        <li><a href="/">Trang chủ</a></li>
                        <li><a href="/mentors">Danh sách mentor</a></li>
                        <li><a href="/about">Giới thiệu</a></li>
                        <li><a href="/loginpage">Đăng nhập</a></li>
                    </ul>
                </div>
            </div>

            <div className="footerBottom">
                © 2026 TIKO Planner. All rights reserved.
            </div>
        </footer>
    );
}
