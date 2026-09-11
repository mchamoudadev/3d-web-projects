// Browser-only decoded-image cache. Six concurrent requests, bounded memory,
// newest requested frame first; background prefetch never paints stale frames.
export class FrameCache {
  private images = new Map<string, HTMLImageElement>();
  private pending = new Set<string>();
  private failed = new Set<string>();
  private queue: string[] = [];
  private disposed = false;
  private wanted: string | null = null;
  private paint: ((image: HTMLImageElement) => void) | null = null;
  private onError: (() => void) | null = null;

  constructor(
    private capacity = 40,
    private concurrency = 6,
  ) {}

  request(
    src: string,
    neighbors: string[],
    paint: (image: HTMLImageElement) => void,
    onError: () => void,
  ) {
    this.wanted = src;
    this.paint = paint;
    this.onError = onError;
    const cached = this.images.get(src);
    if (cached) {
      this.images.delete(src);
      this.images.set(src, cached);
      paint(cached);
    } else if (this.failed.has(src)) {
      onError();
      return;
    }
    this.queue = [...new Set([src, ...neighbors])].filter(
      (url) =>
        !this.images.has(url) &&
        !this.pending.has(url) &&
        !this.failed.has(url),
    );
    this.pump();
  }

  private pump() {
    while (
      !this.disposed &&
      this.pending.size < this.concurrency &&
      this.queue.length
    ) {
      const src = this.queue.shift()!;
      this.pending.add(src);
      const img = new Image();
      img.onload = () => {
        this.pending.delete(src);
        if (this.disposed) return;
        this.images.set(src, img);
        while (this.images.size > this.capacity) {
          const oldest = this.images.keys().next().value!;
          if (oldest === this.wanted) {
            const keep = this.images.get(oldest)!;
            this.images.delete(oldest);
            this.images.set(oldest, keep);
          } else this.images.delete(oldest);
        }
        if (src === this.wanted) this.paint?.(img);
        this.pump();
      };
      img.onerror = () => {
        this.pending.delete(src);
        if (this.disposed) return;
        this.failed.add(src);
        if (this.failed.size > 80)
          this.failed.delete(this.failed.values().next().value!);
        if (src === this.wanted) this.onError?.();
        this.pump();
      };
      img.src = src;
    }
  }

  dispose() {
    this.disposed = true;
    this.images.clear();
    this.queue = [];
    this.paint = null;
    this.onError = null;
  }
}
