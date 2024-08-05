import React from "react";
import type { SVGProps } from "react";

export default function GenerateButton(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <g transform="rotate(-90 12 12) translate(24 0) scale(-1 1)">
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
        >
          <path
            strokeDasharray={64}
            strokeDashoffset={64}
            d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1Z"
          >
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              dur="0.5s"
              values="64;0"
            ></animate>
          </path>
          <path strokeDasharray={12} strokeDashoffset={12} d="M17 12H7.5">
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.6s"
              dur="0.2s"
              values="12;0"
            ></animate>
          </path>
          <path
            strokeDasharray={8}
            strokeDashoffset={8}
            d="M7 12L11 16M7 12L11 8"
          >
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.8s"
              dur="0.2s"
              values="8;0"
            ></animate>
          </path>
        </g>
      </g>
    </svg>
  );
}
