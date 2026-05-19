import React from "react";
import "./FormInput.css";
export default function FormInput({
    label,
    icon,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
    children
}) {
    return (
        <div className="formInput">
            <label className="label">{label}</label>

            <div className={`inputWrapper ${error ? "errorInput" : ""}`}>
                {icon}
                <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                />
                {children}
            </div>

            {error && <p className="errorText">{error}</p>}
        </div>
    );
}