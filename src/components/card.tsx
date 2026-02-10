import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

export const cardVariants = cva("bg-white rounded-lg", {
  variants: {
    padding: {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    shadow: {
      none: "",
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg",
    },
  },
  defaultVariants: {
    padding: "md",
    shadow: "sm",
  },
});

interface CardProps extends VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ padding, shadow, className, children }: CardProps) {
  return <div className={cardVariants({ padding, shadow, className })}>{children}</div>;
}
