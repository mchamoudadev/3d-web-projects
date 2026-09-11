import { useMemo } from "react";
import { toWorld } from "@/lib/geo";
import type { Coordinate } from "@/lib/types";
export default function RouteOverview({
  coordinates,
  progress,
  checkpoints,
  onSelect,
}: {
  coordinates: Coordinate[];
  progress: number;
  checkpoints: { progress: number; location: Coordinate }[];
  onSelect: (index: number) => void;
}) {
  const drawing = useMemo(() => {
    const points = coordinates.map(toWorld),
      xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]),
      minX = Math.min(...xs),
      minY = Math.min(...ys),
      scale = Math.min(
        240 / Math.max(1, Math.max(...xs) - minX),
        112 / Math.max(1, Math.max(...ys) - minY),
      );
    const offsetX = (264 - (Math.max(...xs) - minX) * scale) / 2,
      offsetY = (136 - (Math.max(...ys) - minY) * scale) / 2;
    const at = (p: number[]) => [
      offsetX + (p[0] - minX) * scale,
      offsetY + (p[1] - minY) * scale,
    ];
    const distances = [0];
    for (let i = 1; i < points.length; i++)
      distances.push(
        distances[i - 1] +
          Math.hypot(
            points[i][0] - points[i - 1][0],
            points[i][1] - points[i - 1][1],
          ),
      );
    const length = distances.at(-1)!;
    return {
      points,
      at,
      path: points
        .map((p, i) => `${i ? "L" : "M"}${at(p).join(",")}`)
        .join(" "),
      distances,
      length,
    };
  }, [coordinates]);
  let index = drawing.distances.findIndex(
    (d) => d >= progress * drawing.length,
  );
  if (index < 0) index = drawing.points.length - 1;
  const current = drawing.at(drawing.points[index]),
    start = drawing.at(drawing.points[0]),
    end = drawing.at(drawing.points.at(-1)!);
  return (
    <div className="route-overview">
      <svg
        viewBox="0 0 264 136"
        aria-label="Route overview, north is up"
        role="img"
      >
        <path
          d={drawing.path}
          fill="none"
          stroke="#e8c79a33"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <path
          d={drawing.path}
          fill="none"
          stroke="#e8c79a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {checkpoints.map((p, i) => {
          const [x, y] = drawing.at(toWorld(p.location));
          return (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Review turn ${i + 1}`}
              onClick={() => onSelect(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(i);
                }
              }}
            >
              <circle cx={x} cy={y} r={9} fill="#1b2927" stroke="#b9bdab" />
              <text
                x={x}
                y={y + 3}
                fill="#ece4d2"
                textAnchor="middle"
                fontSize="8"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
        <circle pointerEvents="none" cx={start[0]} cy={start[1]} r="4" fill="#8cac99" />
        <g pointerEvents="none" aria-label="Destination B">
          <circle cx={end[0]} cy={end[1]} r="5" fill="#b8f0cd" />
          <text x={end[0]} y={Math.max(10, end[1] - 13)} textAnchor="middle" fontSize="10" fontWeight="700" fill="#b8f0cd">B</text>
        </g>
        <circle
          pointerEvents="none"
          cx={current[0]}
          cy={current[1]}
          r="4"
          fill="white"
          stroke="#262f2b"
          strokeWidth="2"
        />
        <text x="248" y="15" fill="#a6b1a1" fontSize="8">
          N ↑
        </text>
      </svg>
    </div>
  );
}
