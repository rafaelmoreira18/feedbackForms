import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import Text from "./text";

export const inputVariants = cva(
  "w-full font-sans border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "border-gray-200 focus:border-blue-base focus:outline-none",
        error: "border-red-base focus:border-red-dark focus:outline-none",
      },
      size: {
        sm: "px-3 py-1.5 text-sm rounded",
        md: "px-4 py-2 text-base rounded-md",
        lg: "px-5 py-3 text-lg rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
}

export default function Input({
  variant,
  size,
  className,
  label,
  error,
  type,
  ...props
}: InputProps) {
  const isDate = type === "date";

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Text as="label" variant="body-sm-bold" className="text-gray-400">
          {label}
        </Text>
      )}
      <input
        type={type}
        className={inputVariants({
          variant: error ? "error" : variant,
          size,
          className: `${isDate ? "cursor-pointer appearance-none" : ""} ${className ?? ""}`.trim(),
        })}
        {...props}
      />
      {error && (
        <Text variant="caption" className="text-red-base">
          {error}
        </Text>
      )}
    </div>
  );
}
