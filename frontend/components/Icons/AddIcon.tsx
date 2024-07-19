import React from "react";
import type { SVGProps } from "react";

export default function AddIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeDasharray={18}
        strokeDashoffset={18}
        strokeLinecap="round"
        strokeWidth={2}
      >
        <path d="M12 5V19">
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="0.4s"
            dur="0.3s"
            values="18;0"
          ></animate>
        </path>
        <path d="M5 12H19">
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            dur="0.3s"
            values="18;0"
          ></animate>
        </path>
      </g>
    </svg>
  );
}
