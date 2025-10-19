import React from "react";

const RaribleIcon = () => (
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
      <rect width="30" height="30" rx="6" fill="#FEDA03" />
      <path
        d="M8 8h14v14H8V8z"
        fill="#FEDA03"
      />
      <path
        d="M10 10v10h2.5v-3.5h2L17 20h2.5l-2.5-3.5c1.38 0 2.5-1.12 2.5-2.5v-1.5c0-1.38-1.12-2.5-2.5-2.5H10zm2.5 2h4.5v1.5h-4.5V12z"
        fill="#000"
      />
    </svg>
  </div>
);

export default RaribleIcon;