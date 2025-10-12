"use client";
import React from "react";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
  rightElement?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder = "",
  maxLength,
  disabled = false,
  multiline = false,
  rows = 4,
  className = "",
  rightElement,
}) => {
  const baseClasses =
    "w-full px-3 py-3 bg-[#0D0D0D] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF10F0] transition-colors font-light";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(e.target.value);
  };

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        rows={rows}
        className={`${baseClasses} resize-none ${className}`}
      />
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`${baseClasses} ${rightElement ? "pr-12" : ""} ${className}`}
      />
      {rightElement && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export default Input;
