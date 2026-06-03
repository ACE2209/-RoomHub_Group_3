import { useEffect, useState } from "react";
import { getProfileAPI } from "../../api/accountAPI";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getProfileAPI();
            setUser(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <h3>Loading...</h3>;
    }

    return (
        <div className="container mt-4">
            <div className="card shadow p-4">
                <h2 className="mb-4">
                    My Profile
                </h2>

                <p>
                    <strong>Username:</strong>{" "}
                    {user?.username}
                </p>

                <p>
                    <strong>Full Name:</strong>{" "}
                    {user?.fullname}
                </p>

                <p>
                    <strong>Email:</strong>{" "}
                    {user?.email}
                </p>

                <p>
                    <strong>Phone:</strong>{" "}
                    {user?.phoneNumber}
                </p>

                <p>
                    <strong>Gender:</strong>{" "}
                    {user?.gender}
                </p>

                <p>
                    <strong>Role:</strong>{" "}
                    {user?.role}
                </p>
            </div>
        </div>
    );
};

export default Profile;