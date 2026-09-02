import React, { useState } from "react";
import { Send, Info } from "lucide-react";
import "./WardenProfile.css";

function WardenProfile() {

    const wardenResponse = {
        warden: {
            unique_id: "001",
            warden_name: "Krishna",
            phone_number: 1234567890,

            image_path:
                "https://preview.redd.it/what-are-your-thoughts-on-itachi-uchiha-v0-d1v84pkpcsdb1.jpg?auto=webp&s=d666c9922aa2215836db1860e522038b0e161dde",

            gender: "Male",
            category: "assistant",
            joined_date: "22/12/2020",

            // 👇 YEARS HANDLED BY THIS WARDEN
            handling_years: [3, 4],
            incharge_of: "Boys"

        },
    };


    const [formData, setFormData] = useState({
        warden_name: wardenResponse.warden.warden_name,
        phone_number: wardenResponse.warden.phone_number,
    });

    const warden = wardenResponse.warden;

    return (
        <div className="student-container">

            <div className="student-main">

                <div className="student-form-container">

                    <h2 className="student-title">
                        Profile Details
                    </h2>

                    <div className="student-profile-section">

                        {/* PROFILE PHOTO */}

                        <div className="student-photo-section">

                            <img
                                src={warden.image_path}
                                alt={warden.warden_name}
                                className="student-profile-photo"
                            />

                        </div>

                        {/* PRIMARY DETAILS */}

                        <div className="student-primary-details">

                            {/* NAME */}

                            <div className="student-form-group">

                                <label>Name</label>

                                <input
                                    type="text"
                                    name="warden_name"
                                    disabled
                                    value={formData.warden_name}
                                    className="student-input"
                                />

                            </div>

                            {/* UNIQUE ID */}

                            <div className="student-form-group">

                                <label>Warden ID</label>

                                <input
                                    type="text"
                                    value={warden.unique_id}
                                    disabled
                                    className="student-input"
                                />

                            </div>

                            {/* CATEGORY */}

                            <div className="student-form-group">

                                <label>Category</label>

                                <input
                                    type="text"
                                    value={warden.category}
                                    disabled
                                    className="student-input"
                                />

                            </div>

                        </div>

                    </div>

                    <div className="student-secondary-details">

                        {/* GENDER */}

                        <div className="student-form-group">

                            <label>Gender</label>

                            <input
                                type="text"
                                value={warden.gender}
                                disabled
                                className="student-input"
                            />

                        </div>

                        {/* JOINED DATE */}

                        <div className="student-form-group">

                            <label>Joined Date</label>

                            <input
                                type="text"
                                value={warden.joined_date}
                                disabled
                                className="student-input"
                            />

                        </div>

                        <div className="student-form-group">

                            <label>Handling Year</label>

                            <input
                                type="text"
                                value={warden.handling_years.join(", ")}
                                disabled
                                className="student-input"
                            />

                        </div>
                        <div className="student-form-group">

                            <label>Incharge of</label>  

                            <input
                                type="text"
                                value={warden.incharge_of}
                                disabled
                                className="student-input"
                            />
                        </div>
                        
                        <div className="student-form-group">

                            <label>
                                Mobile Number
                            </label>

                            <input
                                type="tel"
                                name="phone_number"
                                disabled
                                value={formData.phone_number}
                                className="student-input"
                            />

                        </div>

                        <div className="student-form-group">

                            <label>
                                Email
                            </label>

                            <input
                                type="email"
                                value="warden@example.com"
                                disabled
                                className="student-input"
                            />

                        </div>

                        <div className="student-form-group student-address-field">

                            <label>
                                Address
                            </label>

                            <textarea
                                value="Chennai"
                                disabled
                                className="student-input student-address-input"
                                rows="3"
                            />

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default WardenProfile;