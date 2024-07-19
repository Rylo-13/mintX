import React from "react";
import type { SVGProps } from "react";

export default function DeleteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
      className={props.className}
    >
      <g
        fill="none"
        stroke="#ab3636"
        strokeDasharray={16}
        strokeDashoffset={16}
        strokeLinecap="round"
        strokeWidth={2}
      >
        <path d="M7 7L17 17">
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            dur="0.4s"
            values="16;0"
          ></animate>
        </path>
        <path d="M17 7L7 17">
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="0.4s"
            dur="0.4s"
            values="16;0"
          ></animate>
        </path>
      </g>
    </svg>
  );
}
