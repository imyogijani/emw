// A reusable Input component for the project
import React from "react";
import "../../index.css";

export default function Input({ className = "", ...props }) {
  return <input className={`emw-input ${className}`} {...props} />;
}
