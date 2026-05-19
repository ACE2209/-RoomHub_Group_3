/* eslint-disable jsx-a11y/alt-text */
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import "./Header.css";

export default function Header() {
    const [user, setUser] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        // Nếu có dữ liệu người dùng trong localStorage, cập nhật state user
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
    };

    const isMentor = user?.role === "mentor";
    

    return (
        <>
            <header className={`headerpage ${scrolled ? "scrolled" : ""}`}>
                <img src="/assets/leftLogo.png" alt="logo" className="logo" />

                <ul className="mainMenu">
                    <li
                        className={`menuItem ${location.pathname === "/" ? "active" : ""}`}
                        onClick={() => navigate("/")}
                    >
                        Trang chủ
                    </li>

                    <li
                        className={`menuItem ${location.pathname === "/mentors" ? "active" : ""}`}
                        onClick={() => navigate("/allmentor")}
                    >
                        Tất cả mentor
                    </li>

                    <li
                        className={`menuItem ${location.pathname === (isMentor ? "/mentor-slots" : "/Schedules")
                            ? "active"
                            : ""
                            }`}
                        onClick={() =>
                            navigate(isMentor ? "/mentor-slots" : "/Schedules")
                        }
                    >
                        {isMentor ? "Lịch của tôi" : "Lịch hẹn"}
                    </li>

                    <li
                        className={`menuItem ${location.pathname === "/contact" ? "active" : ""}`}
                        onClick={() => navigate("/contact")}
                    >
                        Tin Tức
                    </li>
                </ul>


                <div className="nav">
                    {!user ? (
                        <>
                            <button
                                className="loginBtn"
                                onClick={() => navigate("/loginpage")}
                            >
                                Đăng nhập
                            </button>
                            <button
                                className="signupBtn"
                                onClick={() => navigate("/Signup")}
                            >
                                Đăng ký
                            </button>
                        </>
                    ) : (
                        <div className="userInfo">
                            <div
                                className="userTrigger"
                                onClick={() => setShowMenu(!showMenu)}
                            >
                                <img src={user.avatar} className="avatar" />
                                <span>{user.name}</span>
                            </div>

                            {showMenu && (
                                <div className="dropdownMenu">
                                    <div
                                        className="dropdownItem"
                                        onClick={() => navigate("/profile")}
                                    >
                                        Profile
                                    </div>
                                    <div
                                        className="dropdownItem"
                                        onClick={() => navigate("/settings")}
                                    >
                                        Cài đặt
                                    </div>
                                    <div
                                        className="dropdownItem logout"
                                        onClick={handleLogout}
                                    >
                                        Đăng xuất
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>
        </>
    );
}
