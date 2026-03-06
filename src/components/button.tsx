import React from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-linear-to-r from-teal-base to-teal-dark text-white hover:from-teal-dark hover:to-blue-dark shadow-md hover:shadow-lg active:scale-95",
  secondary:
    "bg-gray-100 text-gray-400 hover:bg-gray-200 active:scale-95",
  success:
    "bg-linear-to-r from-green-base to-green-dark text-white hover:opacity-90 shadow-md active:scale-95",
  danger:
    "bg-linear-to-r from-brand-red to-red-dark text-white hover:opacity-90 shadow-md active:scale-95",
  outline:
    "border-2 border-teal-base text-teal-base hover:bg-teal-light active:scale-95",
  ghost:
    "text-teal-base hover:bg-teal-light active:scale-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-3 text-base rounded-xl",
  lg: "px-8 py-4 text-lg rounded-2xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-sans font-semibold
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className ?? ""}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
