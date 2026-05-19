/* eslint-disable jsx-a11y/alt-text */
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import mentorData from "../../data/mentor.json";
import { useNavigate } from "react-router-dom";
import "./AllMentor.css";

export default function AllMentorPage() {
    const navigate = useNavigate();

    return (
        <div className="allMentorPage">
            <Header />

            <section className="mentor-container">
                <div className="mentor-grid">
                    {mentorData.map((mentor) => (
                        <div
                            key={mentor.id}
                            className="mentor-card"
                            onClick={() => navigate(`/mentor/${mentor.id}`)}
                        >
                            <img src={mentor.avatar} className="mentor-avatar" />

                            <div className="mentor-info">
                                <h3>{mentor.name}</h3>
                                <span className="mentor-role">{mentor.role}</span>

                                <div className="mentor-meta">
                                    <span className="mentor-category">
                                        {mentor.category}
                                    </span>
                                    <span className="mentor-rating">
                                        ⭐ {mentor.rating} ({mentor.reviews})
                                    </span>
                                </div>

                                <p className="mentor-desc">{mentor.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
}