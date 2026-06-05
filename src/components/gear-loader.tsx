import React, { useEffect, useState } from 'react';
import { Cog } from 'lucide-react';

// Gear configurations: [x, y, r, teeth, color, dir, speed]
const gears = [
  { x: 90, y: 100, r: 50, teeth: 12, color: '#e94560', dir: 'cw', speed: 3 },
  { x: 175, y: 75, r: 35, teeth: 9, color: '#ffb830', dir: 'ccw', speed: 2.1 },
  { x: 240, y: 110, r: 45, teeth: 11, color: '#00d2ff', dir: 'cw', speed: 2.65 },
  { x: 155, y: 145, r: 25, teeth: 7, color: '#ff6b9d', dir: 'ccw', speed: 1.5 },
];

interface SteamParticle {
  id: number;
  left: string;
  top: string;
  drift: string;
  duration: string;
  opacity: number;
  size: string;
}

// Helper to calculate SVG path data for a gear
function getGearPath(r: number, teeth: number) {
  const toothHeight = r * 0.2;
  const innerR = r - toothHeight;
  const outerR = r + toothHeight;
  const svgSize = (outerR + 4) * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  let pathData = '';
  const angleStep = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a1 = i * angleStep;
    const a2 = a1 + angleStep * 0.15;
    const a3 = a1 + angleStep * 0.35;
    const a4 = a1 + angleStep * 0.5;
    const a5 = a1 + angleStep * 0.65;
    const a6 = a1 + angleStep * 0.85;

    const points = [
      [cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR],
      [cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR],
      [cx + Math.cos(a3) * outerR, cy + Math.sin(a3) * outerR],
      [cx + Math.cos(a4) * outerR, cy + Math.sin(a4) * outerR],
      [cx + Math.cos(a5) * outerR, cy + Math.sin(a5) * outerR],
      [cx + Math.cos(a6) * innerR, cy + Math.sin(a6) * innerR],
    ];

    if (i === 0) {
      pathData += `M ${points[0][0]} ${points[0][1]} `;
    }
    points.slice(1).forEach(p => {
      pathData += `L ${p[0]} ${p[1]} `;
    });
  }
  pathData += 'Z';

  return { pathData, svgSize, cx, cy };
}

const renderGear = (config: typeof gears[0], index: number) => {
  const { r, teeth, color, dir, speed } = config;
  const { pathData, svgSize, cx, cy } = getGearPath(r, teeth);
  const holeR = r * 0.25;

  return (
    <div
      key={index}
      className="gear-wrapper"
      style={{
        left: `${config.x - svgSize / 2}px`,
        top: `${config.y - svgSize / 2}px`,
        width: `${svgSize}px`,
        height: `${svgSize}px`,
        // @ts-ignore
        '--gear-color': color,
      }}
    >
      <div 
        className={`gear gear-${dir} gear-glow`} 
        style={{ animationDuration: `${speed}s` }}
      >
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          <g>
            <path d={pathData} fill="none" stroke={color} strokeWidth="2" opacity="0.9"/>
            <circle cx={cx} cy={cy} r={holeR} fill="none" stroke={color} strokeWidth="2" opacity="0.7"/>
            <circle cx={cx} cy={cy} r={r * 0.08} fill={color} opacity="0.8"/>
            {/* Spoke Lines */}
            <line x1={cx} y1={cy - holeR} x2={cx} y2={cy - r * 0.6} stroke={color} strokeWidth="1.5" opacity="0.4"/>
            <line x1={cx} y1={cy + holeR} x2={cx} y2={cy + r * 0.6} stroke={color} strokeWidth="1.5" opacity="0.4"/>
            <line x1={cx - holeR} y1={cy} x2={cx - r * 0.6} y2={cy} stroke={color} strokeWidth="1.5" opacity="0.4"/>
            <line x1={cx + holeR} y1={cy} x2={cx + r * 0.6} y2={cy} stroke={color} strokeWidth="1.5" opacity="0.4"/>
          </g>
        </svg>
      </div>
    </div>
  );
};

export function GearLoader() {
  const [steamParticles, setSteamParticles] = useState<SteamParticle[]>([]);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Simulating loading bar progression
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setFadeOut(true);
          setTimeout(() => setVisible(false), 600); // 600ms fade transition
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (fadeOut) return;
    
    // Steam particles emitter
    const steamInterval = setInterval(() => {
      const gear = gears[Math.floor(Math.random() * gears.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = gear.r * 0.6;
      const id = Math.random();

      const newParticle: SteamParticle = {
        id,
        left: `${gear.x + Math.cos(angle) * dist}px`,
        top: `${gear.y + Math.sin(angle) * dist}px`,
        drift: `${Math.random() * 30 - 15}px`,
        duration: `${1.5 + Math.random()}s`,
        opacity: 0.2 + Math.random() * 0.3,
        size: `${2 + Math.random() * 3}px`
      };

      setSteamParticles((prev) => [...prev.slice(-25), newParticle]); // keep max 25 active particles
    }, 180);

    return () => clearInterval(steamInterval);
  }, [fadeOut]);

  if (!visible) return null;

  return (
    <div className={`gear-loader-overlay  ${fadeOut ? 'fade-out' : ''}`}>
      <div className="gear-system" id="gearSystem">
        {gears.map((config, index) => renderGear(config, index))}

        {steamParticles.map((p) => (
          <div
            key={p.id}
            className="steam"
            style={{
              left: p.left,
              top: p.top,
              // @ts-ignore
              '--drift': p.drift,
              animationDuration: p.duration,
              opacity: p.opacity,
              width: p.size,
              height: p.size,
            }}
          />
        ))}

        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="loading-text">Processing</div>
      </div>
    </div>
  );
}

// GearSectionLoader renders the gear system scaled down inside sections/cards
export function GearSectionLoader({ className, text = "Loading System..." }: { className?: string; text?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 min-h-[220px] overflow-hidden ${className || ""}`}>
      <div className="gear-system scale-[0.6] origin-center -my-10">
        {gears.map((config, index) => renderGear(config, index))}
      </div>
      <div className="text-[10px] tracking-[4px] uppercase text-muted-foreground/80 animate-pulse mt-4">
        {text}
      </div>
    </div>
  );
}

// GearSpinner renders a single spinning gear icon for buttons & small inline loadings
export function GearSpinner({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <Cog 
      size={size} 
      className={`animate-spin text-inherit ${className || ""}`} 
    />
  );
}
