import API_BASE_URL, { authHeaders, parseJsonResponse } from "./config";

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

export const getManagedDeposits = async (params = {}) => {
  const res = await fetch(
    `${API_BASE_URL}${getRolePrefix()}/deposits${buildQuery(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const updateManagedDepositDecision = async (depositId, data) => {
  const res = await fetch(
    `${API_BASE_URL}${getRolePrefix()}/deposits/${depositId}/decision`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    }
  );


  
  return parseJsonResponse(res);
};

export const deleteManagedDeposit = async (depositId) => {
  const res = await fetch(
    `${API_BASE_URL}${getRolePrefix()}/deposits/${depositId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};
