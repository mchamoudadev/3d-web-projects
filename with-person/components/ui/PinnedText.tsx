import { useEffect, useRef } from "react";
import { scenes } from "@/config/timeline";
import { useProgress } from "@/store/progress";
export default function PinnedText() {
  const blocks = useRef<(HTMLElement | null)[]>([]);
  const chapter = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const update = ({ progress }: { progress: number }) => {
      const index = Math.max(
        0,
        scenes.findIndex(
          (s, i) =>
            progress >= s.start &&
            (progress < s.end || i === scenes.length - 1),
        ),
      );
      document.documentElement.dataset.chapter = String(index);
      if (chapter.current)
        chapter.current.textContent = `${String(index + 1).padStart(2, "0")} / ${scenes[index].label}`;
      blocks.current.forEach((block, i) => {
        if (!block) return;
        const scene = scenes[i];
        const t = (progress - scene.start) / (scene.end - scene.start);
        const opacity =
          i !== index
            ? 0
            : i === 0
              ? Math.min(1, (1 - t) / 0.23)
              : i === scenes.length - 1
                ? Math.min(1, t / 0.15)
                : Math.max(0, Math.min(1, t / 0.15, (1 - t) / 0.2));
        block.style.opacity = String(opacity);
        block.style.visibility = i === index ? "visible" : "hidden";
        block.setAttribute("aria-hidden", String(i !== index));
      });
    };
    update(useProgress.getState());
    return useProgress.subscribe(update);
  }, []);
  return (
    <>
      <div className="chapter-label">
        <span className="live-dot" />
        <span ref={chapter}>01 / The quiet before</span>
      </div>
      {scenes.map((scene, i) => (
        <section
          key={scene.start}
          className={`story-copy ${i === 0 ? "opening-copy" : ""}`}
          ref={(el) => {
            blocks.current[i] = el;
          }}
          style={{
            opacity: i === 0 ? 1 : 0,
            visibility: i === 0 ? "visible" : "hidden",
          }}
          aria-hidden={i !== 0}
        >
          <p className="eyebrow">{scene.detail}</p>
          {i === 0 ? (
            <h1>
              Nine bars.
              <br />
              Twenty-five
              <br />
              <em>seconds.</em>
            </h1>
          ) : (
            <h2>
              {scene.title.split("\n").map((line, j) => (
                <span key={j}>
                  {line}
                  <br />
                </span>
              ))}
            </h2>
          )}
          {i === 0 && <p className="opening-ending">Everything in between.</p>}
          <p className="scene-description">{scene.description}</p>
        </section>
      ))}
    </>
  );
}
