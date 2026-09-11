"use client";
import { useProgress } from "@/store/progress";

export default function Gauge() {
  const progress = useProgress((state) => state.progress);
  const pressure = progress * 9;
  return <aside className="fixed bottom-5 right-5 z-20 w-[112px] md:bottom-8 md:right-10 md:w-[142px]" aria-label={`Scroll pressure: ${pressure.toFixed(1)} of 9 bar`}>
    <svg viewBox="0 0 160 160" role="img" aria-label="Pressure gauge">
      <circle cx="80" cy="80" r="75" fill="#15120f" fillOpacity=".8" stroke="#b8935a" strokeOpacity=".35" strokeWidth=".7" />
      <circle cx="80" cy="80" r="70" fill="none" stroke="#b8935a" strokeOpacity=".13" strokeWidth=".6" />
      {Array.from({ length: 37 }, (_, i) => {
        const theta = (-225 + i * 270 / 36) * Math.PI / 180;
        const length = i % 4 === 0 ? 9 : 4;
        return <line key={i} x1={80 + Math.cos(theta) * (59 - length)} y1={80 + Math.sin(theta) * (59 - length)} x2={80 + Math.cos(theta) * 59} y2={80 + Math.sin(theta) * 59} stroke="#b8935a" strokeWidth={i % 4 === 0 ? 1.2 : 0.6} opacity={i % 4 === 0 ? 0.9 : 0.45} />;
      })}
      <text x="47" y="121" textAnchor="middle" fill="#b8935a" fontFamily="var(--font-mono)" fontSize="10">0</text>
      <text x="113" y="121" textAnchor="middle" fill="#b8935a" fontFamily="var(--font-mono)" fontSize="10">9</text>
      <g transform={`rotate(${-135 + progress * 270} 80 80)`}>
        <path d="M79 87 L80 28 L81 87 Z" fill="#b8935a" />
        <circle cx="80" cy="80" r="4" fill="#b8935a" />
      </g>
      <text x="80" y="111" textAnchor="middle" fill="#f2e8d5" fontFamily="var(--font-mono)" fontSize="12" style={{ fontVariantNumeric: "tabular-nums" }}>{pressure.toFixed(1)}</text>
      <text x="80" y="139" textAnchor="middle" fill="#b8935a" fontFamily="var(--font-mono)" fontSize="8" letterSpacing="2">BAR</text>
    </svg>
  </aside>;
}
