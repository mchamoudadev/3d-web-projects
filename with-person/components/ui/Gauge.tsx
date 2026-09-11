import { useEffect, useRef } from "react";
import { sampleAction } from "@/config/choreography";
import { useProgress } from "@/store/progress";
export default function Gauge() {
  const needle = useRef<SVGGElement>(null);
  const value = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const update = ({ progress }: { progress: number }) => {
      const bars = sampleAction(progress).pressure;
      needle.current?.setAttribute(
        "transform",
        `rotate(${-120 + (bars / 9) * 240} 80 80)`,
      );
      if (value.current) value.current.textContent = bars.toFixed(1);
    };
    update(useProgress.getState());
    return useProgress.subscribe(update);
  }, []);
  return (
    <aside
      className="pressure-gauge"
      aria-label="Story progress, pressure from zero to nine bar"
    >
      <svg viewBox="0 0 160 135" role="img" aria-label="Pressure gauge">
        <path
          d="M 27 111 A 62 62 0 1 1 133 111"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".25"
          strokeWidth=".7"
        />
        {Array.from({ length: 37 }, (_, i) => {
          const a = ((-210 + (i * 240) / 36) * Math.PI) / 180;
          const major = i % 4 === 0;
          return (
            <line
              key={i}
              x1={80 + Math.cos(a) * 53}
              y1={80 + Math.sin(a) * 53}
              x2={80 + Math.cos(a) * (major ? 44 : 49)}
              y2={80 + Math.sin(a) * (major ? 44 : 49)}
              stroke="currentColor"
              strokeWidth={major ? 1.2 : 0.6}
              opacity={major ? 0.85 : 0.45}
            />
          );
        })}
        <text x="34" y="120">
          0
        </text>
        <text x="124" y="120">
          9
        </text>
        <text x="80" y="16">
          PRESSURE
        </text>
        <g ref={needle} transform="rotate(-120 80 80)">
          <path d="M78.5 82 L80 35 L81.5 82 Z" fill="#d6b482" />
          <line
            x1="80"
            y1="80"
            x2="80"
            y2="92"
            stroke="#d6b482"
            strokeWidth="2"
          />
        </g>
        <circle cx="80" cy="80" r="4" fill="#b8935a" />
        <circle cx="80" cy="80" r="1.5" fill="#211a13" />
      </svg>
      <div className="gauge-value">
        <span ref={value}>0.0</span>
        <span> BAR</span>
      </div>
      <p>SCROLL TO BREW</p>
    </aside>
  );
}
