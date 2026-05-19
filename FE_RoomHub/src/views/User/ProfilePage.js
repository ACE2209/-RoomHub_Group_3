/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  Edit3,
  ShieldAlert,
  Save,
  Camera,
  ArrowLeft
} from "lucide-react";

import { URL_IMG } from "../../utils/constant";
import { getUserById, updateUser, updateStatusUser } from "../../controllers/userApi";
import { logout } from "../../controllers/authController";

import Header from "../layout/Header";
import Footer from "../layout/Footer";

import "./ProfilePage.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [viewMode, setViewMode] = useState("profile");
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    gender: "",
    address: "",
    avatar: ""
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const [passwordData, setPasswordData] = useState({
    confirmPassword: ""
  });

  useEffect(() => {
    if (!user?._id) {
      toast.error("Please login");
      navigate("/loginpage");
    } else {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserById(user._id);

      setProfileData({
        fullName: data.fullName,
        phone: data.phone || "",
        gender: data.gender || "",
        address: data.address || "",
        avatar: data.avatar || ""
      });

      localStorage.setItem("user", JSON.stringify(data));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("fullName", profileData.fullName);
      formData.append("phone", profileData.phone);
      formData.append("gender", profileData.gender);
      formData.append("address", profileData.address);

      if (selectedFile) formData.append("avatar", selectedFile);

      const updatedUser = await updateUser(user._id, formData);

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileData(updatedUser);

      toast.success("Profile updated");
      setViewMode("profile");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockAccount = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateStatusUser(user._id, {
        status: "inactive",
        password: passwordData.confirmPassword
      });

      toast.success("Account blocked");
      await logout(navigate);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner />
      </Container>
    );
  }

  return (
    <div className="profile-wrapper">
      <Header />

      <Container className="py-5 flex-grow-1">
        <div className="profile-glass">
          <Row>

            {/* SIDEBAR */}
            <Col md={4} className="profile-sidebar">
              <div className="text-center">

                <div className="avatar-wrapper">
                  <img
                    src={
                      selectedFile
                        ? URL.createObjectURL(selectedFile)
                        : `${URL_IMG}${profileData.avatar}`
                    }
                    className="profile-avatar"
                  />

                  <label className="camera-btn">
                    <Camera size={16} />
                    <input type="file" hidden onChange={handleFileChange} />
                  </label>
                </div>

                <h5 className="mt-3">{profileData.fullName}</h5>
                <p className="text-muted">{user.email}</p>
              </div>

              <button
                className={`nav-btn ${viewMode === "profile" ? "active" : ""}`}
                onClick={() => setViewMode("profile")}
              >
                <User size={18} /> Profile
              </button>

              <button
                className={`nav-btn ${viewMode === "updateProfile" ? "active" : ""}`}
                onClick={() => setViewMode("updateProfile")}
              >
                <Edit3 size={18} /> Edit Profile
              </button>

              <button
                className={`nav-btn danger`}
                onClick={() => setViewMode("block")}
              >
                <ShieldAlert size={18} /> Security
              </button>

            </Col>

            {/* CONTENT */}
            <Col md={8} className="profile-content">

              {viewMode === "profile" && (
                <>
                  <h3>Account Information</h3>

                  <div className="info-grid">

                    <InfoBox icon={User} label="Full Name" value={profileData.fullName} />
                    <InfoBox icon={Mail} label="Email" value={user.email} />
                    <InfoBox icon={Phone} label="Phone" value={profileData.phone} />
                    <InfoBox icon={Users} label="Gender" value={profileData.gender} />
                    <InfoBox icon={MapPin} label="Address" value={profileData.address} full />

                  </div>
                </>
              )}

              {viewMode === "updateProfile" && (
                <>
                  <button className="back-btn" onClick={() => setViewMode("profile")}>
                    <ArrowLeft size={16} /> Back
                  </button>

                  <h3>Edit Profile</h3>

                  <Form onSubmit={handleUpdateProfile}>

                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        name="phone"
                        value={profileData.phone}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Gender</Form.Label>
                      <Form.Select
                        name="gender"
                        value={profileData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        name="address"
                        value={profileData.address}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <button className="btn-save">
                      <Save size={18} /> Save
                    </button>

                  </Form>
                </>
              )}

              {viewMode === "block" && (
                <>
                  <h3>Block Account</h3>

                  <Form onSubmit={handleBlockAccount}>

                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ confirmPassword: e.target.value })}
                      />
                    </Form.Group>

                    <button className="btn-danger">
                      Block Account
                    </button>

                  </Form>
                </>
              )}

            </Col>
          </Row>
        </div>
      </Container>

      <Footer />
    </div>
  );
};

const InfoBox = ({ icon: Icon, label, value, full }) => (
  <div className={`info-card ${full ? "full" : ""}`}>
    <div className="info-title">
      <Icon size={16} /> {label}
    </div>
    <p>{value || "N/A"}</p>
  </div>
);

export default ProfilePage;