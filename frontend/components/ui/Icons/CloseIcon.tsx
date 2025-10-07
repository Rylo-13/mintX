import React from "react";

interface CloseIconProps {
  onClick?: () => void;
}

const CloseIcon: React.FC<CloseIconProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="hover:bg-white/5 rounded-full transition-colors flex-shrink-0 w-8 h-8 flex items-center justify-center"
  >
    <svg
      className="w-4 h-4 text-gray-400 hover:text-white transition-colors"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
);

export default CloseIcon;
