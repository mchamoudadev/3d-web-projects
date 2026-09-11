"use client";
import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { CityLayer } from "./CityLayer";
export default function CityDebug({ world }: { world: CityLayer }) {
  const [open, setOpen] = useState(false),
    [stats, setStats] = useState(world.stats),
    [settings, setSettings] = useState(world.settings);
  useEffect(() => {
    const timer = setInterval(() => setStats({ ...world.stats }), 600);
    return () => clearInterval(timer);
  }, [world]);
  const change = (value: Partial<typeof settings>) => {
    world.setSettings(value);
    setSettings({ ...world.settings });
  };
  return (
    <div className="city-debug">
      <button
        className="debug-toggle"
        aria-label="City settings"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={15} /> : <SlidersHorizontal size={15} />}
      </button>
      {open && (
        <section className="panel">
          <div className="eyebrow">CITY STUDIO</div>
          <label>
            Sun & sky{" "}
            <span>
              {Math.floor(settings.hour).toString().padStart(2, "0")}:
              {settings.hour % 1 ? "30" : "00"}
            </span>
            <input
              type="range"
              aria-label="Time of day"
              min="0"
              max="23.5"
              step=".5"
              value={settings.hour}
              onChange={(e) => change({ hour: Number(e.target.value) })}
            />
          </label>
          <label className="debug-check">
            Shadows
            <input
              aria-label="Shadows"
              type="checkbox"
              checked={settings.shadows}
              onChange={(e) => change({ shadows: e.target.checked })}
            />
          </label>
          <label>
            Traffic
            <input
              aria-label="Traffic density"
              type="range"
              min="0"
              max="1"
              step=".1"
              value={settings.traffic}
              onChange={(e) => change({ traffic: Number(e.target.value) })}
            />
          </label>
          <label>
            Trees
            <input
              aria-label="Tree density"
              type="range"
              min="0"
              max="1"
              step=".25"
              value={settings.trees}
              onChange={(e) => change({ trees: Number(e.target.value) })}
            />
          </label>
          <dl>
            <div>
              <dt>Tiles</dt>
              <dd>
                {stats.tiles} <small>+{stats.pending}</small>
              </dd>
            </div>
            <div>
              <dt>Buildings</dt>
              <dd>{stats.buildings.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Draw calls</dt>
              <dd>{stats.drawCalls}</dd>
            </div>
            <div>
              <dt>Frame</dt>
              <dd>{stats.frameMs.toFixed(1)} ms</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
