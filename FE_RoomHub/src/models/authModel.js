// models/authModel.js
export async function getUserByEmail(email) {
    const res = await fetch(
        `http://localhost:3001/users?email=${email}`
    );
    return res.json();
}
