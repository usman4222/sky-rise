import React from "react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark" | "sidebar";
}

export function SkyRiseLogo({ className = "h-8 w-auto", variant = "light" }: LogoProps) {
  const isDarkBg = variant === "dark" || variant === "sidebar";
  const barColor = isDarkBg ? "#ffffff" : "#00693e";
  const textColorClass = isDarkBg ? "text-white" : "text-[#001a0d] dark:text-white";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Icon */}
      <svg
        width="42"
        height="42"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 filter drop-shadow-[0_2px_8px_rgba(243,186,47,0.15)]"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3ba2f" />
            <stop offset="50%" stopColor="#0e9f6e" />
            <stop offset="100%" stopColor="#004d33" />
          </linearGradient>
          <linearGradient id="trendlineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0e9f6e" />
            <stop offset="100%" stopColor="#f3ba2f" />
          </linearGradient>
        </defs>

        {/* Diamond Frame - rounded corners, open at the top */}
        <path
          d="M 50 82 C 45 82 22 59 22 54 C 22 49 22 48 22 48 L 30 40 L 50 60 L 70 40 L 78 48 C 78 48 78 49 78 54 C 78 59 55 82 50 82 Z"
          fill="none"
          stroke="url(#diamondGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertical Skyscraper Bars - White/Muted */}
        <rect x="36" y="44" width="4" height="24" rx="2" fill={barColor} opacity="0.95" />
        <rect x="43" y="36" width="4" height="32" rx="2" fill={barColor} opacity="0.95" />
        <rect x="50" y="28" width="4" height="40" rx="2" fill={barColor} opacity="0.95" />
        <rect x="57" y="20" width="4" height="48" rx="2" fill={barColor} opacity="0.95" />
        <rect x="64" y="12" width="4" height="56" rx="2" fill={barColor} opacity="0.95" />

        {/* Trendline Arrow Cutting Upwards */}
        <path
          d="M 32 60 L 46 48 L 52 54 L 72 32"
          stroke="url(#trendlineGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrowhead */}
        <path
          d="M 64 32 L 73 31 L 72 40"
          stroke="url(#trendlineGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Brand Text */}
      <div className="flex flex-col justify-center select-none">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold text-lg tracking-wider ${textColorClass} uppercase`}>
            Sky<span className="text-[#f3ba2f]">Rise</span>
          </span>
          {/* Animated small rotating cube for the dot of 'i' or visual accent */}
          <div className="h-2.5 w-2.5 bg-[#f3ba2f] rounded-[2px] rotate-45 animate-[spin_4s_linear_infinite]" />
        </div>
        <span className="text-[10px] font-bold tracking-[0.25em] text-[#0e9f6e] uppercase mt-0.5 leading-none">
          — Future —
        </span>
      </div>
    </div>
  );
}
