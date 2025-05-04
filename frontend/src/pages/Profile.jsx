import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/Nav2";
import { apiUrl } from "../config/config";
import "../css/Profile.css";

// Utility to format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Date formatting error:", e);
    return dateString;
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userId = user?.id;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    dob: "",
    pan: "",
    gender: "",
    maritalStatus: ""
  });

  const fetchProfileData = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/profile`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setUserData(data);
      setFormData({
        phone: data.phone || "",
        dob: data.dob || "",
        pan: data.pan || "",
        gender: data.gender || "",
        maritalStatus: data.maritalStatus || ""
      });
    } catch (err) {
      console.error("Failed to fetch user data", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchProfileData();
  }, [userId, navigate, fetchProfileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/api/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchProfileData();
        setEditMode(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleCancel = () => {
    setFormData({
      phone: userData.phone || "",
      dob: userData.dob || "",
      pan: userData.pan || "",
      gender: userData.gender || "",
      maritalStatus: userData.maritalStatus || ""
    });
    setEditMode(false);
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">Error: {error}</div>;
  if (!userData) return <div className="profile-error">No profile data found</div>;

  const displayEmail = userData.email ? userData.email.replace(/(.{3}).*@/, "$1****@") : "Not provided";
  const displayPhone = userData.phone ? userData.phone.replace(/(\d{3})\d{4}(\d{4})/, '*****$2') : "Not provided";

  return (
    <div className="profile-wrapper">
      <NavBar />
      <div className="profile-container">
        <h2 className="profile-title">Profile Details</h2>
        <h2 className="account-holder-name">Account Holder: {userData?.username || "Unnamed User"}</h2>
        <div className="profile-grid">
          <div className="profile-column">
            <div className="detail-group">
              <label>DATE OF BIRTH (DD/MM/YYYY)</label>
              {editMode ? (
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                />
              ) : (
                <p>
                  {userData.dob ? formatDate(userData.dob) : "-"} 
                  <button className="edit-btn" onClick={() => setEditMode(true)}>EDIT</button>
                </p>
              )}
            </div>

            <div className="detail-group">
              <label>MOBILE NUMBER</label>
              {editMode ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{displayPhone} <button className="edit-btn" onClick={() => setEditMode(true)}>EDIT</button></p>
              )}
            </div>

            <div className="detail-group">
              <label>PAN</label>
              {editMode ? (
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{userData.pan || "-"} <button className="edit-btn" onClick={() => setEditMode(true)}>EDIT</button></p>
              )}
            </div>
          </div>

          <div className="profile-column">
            <div className="detail-group">
              <label>EMAIL</label>
              <p>{displayEmail}</p>
            </div>

            <div className="detail-group">
              <label>GENDER</label>
              {editMode ? (
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p>{userData.gender || "-"} <button className="edit-btn" onClick={() => setEditMode(true)}>EDIT</button></p>
              )}
            </div>

            <div className="detail-group">
              <label>MARITAL STATUS</label>
              {editMode ? (
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                >
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
              ) : (
                <p>{userData.maritalStatus || "-"} <button className="edit-btn" onClick={() => setEditMode(true)}>EDIT</button></p>
              )}
            </div>

            <div className="detail-group">
              <label>UNIQUE CLIENT CODE</label>
              <p>{userData.clientCode || "-"}</p>
            </div>
          </div>
        </div>

        {editMode && (
          <div className="form-actions">
            <button className="save-btn" onClick={handleSubmit}>SAVE</button>
            <button className="cancel-btn" onClick={handleCancel}>CANCEL</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
