import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBoardingHouseDetail } from "../../api/boardingHouse";

const BoardingHouseDetail = () => {
    const { id } = useParams();

    const [boardingHouse, setBoardingHouse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const result = await getBoardingHouseDetail(id);

                if (result.success) {
                    setBoardingHouse(result.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    if (loading) return <h2>Loading...</h2>;

    if (!boardingHouse) return <h2>Không tìm thấy nhà trọ</h2>;

    return (
        <div className="container">
            <h1>{boardingHouse.name}</h1>

            <img
                src={boardingHouse.images?.[0]?.imageUrl}
                alt={boardingHouse.name}
                style={{
                    width: "100%",
                    maxHeight: "500px",
                    objectFit: "cover",
                    borderRadius: "12px",
                }}
            />

            <h3>Mô tả</h3>
            <p>{boardingHouse.description}</p>

            <h3>Thông tin</h3>

            <p>
                <strong>Loại:</strong>{" "}
                {boardingHouse.boardingHouseType?.name}
            </p>

            <p>
                <strong>Giá từ:</strong>{" "}
                {boardingHouse.priceRange?.toLocaleString()} VNĐ
            </p>

            <p>
                <strong>Số phòng:</strong>{" "}
                {boardingHouse.availableRooms}/
                {boardingHouse.totalRooms}
            </p>

            <p>
                <strong>Điện:</strong>{" "}
                {boardingHouse.electricityPrice?.toLocaleString()} VNĐ
            </p>

            <p>
                <strong>Nước:</strong>{" "}
                {boardingHouse.waterPrice?.toLocaleString()} VNĐ
            </p>

            <p>
                <strong>Đánh giá:</strong>{" "}
                {boardingHouse.rating} ⭐
            </p>

            <h3>Địa chỉ</h3>

            <p>
                {boardingHouse.address?.detail},{" "}
                {boardingHouse.address?.ward?.name},{" "}
                {boardingHouse.address?.district?.name},{" "}
                {boardingHouse.address?.province?.name}
            </p>

            <h3>Chủ trọ</h3>

            <p>{boardingHouse.ownerId?.fullname}</p>
            <p>{boardingHouse.ownerId?.email}</p>
            <p>{boardingHouse.ownerId?.username}</p>
        </div>
    );
};

export default BoardingHouseDetail;