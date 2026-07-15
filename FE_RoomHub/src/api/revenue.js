import instance from "./axios.config";

export const getTotalRevenue = async (params = {}) => {
  return instance.get("/dashboard/revenue/total", {
    params,
  });
};

export const getRevenueBoardingHouseOptions = async () => {
  return instance.get(
    "/dashboard/revenue/boarding-houses/options"
  );
};

export const getBoardingHouseMonthlyRevenue = async (
  boardingHouseId,
  params = {}
) => {
  return instance.get(
    `/dashboard/revenue/boarding-houses/${boardingHouseId}/monthly`,
    {
      params,
    }
  );
};