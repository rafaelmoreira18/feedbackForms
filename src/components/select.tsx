import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import Text from "./text";

export const selectVariants = cva(
  "w-full font-sans border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white",
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

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({
  variant,
  size,
  className,
  label,
  error,
  options,
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Text as="label" variant="body-sm-bold" className="text-gray-400">
          {label}
        </Text>
      )}
      <select
        className={selectVariants({ variant: error ? "error" : variant, size, className })}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <Text variant="caption" className="text-red-base">
          {error}
        </Text>
      )}
    </div>
  );
}
