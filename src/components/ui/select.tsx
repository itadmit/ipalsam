import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          id={id}
          className={cn(
            "flex h-11 w-full rounded-lg border bg-white px-4 py-2 text-sm transition-colors appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-slate-200 hover:border-slate-300",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };

