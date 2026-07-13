import API_BASE_URL, { authHeaders, parseJsonResponse } from "../config";

const getRolePrefix = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user?.role || localStorage.getItem("role");

    if (role === "owner") return "/owner";
    if (role === "staff") return "/staff";

    return "/owner";
};

const buildQuery = (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
        }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : "";
};

export const createRoomAdditionFee = async (data) => {
    const res = await fetch(
        `${API_BASE_URL}${getRolePrefix()}/room-addition-fee`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
            },
            body: JSON.stringify(data),
        }
    );

    return parseJsonResponse(res);
};

// Danh mục tên phí bổ sung gợi ý (BE trả về, dùng cho Select trong FE)
export const getRoomAdditionFeeNameOptions = async () => {
    const res = await fetch(
        `${API_BASE_URL}${getRolePrefix()}/room-addition-fee/fee-name-options`,
        {
            method: "GET",
            headers: authHeaders(),
        }
    );

    return parseJsonResponse(res);
};

export const getAllRoomAdditionFees = async () => {
    const res = await fetch(
        `${API_BASE_URL}${getRolePrefix()}/room-addition-fee`,
        {
            method: "GET",
            headers: authHeaders(),
        }
    );

    return parseJsonResponse(res);
};

export const getRoomAdditionFeesByRoomId = async (
    roomId,
    params = {}
) => {
    const res = await fetch(
        `${API_BASE_URL}${getRolePrefix()}/room-addition-fee/${roomId}${buildQuery(
            params
        )}`,
        {
            method: "GET",
            headers: authHeaders(),
        }
    );

    return parseJsonResponse(res);
};

export const getRoomAdditionFeeForMonthlyCalculate = async (
    roomId,
    params = {}
) => {
    const res = await fetch(
        `${API_BASE_URL}${getRolePrefix()}/room-addition-fee/calculate-rent/${roomId}${buildQuery(
            params
        )}`,
        {
            method: "GET",
            headers: authHeaders(),
        }
    );

    return parseJsonResponse(res);
};

export const updateRoomAdditionFee = async (
    id,
    data
) => {
    const res = await fetch(
        `${API_BASE_URL}${getRolePrefix()}/room-addition-fee/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
            },
            body: JSON.stringify(data),
        }
    );

    return parseJsonResponse(res);
};

export const deleteRoomAdditionFee = async (id) => {
    const res = await fetch(
        `${API_BASE_URL}${getRolePrefix()}/room-addition-fee/${id}`,
        {
            method: "DELETE",
            headers: authHeaders(),
        }
    );

    return parseJsonResponse(res);
};