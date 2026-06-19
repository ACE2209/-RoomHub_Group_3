import { useEffect, useState } from "react";
import {
    getBoardingHouseReviews,
    addReview,
    updateReview
} from "../api/review";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./ReviewSection.css";
import Swal from "sweetalert2";

const ReviewSection = ({ boardingHouseId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");

    const [showReviewModal, setShowReviewModal] =
        useState(false);

    const [editingReview, setEditingReview] =
        useState(null);

    const [currentUserId, setCurrentUserId] =
        useState(null);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decoded =
                    jwtDecode(token);

                console.log(
                    "TOKEN:",
                    decoded
                );

                setCurrentUserId(
                    decoded.userId
                );
            } catch (error) {
                console.error(error);
            }
        }
    }, [token]);

    const loadReviews = async () => {
        try {
            const res =
                await getBoardingHouseReviews(
                    boardingHouseId
                );

            setReviews(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boardingHouseId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let res;

            if (editingReview) {
                res = await updateReview(
                    editingReview._id,
                    {
                        rating,
                        content
                    }
                );
            } else {
                res = await addReview({
                    boardingHouseId,
                    rating,
                    content
                });
            }

            Swal.fire({
                icon: "success",
                title: "Success",
                text: res.message,
                timer: 2000,
                showConfirmButton: false
            });

            setContent("");
            setRating(5);
            setEditingReview(null);

            await loadReviews();

            setShowReviewModal(false);

        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.message || "Cannot save review",
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    const handleEditReview = (
        review
    ) => {
        setEditingReview(review);

        setRating(review.rating);
        setContent(review.content);

        setShowReviewModal(true);
    };

    const hasReviewed =
        reviews.some(
            (review) =>
                review.accountId?._id ===
                currentUserId
        );

    return (
        <section className="review-section">
            <h2>Reviews</h2>

            <div className="review-topbar">
                <div>
                    <span>
                        {reviews.length} reviews
                    </span>
                </div>

                {token ? (
                    !hasReviewed && (
                        <button
                            className="write-review-btn"
                            onClick={() => {
                                setEditingReview(
                                    null
                                );

                                setRating(5);
                                setContent("");

                                setShowReviewModal(
                                    true
                                );
                            }}
                        >
                            Write Review
                        </button>
                    )
                ) : (
                    <Link
                        to="/login"
                        className="login-review-btn"
                    >
                        Login To Review
                    </Link>
                )}
            </div>

            {showReviewModal && (
                <div
                    className="review-modal-overlay"
                    onClick={() =>
                        setShowReviewModal(
                            false
                        )
                    }
                >
                    <div
                        className="review-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <h3>
                            {editingReview
                                ? "Update Review"
                                : "Write a Review"}
                        </h3>

                        <div className="rating-picker">
                            {[1, 2, 3, 4, 5].map(
                                (star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() =>
                                            setRating(
                                                star
                                            )
                                        }
                                    >
                                        <Star
                                            fill={
                                                star <=
                                                    rating
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />
                                    </button>
                                )
                            )}
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) =>
                                setContent(
                                    e.target
                                        .value
                                )
                            }
                            placeholder="Share your experience..."
                        />

                        <div className="review-modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setShowReviewModal(
                                        false
                                    );

                                    setEditingReview(
                                        null
                                    );

                                    setRating(
                                        5
                                    );

                                    setContent(
                                        ""
                                    );
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className="submit-btn"
                                onClick={
                                    handleSubmit
                                }
                            >
                                {editingReview
                                    ? "Update Review"
                                    : "Submit Review"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <p>Loading reviews...</p>
            ) : reviews.length === 0 ? (
                <p>No reviews yet</p>
            ) : (
                <div className="review-list">
                    {reviews.map(
                        (review) => (
                            <div
                                key={
                                    review._id
                                }
                                className="review-card"
                            >
                                <div className="review-header">
                                    <div className="review-user-info">
                                        <div className="review-meta">
                                            <strong>
                                                {
                                                    review
                                                        .accountId
                                                        ?.fullname
                                                }
                                            </strong>

                                            <span>
                                                {new Date(
                                                    review.createdAt
                                                ).toLocaleDateString(
                                                    "vi-VN"
                                                )}
                                            </span>
                                        </div>

                                        <div className="review-stars">
                                            {[
                                                1,
                                                2,
                                                3,
                                                4,
                                                5
                                            ].map(
                                                (
                                                    star
                                                ) => (
                                                    <Star
                                                        key={
                                                            star
                                                        }
                                                        size={
                                                            16
                                                        }
                                                        fill={
                                                            star <=
                                                                review.rating
                                                                ? "currentColor"
                                                                : "none"
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <p>
                                    {
                                        review.content
                                    }
                                </p>

                                {currentUserId ===
                                    review
                                        .accountId
                                        ?._id && (
                                        <div className="review-actions">
                                            <button
                                                className="edit-review-btn"
                                                onClick={() =>
                                                    handleEditReview(
                                                        review
                                                    )
                                                }
                                            >
                                                Edit
                                                Review
                                            </button>
                                        </div>
                                    )}

                                {review.replyContent && (
                                    <div className="review-reply">
                                        <strong>
                                            Owner
                                            Reply
                                        </strong>

                                        <p>
                                            {
                                                review
                                                    .replyContent
                                                    .content
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            )}
        </section>
    );
};

export default ReviewSection;