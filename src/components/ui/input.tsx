import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, type, id, readOnly, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        readOnly={readOnly}
        className={`
          w-full px-4 py-3 rounded-xl border-2 font-sans text-gray-400 text-base
          bg-white/80 transition-all duration-200 outline-none
          ${error
            ? "border-brand-red focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
            : "border-gray-200 focus:border-teal-base focus:ring-4 focus:ring-teal-base/10"
          }
          ${readOnly ? "bg-gray-50 text-gray-300 cursor-text" : ""}
          ${type === "date" ? "cursor-pointer appearance-none" : ""}
          ${className ?? ""}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-brand-red font-sans font-medium">{error}</span>
      )}
    </div>
  );
}
