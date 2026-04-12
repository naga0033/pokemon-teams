"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({ value, onChange, options, placeholder, className }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return options.slice(0, 50);
    const q = query.trim().toLowerCase();
    const prefix = options.filter((o) => o.toLowerCase().startsWith(q));
    const contains = options.filter(
      (o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q),
    );
    return [...prefix, ...contains].slice(0, 50);
  }, [query, options]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setQuery("");
      setOpen(false);
      setActiveIndex(-1);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          setOpen(true);
          e.preventDefault();
        }
        return;
      }
      if (e.key === "ArrowDown") {
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setActiveIndex((i) => Math.max(i - 1, 0));
        e.preventDefault();
      } else if (e.key === "Enter" && activeIndex >= 0) {
        handleSelect(filtered[activeIndex]);
        e.preventDefault();
      } else if (e.key === "Escape") {
        setOpen(false);
        setActiveIndex(-1);
      }
    },
    [open, filtered, activeIndex, handleSelect],
  );

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? query : value}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(-1);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {filtered.map((option, i) => (
            <li
              key={option}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(option);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-2.5 py-1.5 text-[11px] ${
                i === activeIndex
                  ? "bg-cyan-50 text-cyan-700 font-bold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
