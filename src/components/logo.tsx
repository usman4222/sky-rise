import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className = "", size = 32, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          {/* Diamond Border Gradient (Green to Gold) */}
          <linearGradient id="logo-diamond-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F9F59" />
            <stop offset="100%" stopColor="#FFCD29" />
          </linearGradient>
          {/* Arrow Gradient (Gold to Green-Yellow) */}
          <linearGradient id="logo-arrow-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFCD29" />
            <stop offset="100%" stopColor="#D4E157" />
          </linearGradient>
        </defs>

        {/* Rotated Diamond Frame */}
        <rect
          x="28"
          y="20"
          width="44"
          height="44"
          rx="10"
          ry="10"
          transform="rotate(45 50 42)"
          fill="none"
          stroke="url(#logo-diamond-grad)"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />

        {/* Vertical Bars (themed in White/CurrentColor for text adaptation) */}
        <rect x="36" y="44" width="3.5" height="16" rx="1.5" className="fill-current text-foreground dark:text-white" />
        <rect x="42" y="37" width="3.5" height="23" rx="1.5" className="fill-current text-foreground dark:text-white" />
        <rect x="48" y="29" width="3.5" height="31" rx="1.5" className="fill-current text-foreground dark:text-white" />
        <rect x="54" y="21" width="3.5" height="39" rx="1.5" className="fill-current text-foreground dark:text-white" />
        <rect x="60" y="13" width="3.5" height="47" rx="1.5" className="fill-current text-foreground dark:text-white" />

        {/* Rising Trend Arrow Line */}
        <path
          d="M 32 52 L 43 42 L 49 49 L 65 31"
          stroke="url(#logo-arrow-grad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Arrowhead */}
        <path
          d="M 59 31 L 65 31 L 65 37"
          stroke="url(#logo-arrow-grad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span className="font-extrabold tracking-tight text-sm uppercase text-foreground">
            Sky<span className="text-primary">Rise</span>
          </span>
          <span className="text-[8px] font-bold tracking-[0.25em] uppercase text-profit mt-0.5">
            Future
          </span>
        </div>
      )}
    </div>
  );
}
