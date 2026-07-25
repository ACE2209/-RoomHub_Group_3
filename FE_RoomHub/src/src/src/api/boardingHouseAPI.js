import axios from './axios.config';
export const filterBHUser = async (filterValue) => {
  return axios.get(`/boardinghouse/filter`, {
    params: filterValue,
  });
};
export const getBhByArea = async (filterValue = {}) => {
  return axios.get('/boardinghouse/home/area', {
    params: filterValue,
  });
};
export const getBoardingHouseTypesForGuest = () => {
  return axios.get('/boardinghouse/types');
};
export const getMaxPriceBHForGuest = () => {
  return axios.get('/boardinghouse/home/max-price');
};
export const getAllBHHome = () => {
  return axios.get('/boardinghouse');
};
export const getBoardingHouseDetails = async (boardingHouseId) => {
  return axios.get(`/dashboard/boardinghouse/${boardingHouseId}`);
};
export const updateBoardingHouseDetails = (boardingHouseId, updateData) => {
  return axios.put(`/dashboard/boardinghouse/${boardingHouseId}`, updateData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getAllBoardingHouseTypes = () => {
  return axios.get('/dashboard/types');
};
export const addBoardingHouseImage = (boardingHouseId, imageData) => {
  return axios.post(
    `/dashboard/boardinghouse/${boardingHouseId}/images`,
    imageData
  );
};
export const updateBoardingHouseImage = (
  boardingHouseId,
  imageId,
  imageData
) => {
  return axios.put(
    `/dashboard/boardinghouse/${boardingHouseId}/images/${imageId}`,
    imageData
  );
};
export const deleteBoardingHouseImage = (boardingHouseId, imageId) => {
  return axios.delete(
    `/dashboard/boardinghouse/${boardingHouseId}/images/${imageId}`
  );
};
export const getBoardingHouseImages = async (boardingHouseId) => {
  return axios.get(`/dashboard/boardinghouse/${boardingHouseId}/images`);
};
export const createBoardingHouse = (data) => {
  return axios.post('/dashboard/boardinghouse/create', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getMaxPriceBH = async () => {
  return axios.get('/dashboard/boardinghouse/chore/get-max');
};

export const filterBH = async (filterValue) => {
  return axios.get(`/dashboard/boardinghouses/filter`, {
    params: filterValue,
  });
};
export const softDeleteBoardingHouse = async (boardingHouseId) => {
  return axios.delete(`/dashboard/boardinghouses/${boardingHouseId}`);
};
