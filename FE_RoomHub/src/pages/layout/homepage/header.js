import React, { useState, useEffect } from "react";
import {
    Heart,
    Clock,
    Bell,
    Search,
    MapPin,
    MessageCircle,
    ChevronDown,
    Building2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getFavorites } from "../../../api/favorite";
const Header = () => {
    const navigate = useNavigate();

    const [isScrolled, setIsScrolled] = useState(false);
    const [showLocation, setShowLocation] = useState(false);

    const [user, setUser] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

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
    }, [user]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
    };

    const getDashboardRoute = () => {
        switch (user?.role) {
            case "admin":
                return "/admin";
            case "staff":
            case "owner":
                return "/my-boarding-houses";
            default:
                return "/profile";
        }
    };

    const handleFavoriteClick = () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        navigate("/favorites");
    };

    const handleWatchLaterClick = () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        navigate("/watchlater");
    };

    const menuItemStyle = {
        display: "block",
        padding: "10px 12px",
        borderRadius: "10px",
        textDecoration: "none",
        color: "#1f2937",
        fontWeight: 600,
        fontSize: "14px",
        transition: "0.2s",
    };

    return (
        <>
            <header
                className={`fixed-top bg-white border-bottom ${isScrolled ? "shadow" : ""}`}
            >
                <div className="container-fluid px-3">
                    <div
                        className="d-flex align-items-center justify-content-between"
                        style={{ height: "80px" }}
                    >
                        <div className="d-flex align-items-center gap-3 position-relative">
                            <a href="/" className="d-flex align-items-center">
                                <img
                                    src="/image/logo.png"
                                    alt="Logo"
                                    className="img-fluid"
                                    style={{ maxWidth: "220px", maxHeight: "160px" }}
                                />
                            </a>
                            <button
                                onClick={() => setShowLocation(!showLocation)}
                                className="btn border rounded-pill d-flex align-items-center gap-2 px-3"
                                style={{
                                    height: "50px",
                                    borderColor: "#ff6b00",
                                    color: "#222",
                                }}
                            >
                                <MapPin size={18} color="#ff6b00" />

                                <span className="fw-semibold">
                                    Ho Chi Minh City
                                </span>

                                <ChevronDown size={16} />
                            </button>
                            {showLocation && (
                                <div
                                    className="position-absolute bg-white shadow rounded-4 p-4"
                                    style={{
                                        width: "450px",
                                        top: "60px",
                                        left: "120px",
                                        zIndex: 1000,
                                    }}
                                >
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <Building2 size={22} />
                                        <h5 className="mb-0 fw-bold">
                                            Search by area
                                        </h5>
                                    </div>

                                    <div className="d-flex gap-2 mb-4">
                                        <button className="btn btn-dark rounded-pill">
                                            Ho Chi Minh City
                                        </button>

                                        <button className="btn btn-light rounded-pill">
                                            Hanoi
                                        </button>

                                        <button className="btn btn-light rounded-pill">
                                            Da Nang
                                        </button>
                                    </div>

                                    <select className="form-select mb-3">
                                        <option>Select province</option>
                                        <option>Ho Chi Minh City</option>
                                        <option>Can Tho</option>
                                        <option>Hanoi</option>
                                    </select>

                                    <select className="form-select mb-3">
                                        <option>Select district</option>
                                    </select>

                                    <select className="form-select mb-4" disabled>
                                        <option>Select ward</option>
                                    </select>

                                    <div className="d-flex gap-2">
                                        <button className="btn btn-outline-secondary flex-fill">
                                            Clear Filter
                                        </button>

                                        <button
                                            className="btn text-white flex-fill"
                                            style={{ backgroundColor: "#ff6b00" }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div
                            className="flex-grow-1 mx-4 d-none d-md-block"
                            style={{ maxWidth: "800px" }}
                        >
                            <div className="position-relative">
                                <input
                                    type="text"
                                    className="form-control rounded-pill ps-4 pe-5"
                                    placeholder="Search properties..."
                                    style={{
                                        height: "48px",
                                        background: "#f5f5f5",
                                        border: "1px solid #e5e5e5",
                                    }}
                                />

                                <button
                                    className="btn position-absolute top-50 end-0 translate-middle-y me-1 rounded-circle"
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        backgroundColor: "#ff6b00",
                                        color: "#fff",
                                    }}
                                >
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-3">

                            <button
                                className="btn border-0 p-0 position-relative"
                                onClick={handleFavoriteClick}
                            >
                                <Heart
                                    size={24}
                                    fill={favorites.length > 0 ? "red" : "none"}
                                    color={favorites.length > 0 ? "red" : "black"}
                                />

                                {favorites.length > 0 && (
                                    <span
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                        style={{ fontSize: "10px" }}
                                    >
                                        {favorites.length}
                                    </span>
                                )}
                            </button>

                            <button
                                className="btn border-0 p-0"
                                onClick={handleWatchLaterClick}
                            >
                                <Clock size={24} />
                            </button>

                            <button className="btn border-0 p-0">
                                <Bell size={24} />
                            </button>

                            <button className="btn btn-outline-secondary rounded-pill d-none d-lg-flex align-items-center gap-2">
                                <MessageCircle size={18} />
                                Contact
                            </button>

                            {(user?.role === "owner" || user?.role === "staff") && (
                                <Link
                                    to="/my-boarding-houses/new"
                                    className="btn rounded-pill text-white fw-semibold"
                                    style={{ backgroundColor: "#ff6b00" }}
                                >
                                    Post Listing
                                </Link>
                            )}

                            {!user ? (
                                <Link
                                    to="/login"
                                    className="btn btn-outline-secondary rounded-pill"
                                >
                                    Login
                                </Link>
                            ) : (
                                <div className="position-relative">

                                    <button
                                        className="btn border rounded-pill d-flex align-items-center gap-2 px-2"
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                    >

                                        <span className="fw-semibold">
                                            {user.fullname || user.username}
                                        </span>

                                        <span className="badge" style={{ backgroundColor: "#ff6b00" }}>
                                            {user.role}
                                        </span>

                                        <ChevronDown size={16} />
                                    </button>

                                    {showUserMenu && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                top: "calc(100% + 10px)",
                                                width: "280px",
                                                background: "#fff",
                                                borderRadius: "14px",
                                                boxShadow: "0 12px 35px rgba(0,0,0,0.12)",
                                                overflow: "hidden",
                                                zIndex: 9999,
                                                border: "1px solid #eee",
                                            }}
                                        >
                                            <div style={{ padding: "8px" }}>
                                                {(user.role === "admin" || user.role === "staff") && (
                                                    <Link
                                                        to={getDashboardRoute()}
                                                        style={menuItemStyle}
                                                        onMouseEnter={(e) =>
                                                            (e.currentTarget.style.background = "#f5f5f5")
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.currentTarget.style.background = "transparent")
                                                        }
                                                    >
                                                        {user.role === "staff" ? "My Boarding Houses" : "Dashboard"}
                                                    </Link>
                                                )}

                                                {user.role === "user" && (
                                                    <Link
                                                        to="/profile"
                                                        style={menuItemStyle}
                                                        onMouseEnter={(e) =>
                                                            (e.currentTarget.style.background = "#f5f5f5")
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.currentTarget.style.background = "transparent")
                                                        }
                                                    >
                                                        My Profile
                                                    </Link>
                                                )}

                                                {user.role === "owner" && (
                                                    <Link
                                                        to="/my-boarding-houses"
                                                        style={menuItemStyle}
                                                        onMouseEnter={(e) =>
                                                            (e.currentTarget.style.background = "#f5f5f5")
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.currentTarget.style.background = "transparent")
                                                        }
                                                    >
                                                        My Properties
                                                    </Link>
                                                )}

                                                <button
                                                    onClick={handleLogout}
                                                    style={{
                                                        ...menuItemStyle,
                                                        color: "#dc2626",
                                                        width: "100%",
                                                        textAlign: "left",
                                                        border: "none",
                                                        background: "transparent",
                                                        cursor: "pointer",
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.background = "#fef2f2")
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.background = "transparent")
                                                    }
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <div style={{ height: "68px" }} />
        </>
    );
};

export default Header;
