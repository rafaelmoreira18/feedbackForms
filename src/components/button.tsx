import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-blue-base text-white hover:bg-blue-dark",
        secondary: "bg-gray-200 text-gray-400 hover:bg-gray-300",
        success: "bg-green-base text-white hover:bg-green-dark",
        danger: "bg-red-base text-white hover:bg-red-dark",
        outline: "border-2 border-blue-base text-blue-base hover:bg-blue-light",
      },
      size: {
        sm: "px-3 py-1.5 text-sm rounded",
        md: "px-4 py-2 text-base rounded-md",
        lg: "px-6 py-3 text-lg rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

export default function Button({
  variant,
  size,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
