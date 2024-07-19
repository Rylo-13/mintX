"use client";
import React, { useRef } from "react";
import styles from "./index.module.css";

interface RippleButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
  active?: boolean;
  disabled?: boolean;
}

const RippleButton: React.FC<RippleButtonProps> = ({
  text,
  onClick,
  className = "",
  active = false,
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);

  const rippleEffect = (event: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    const ripple = rippleRef.current;

    if (!btn || !ripple) return;

    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;

    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.nativeEvent.offsetX - radius}px`;
    ripple.style.top = `${event.nativeEvent.offsetY - radius}px`;
    ripple.classList.add(styles.ripple);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    const ripple = rippleRef.current;

    if (!btn || !ripple) return;

    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;

    ripple.style.left = `${event.nativeEvent.offsetX - radius}px`;
    ripple.style.top = `${event.nativeEvent.offsetY - radius}px`;
  };

  return (
    <button
      ref={buttonRef}
      className={`relative rounded-sm px-5 min-w-max overflow-hidden shadow hover:bg-opacity-90 focus:outline-none ${className} ${
        active ? "btn-prim" : "btn-inactive"
      }`}
      onMouseMove={handleMouseMove}
      onMouseEnter={rippleEffect}
      onMouseLeave={() => {
        const ripple = rippleRef.current;
        if (ripple) {
          ripple.classList.remove(styles.ripple);
        }
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <span
        ref={rippleRef}
        className="absolute rounded-full overflow-hidden pointer-events-none"
      ></span>
      {text}
    </button>
  );
};

export default RippleButton;
