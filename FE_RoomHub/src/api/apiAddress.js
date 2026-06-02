import axios from 'axios';

const host = " https://esgoo.net/api-tinhthanh/";

export const fetchProvinces = async () => {
    try {
        const response = await axios.get(`${host}1/0.htm`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching provinces:', error.response || error.message);
        throw error;
    }
};


export const fetchProvincesByName = async (name) => {
    try {
        const response = await axios.get(`${host}1/0.htm`);
        const provinces = response.data.data;

        return provinces.find((province) => province.name.includes(name)) || null;
    } catch (error) {
        console.error('Error fetching provinces:', error.response || error.message);
        throw error;
    }
};



export const fetchDistricts = async (provinceCode) => {
    try {
        const response = await axios.get(`${host}2/${provinceCode}.htm`);
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching districts:', error.response || error.message);
        throw error;
    }
};

export const fetchWards = async (districtCode) => {
    try {
        const response = await axios.get(`${host}3/${districtCode}.htm`);
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching wards:', error.response || error.message);
        throw error;
    }
};
