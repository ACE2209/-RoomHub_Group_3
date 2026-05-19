import React, { useState } from "react";
import { useParams } from "react-router-dom";

import mentorData from "../../data/mentor.json";
import "./MentorDetail.css";

export default function MentorDetailPage() {
    // Lấy ID mentor từ URL
    const { id } = useParams();
    // Tìm mentor trong dữ liệu dựa trên ID
    const mentor = mentorData.find(m => m.id === Number(id));
    // State để lưu mentor đã chọn (nếu có)
    const [selectedMentor, setSelectedMentor] = useState(null);
    // Nếu không tìm thấy mentor, hiển thị thông báo lỗi   
    if (!mentor) return <h2>Mentor not found</h2>;

    return (
        // Hiển thị chi tiết mentor
        <div className="mentorDetail">

            {/* LEFT */}
            {/* Hiển thị thông tin cơ bản của mentor và nút chọn mentor */}
            <div className="mentor-left">

                <div className="mentor-card">
                    <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        className="mentor-avatar"
                        onError={(e) => {
                            e.target.src = "/assets/default-avatar.png";
                        }}
                    />

                    <h2>{mentor.name}</h2>
                    <p className="mentor-role">{mentor.role}</p>

                    <div className="mentor-rating">
                        ⭐ {mentor.rating} ({mentor.reviews})
                    </div>

                    <div className="mentor-tags">
                        {mentor.skills?.map(skill => (
                            <span key={skill}>{skill}</span>
                        ))}
                    </div>

                    {/* SELECT MENTOR BUTTON */}
                    <button
                        className="select-mentor-btn"
                        onClick={() => setSelectedMentor(mentor)}
                    >
                        Select Mentor
                    </button>

                </div>
                {/* Hiển thị phần giới thiệu về mentor */}
                <div className="mentor-about">
                    <h3>About Me</h3>
                    <p>{mentor.about || mentor.desc}</p>
                </div>

            </div>

            {/* RIGHT */}
            {/* Hiển thị phần chi tiết và hành động khi đã chọn mentor  */}
            <div className="mentor-right">

                <h2>Mentor Details</h2>
                <p>
                    Book a session or message mentor directly.
                </p>

            </div>

            {/* ===== FIXED BOTTOM PANEL ===== */}
            {/* Hiển thị thanh thông tin mentor đã chọn và các hành động liên quan khi đã chọn mentor  */}
            {selectedMentor && (
                <div className="booking-bar">

                    <div>
                        <h4>Selected Mentor</h4>
                        <p>{selectedMentor.name}</p>
                    </div>

                    <div className="slot-actions">
                        <button className="msg-btn">Message</button>
                        <button className="book-btn">Book</button>
                    </div>

                </div>
            )}

        </div>
    );
}
