
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFavorites, toggleFavorite } from "../../api/favorite";
import { Heart, Star, MapPin, Clock } from "lucide-react";
import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";

const FavoritesPage = () => {
    const [favorites, setFavorites] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const res = await getFavorites();
                if (res?.favorites) setFavorites(res.favorites);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    const formatCurrency = (value) => {
        const n = Number(value);
        if (Number.isNaN(n)) return "Contact";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(n);
    };

    const formatAddress = (a) =>
        !a ? "" : [a.detail, a.ward?.name, a.district?.name, a.province?.name].filter(Boolean).join(", ");

    const removeFavorite = async (e, id) => {
        e.stopPropagation();
        try {
            await toggleFavorite(id);
            setFavorites((prev) => prev.filter((i) => (i.id || i._id) !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <Header />
            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold"> My Favorites</h2>
                    </div>
                </div>

                <div className="row g-4">
                    {favorites.map((item) => {
                        const id = item.id || item._id;
                        return (
                            <div className="col-lg-4 col-md-6" key={id}>
                                <div
                                    className="card border-0 h-100"
                                    style={{
                                        borderRadius: 18,
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        transition: ".25s",
                                        boxShadow: "0 4px 15px rgba(0,0,0,.08)"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-6px)";
                                        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,.18)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,.08)";
                                    }}
                                    onClick={() => navigate(`/boarding-houses/${id}`)}
                                >
                                    <div style={{ position: "relative" }}>
                                        <img
                                            src={item.img?.[0]?.imageUrl || "/image/logoconen.png"}
                                            alt={item.name}
                                            style={{ width: "100%", height: 220, objectFit: "cover" }}
                                        />
                                        <button
                                            className="btn btn-light rounded-circle shadow"
                                            style={{ position: "absolute", top: 15, right: 15, width: 42, height: 42 }}
                                            onClick={(e) => removeFavorite(e, id)}
                                        >
                                            <Heart size={18} fill="#ff6b00" color="#ff6b00" />
                                        </button>
                                    </div>

                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex justify-content-between">
                                            <h5 className="fw-bold text-truncate">{item.name}</h5>
                                            <span className="d-flex align-items-center text-warning fw-semibold">
                                                <Star size={16} fill="currentColor" />&nbsp;{item.rating ?? 0}
                                            </span>
                                        </div>

                                        <div className="small fw-semibold mb-2" style={{ color: "#ff6b00" }}>
                                            {item.boardingHouseType || "Boarding House"}
                                        </div>

                                        <div className="small text-muted d-flex mb-2">
                                            <MapPin size={15} className="me-1 mt-1" />
                                            <span>{formatAddress(item.address)}</span>
                                        </div>

                                        {item.timeAgo && (
                                            <div className="small text-secondary mb-2">
                                                <Clock size={14} /> {item.timeAgo}
                                            </div>
                                        )}

                                        <p
                                            className="text-muted"
                                            style={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                minHeight: 48
                                            }}
                                        >
                                            {item.detail}
                                        </p>

                                        <div className="mt-auto d-flex justify-content-between align-items-center">
                                            <div className="fw-bold fs-5" style={{ color: "#ff6b00" }}>
                                                {formatCurrency(item.price)}
                                            </div>

                                            <button
                                                className="btn"
                                                style={{ background: "#ff6b00", color: "#fff", borderRadius: 30 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/boarding-houses/${id}`);
                                                }}
                                            >
                                                View Detail
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {favorites.length === 0 && (
                    <div className="text-center py-5 mt-5">
                        <Heart size={70} color="#ff6b00" />
                        <h3 className="mt-3">No favorites yet</h3>
                        <p className="text-muted">Save your favorite boarding houses to see them here.</p>
                        <button className="btn" style={{ background: "#ff6b00", color: "#fff" }} onClick={() => navigate("/boarding-houses")}>
                            Explore Boarding Houses
                        </button>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
};

export default FavoritesPage;
