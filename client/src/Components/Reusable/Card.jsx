// A reusable Card component for the project
import React from "react";
import "../card-system.css";

export default function Card({ children, className = "", ...props }) {
  return (
    <div className={`emw-card ${className}`} {...props}>
      {children}
    </div>
  );
}
