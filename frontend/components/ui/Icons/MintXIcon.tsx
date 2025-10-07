import React from "react";

interface MintXIconProps {
  className?: string;
}

const MintXIcon: React.FC<MintXIconProps> = ({ className = "" }) => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      aria-label="mintX"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="mintx-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF10F0" />
          <stop offset="100%" stopColor="#D600C4" />
        </linearGradient>
      </defs>

      {/* Rounded square background with gradient */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="7"
        fill="url(#mintx-gradient)"
      />

      {/* Stylized X shape in white - like a mint/stamp mark */}
      <g stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M10 10L22 22" />
        <path d="M22 10L10 22" />
        {/* Small circle in center where X crosses - mint stamp detail */}
        <circle cx="16" cy="16" r="2.5" fill="white" />
      </g>
    </svg>
  );
};

export default MintXIcon;
