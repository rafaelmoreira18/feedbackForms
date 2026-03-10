import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:   "bg-linear-to-r from-teal-base to-teal-dark text-white hover:from-teal-dark hover:to-blue-dark shadow-md hover:shadow-lg active:scale-95",
        secondary: "bg-gray-100 text-gray-400 hover:bg-gray-200 active:scale-95",
        success:   "bg-linear-to-r from-green-base to-green-dark text-white hover:opacity-90 shadow-md active:scale-95",
        danger:    "bg-linear-to-r from-brand-red to-red-dark text-white hover:opacity-90 shadow-md active:scale-95",
        outline:   "border-2 border-teal-base text-teal-base hover:bg-teal-light active:scale-95",
        ghost:     "text-teal-base hover:bg-teal-light active:scale-95",
      },
      size: {
        sm: "px-4 py-2 text-sm rounded-lg",
        md: "px-6 py-3 text-base rounded-xl",
        lg: "px-8 py-4 text-lg rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export default function Button({ variant, size, className, children, ...props }: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
