import axios from "axios";

const API_URL = "http://localhost:3000";

export const getProfileAPI = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.get(
        `${API_URL}/auth/profile`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data;
};