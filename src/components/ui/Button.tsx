import React from "react";
import "./Button.css";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "medium",
  onClick,
  disabled = false,
  type = "button",
  className = "",
}) => {
  const buttonClass = `btn btn--${variant} btn--${size} ${className}`.trim();

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
