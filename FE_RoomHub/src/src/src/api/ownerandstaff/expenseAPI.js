import API_URL, {
  authHeaders,
  parseJsonResponse,
  getRolePrefix,
  buildQuery,
} from "../config";

export const getExpensesByTime = async (boardingHouseId, month, year) => {
  const res = await fetch(
    `${API_URL}/${getRolePrefix()}/expenses${buildQuery({ boardingHouseId, month, year })}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const addExpense = async (data) => {
  const res = await fetch(`${API_URL}/${getRolePrefix()}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse(res);
};

export const updateExpense = async (expenseId, data) => {
  const res = await fetch(
    `${API_URL}/${getRolePrefix()}/expenses/${expenseId}`,
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

export const deleteExpense = async (expenseId) => {
  const res = await fetch(
    `${API_URL}/${getRolePrefix()}/expenses/${expenseId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};
