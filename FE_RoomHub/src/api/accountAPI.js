import axios from "axios";

import API_URL from "./config";

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
