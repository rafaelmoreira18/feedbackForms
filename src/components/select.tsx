import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, error, className, options, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full px-4 py-3 rounded-xl border-2 font-sans text-gray-400 text-base
          bg-white/80 transition-all duration-200 outline-none cursor-pointer
          ${error
            ? "border-brand-red focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
            : "border-gray-200 focus:border-teal-base focus:ring-4 focus:ring-teal-base/10"
          }
          ${className ?? ""}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-brand-red font-sans font-medium">{error}</span>
      )}
    </div>
  );
}
