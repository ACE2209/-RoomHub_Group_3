/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/alt-text */
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import "./Schedules.css";
import { useEffect, useState } from "react";


import ClassListSection from "../components/ClassListSection";

export default function SchedulesPage() {
    const [showAuthOverlay, setShowAuthOverlay] = useState(false);
    const [user, setUser] = useState(null);


    return (
        <div className="schedulesPage">
            <Header />
            <ClassListSection
                user={user}
                onRequireLogin={() => setShowAuthOverlay(true)}
            />
            <Footer />
        </div>
    );
}