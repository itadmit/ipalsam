"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "חפש או בחר...",
  label,
  disabled = false,
  id,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const displayValue = open ? query : selectedLabel;

  const filteredOptions = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  };

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={cn("w-full relative", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex h-11 w-full rounded-lg border bg-white px-4 py-2 text-sm transition-colors",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500",
          disabled &&
            "cursor-not-allowed opacity-50 bg-slate-50",
          !disabled && "border-slate-200 hover:border-slate-300"
        )}
      >
        <input
          id={id}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={handleOpen}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-slate-400"
                dir="rtl"
        />
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className="shrink-0 text-slate-500 hover:text-slate-700"
          tabIndex={-1}
        >
          <ChevronDown
            className={cn("w-4 h-4 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>
      {open && (
        <ul
          className="absolute z-50 mt-1 left-0 right-0 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-2 text-sm text-slate-500">לא נמצאו תוצאות</li>
          ) : (
            filteredOptions.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => handleSelect(opt)}
                className={cn(
                  "cursor-pointer px-4 py-2 text-sm transition-colors",
                  opt.value === value
                    ? "bg-emerald-50 text-emerald-700"
                    : "hover:bg-slate-50 text-slate-700"
                )}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
