// A reusable Button component for the project
import React from "react";
import "../../button-system.css";

export default function Button({ children, className = "", ...props }) {
  return (
    <button className={`emw-btn ${className}`} {...props}>
      {children}
    </button>
  );
}