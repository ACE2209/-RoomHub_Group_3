// views/mainPage/SettingsPage.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MentorSettings from "../components/MentorSettings";
import StudentSettings from "../components/StudentSettings";

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        // Chưa login → đá về login
        if (!storedUser) {
            navigate("/loginpage");
            return;
        }

        setUser(JSON.parse(storedUser));
    }, [navigate]);

    if (!user) return null;

    return (
        <div style={{ padding: "40px" }}>
            <h2>Account Settings</h2>

            {user.role === "mentor" && <MentorSettings user={user} />}
            {user.role === "student" && <StudentSettings user={user} />}
        </div>
    );
}
