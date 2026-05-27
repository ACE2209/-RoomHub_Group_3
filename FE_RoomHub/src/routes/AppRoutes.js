import {
    Routes,
    Route,
} from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";

const Home = () => {
    return (
        <div className="container mt-5">
            <h1>Welcome RoomHub</h1>
        </div>
    );
};

const AppRoutes = () => {
    return (
        <Routes>

            <Route
                path="/"
                element={<Home />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

        </Routes>
    );
};

export default AppRoutes;