import React from "react";
import InfoIcon from "../Icons/InfoIcon";
import CheckIcon from "../Icons/CheckIcon";
import ErrorIcon from "../Icons/ErrorIcon";

interface AlertProps {
  type: "error" | "warning" | "success" | "info";
  title?: string;
  message: string;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  className = "",
}) => {
  const getStyles = () => {
    switch (type) {
      case "error":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          titleColor: "text-red-400",
          messageColor: "text-red-300/80",
          icon: <ErrorIcon />,
        };
      case "warning":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
          titleColor: "text-yellow-400",
          messageColor: "text-yellow-300/80",
          icon: <ErrorIcon />,
        };
      case "success":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/20",
          titleColor: "text-green-400",
          messageColor: "text-green-300/80",
          icon: <CheckIcon />,
        };
      case "info":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          titleColor: "text-blue-400",
          messageColor: "text-blue-300/80",
          icon: <InfoIcon />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`p-4 ${styles.bg} rounded-2xl border ${styles.border} ${className}`}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="flex-1">
          {title && (
            <p className={`${styles.titleColor} text-sm font-medium mb-1`}>
              {title}
            </p>
          )}
          <p
            className={`${styles.messageColor} text-xs font-light leading-relaxed`}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Alert;
