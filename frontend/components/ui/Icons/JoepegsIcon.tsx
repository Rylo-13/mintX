import React from "react";

const JoepegsIcon = () => (
  <div
    style={{
      position: "absolute",
      bottom: "15px",
      right: "15px",
      pointerEvents: "auto",
    }}
  >
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="30" height="30" rx="6" fill="#E84142" />
      <path
        d="M8 8h8c2.21 0 4 1.79 4 4v2c0 2.21-1.79 4-4 4h-4v4h-4V8zm4 4v4h4c1.1 0 2-.9 2-2s-.9-2-2-2h-4z"
        fill="white"
      />
      <circle cx="20" cy="10" r="2" fill="#FF6B6B" />
    </svg>
  </div>
);

export default JoepegsIcon;