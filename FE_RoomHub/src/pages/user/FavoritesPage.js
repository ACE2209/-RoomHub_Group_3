import { useEffect, useState } from "react";
import { getFavorites } from "../../api/favorite";
import { Heart, Star, MapPin, BedDouble } from "lucide-react";
import Footer from "../layout/homepage/footer";
import Header from "../layout/homepage/header";

const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return "Contact";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(numberValue);
};

const formatAddress = (address) => {
    if (!address) return "";

    return [
        address.detail,
        address.ward?.name,
        address.district?.name,
        address.province?.name,
    ]
        .filter(Boolean)
        .join(", ");
};

const FavoritesPage = () => {
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        const load = async () => {
            const res = await getFavorites();
            if (res?.favorites) setFavorites(res.favorites);
        };

        load();
    }, []);

    return (
        <>
            <Header />
            <div className="container mt-4">

                <h2 className="mb-4 d-flex align-items-center gap-2">
                    <Heart color="red" /> My Favorites
                </h2>

                <div className="row g-3">
                    {favorites.map((item) => (
                        <div className="col-md-4" key={item.id}>
                            <div
                                className="card shadow-sm border-0 h-100"
                                style={{ borderRadius: "12px", overflow: "hidden" }}
                            >
                                {/* IMAGE */}
                                <div style={{ height: "180px", overflow: "hidden" }}>
                                    <img
                                        src={
                                            item.img?.[0]?.imageUrl ||
                                            "/image/logoconen.png"
                                        }
                                        alt={item.name}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>

                                <div className="p-3 d-flex flex-column gap-2">
                                    {/* NAME + RATING */}
                                    <div className="d-flex justify-content-between align-items-start">
                                        <h5 className="mb-0">{item.name}</h5>

                                        <span className="d-flex align-items-center gap-1 text-warning">
                                            <Star size={16} fill="currentColor" />
                                            {item.rating ?? 0}
                                        </span>
                                    </div>

                                    {/* ADDRESS */}
                                    <div className="text-muted small d-flex align-items-center gap-1">
                                        <MapPin size={14} />
                                        {formatAddress(item.address)}
                                    </div>

                                    {/* PRICE */}
                                    <div className="fw-bold text-primary">
                                        {formatCurrency(item.price)}
                                    </div>

                                    {/* ROOMS */}
                                    <div className="d-flex align-items-center gap-2 text-secondary small">
                                        <BedDouble size={16} />
                                        {item.availableRooms}/{item.totalRooms} rooms
                                    </div>

                                    {/* DESCRIPTION */}
                                    <p
                                        className="text-muted small mb-0"
                                        style={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {item.detail}
                                    </p>

                                    {/* FOOTER */}
                                    <div className="d-flex justify-content-between align-items-center mt-2">
                                        <span className="text-danger small">
                                            ❤️ {item.likes ?? 0}
                                        </span>

                                        <button className="btn btn-sm btn-outline-primary rounded-pill">
                                            View detail
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {favorites.length === 0 && (
                    <div className="text-center mt-5 text-muted">
                        You don't have any favorites yet 💔
                    </div>
                )}


            </div>
            <Footer />
        </>
    );
};

export default FavoritesPage;