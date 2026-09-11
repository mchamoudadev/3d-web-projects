import * as T from "three";
import {
  MercatorCoordinate,
  type CustomLayerInterface,
  type CustomRenderMethodInput,
  type Map as MLMap,
} from "maplibre-gl";
import {
  BOUNDS,
  toWorld,
  toLngLat,
  pointInRing,
  segmentDistance,
} from "@/lib/geo";
import type { Coordinate } from "@/lib/types";
import { facadeMaterial } from "./buildings";
import { roadMaterial } from "./roads";
import { type BuiltTile, type MeshData, type Footprint } from "./geometry";
import { vegetation, decorations } from "./vegetation";
import { ocean } from "./water";
import { Lighting } from "./lighting";
import { Traffic } from "./traffic";
import { StreetPost } from "./StreetPost";
import { streetlights } from "./streetlights";
import { createLandmarks } from "./Landmarks";
type Tile = {
  data: BuiltTile;
  group: T.Group;
  trees: T.Group;
  used: number;
  grid: Map<string, Footprint[]>;
};
export class CityLayer implements CustomLayerInterface {
  id = "three-city";
  type = "custom" as const;
  renderingMode = "3d" as const;
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(60, 1, 0.1, 20000);
  renderer!: T.WebGLRenderer;
  map!: MLMap;
  lighting!: Lighting;
  traffic!: Traffic;
  time = { value: 0 };
  tiles = new Map<string, Tile>();
  stats = {
    tiles: 0,
    buildings: 0,
    drawCalls: 0,
    triangles: 0,
    frameMs: 0,
    pending: 0,
  };
  settings = { shadows: true, traffic: 1, trees: 1, hour: 16.5 };
  private post = new StreetPost();
  private renderSize = new T.Vector2();
  private obstacles: T.Box3[] = [];
  private workers: Worker[] = [];
  private busy = new Set<Worker>();
  private pending = new Set<string>();
  private queue: { key: string; x: number; y: number }[] = [];
  private last = 0;
  private lastStream = 0;
  private disposed = false;
  private ground!: T.Mesh;
  private buildings!: T.MeshStandardMaterial;
  private roads!: T.MeshStandardMaterial;
  private land = new T.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    side: T.DoubleSide,
  });
  onAdd(map: MLMap, gl: WebGL2RenderingContext) {
    this.map = map;
    this.renderer = new T.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.lighting = new Lighting(this.scene, this.camera);
    this.buildings = facadeMaterial(this.lighting.night);
    this.roads = roadMaterial();
    for (const m of [this.buildings, this.roads, this.land])
      this.lighting.setup(m);
    const groundMaterial = new T.MeshStandardMaterial({
      color: "#bda98b",
      roughness: 1,
    });
    this.lighting.setup(groundMaterial);
    this.ground = new T.Mesh(
      new T.PlaneGeometry(50000, 50000).rotateX(-Math.PI / 2),
      groundMaterial,
    );
    this.ground.receiveShadow = true;
    this.ground.position.y = -0.08;
    this.scene.add(this.ground);
    const landmarks = createLandmarks(this.lighting.night);
    landmarks.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (Array.isArray(o.material))
          o.material.forEach((m) => this.lighting.setup(m));
        else this.lighting.setup(o.material);
      }
    });
    this.scene.add(landmarks);
    landmarks.updateMatrixWorld(true);
    for (const root of landmarks.children) {
      const box = new T.Box3().setFromObject(root);
      if (!box.isEmpty()) this.obstacles.push(box);
    }
    this.traffic = new Traffic();
    this.traffic.root.traverse((o) => {
      if (o instanceof T.Mesh) this.lighting.setup(o.material as T.Material);
    });
    this.scene.add(this.traffic.root);
    fetch("/data/coast.geojson")
      .then((r) => r.json())
      .then((data) => {
        if (!this.disposed)
          this.scene.add(ocean(data, this.time, this.lighting.night));
      })
      .catch((e) => console.error("Coast:", e));

    for (let i = 0; i < 2; i++) {
      const worker = new Worker(new URL("./tileWorker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (e) => {
        this.busy.delete(worker);
        this.pending.delete(e.data.key);
        if (e.data.error) console.error("City tile:", e.data.error);
        else if (!e.data.empty) this.install(e.data);
        this.dispatch();
        map.triggerRepaint();
      };
      worker.onerror = (e) => console.error("City worker:", e.message);
      this.workers.push(worker);
    }
    this.stream(true);
  }
  private mesh(data: MeshData, material: T.Material) {
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.BufferAttribute(data.position, 3));
    g.setAttribute("normal", new T.BufferAttribute(data.normal, 3));
    g.setAttribute("color", new T.BufferAttribute(data.color, 3));
    g.setAttribute("uv", new T.BufferAttribute(data.uv, 2));
    g.computeBoundingSphere();
    const mesh = new T.Mesh(g, material);
    mesh.castShadow = material === this.buildings;
    mesh.receiveShadow = true;
    return mesh;
  }
  private install(data: BuiltTile) {
    if (this.disposed || this.tiles.has(data.key)) return;
    const group = new T.Group();
    group.name = data.key;
    for (const [part, material] of [
      [data.buildings, this.buildings],
      [data.roads, this.roads],
      [data.land, this.land],
      [data.water, this.land],
    ] as [MeshData, T.Material][]) {
      if (part.position.length) group.add(this.mesh(part, material));
    }
    const trees = vegetation(data.trees);
    trees.visible = this.settings.trees > 0;
    group.add(
      trees,
      decorations(data.decorations, this.lighting.night),
      streetlights(data.walkways, this.lighting.night),
    );
    group.traverse((o) => {
      if (
        o instanceof T.Mesh &&
        o.material !== this.buildings &&
        o.material !== this.roads &&
        o.material !== this.land
      )
        this.lighting.setup(o.material as T.Material);
    });
    this.scene.add(group);
    const grid = new Map<string, Footprint[]>();
    for (const f of data.footprints) {
      const r = f.rings[0],
        xs = r.map((p) => p[0]),
        zs = r.map((p) => p[1]);
      for (
        let x = Math.floor(Math.min(...xs) / 64);
        x <= Math.floor(Math.max(...xs) / 64);
        x++
      )
        for (
          let z = Math.floor(Math.min(...zs) / 64);
          z <= Math.floor(Math.max(...zs) / 64);
          z++
        ) {
          const key = `${x}/${z}`;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key)!.push(f);
        }
    }
    this.tiles.set(data.key, {
      data,
      group,
      trees,
      used: performance.now(),
      grid,
    });
    this.stats.tiles = this.tiles.size;
    this.stats.buildings += data.buildingCount;
  }
  private tileOf(lng: number, lat: number) {
    return {
      x: Math.floor(((lng + 180) / 360) * 32768),
      y: Math.floor(
        ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) *
          32768,
      ),
    };
  }
  private enqueue(x: number, y: number, front = false) {
    const key = `${x}/${y}`;
    const northWest = this.tileOf(BOUNDS[0], BOUNDS[3]);
    const southEast = this.tileOf(BOUNDS[2], BOUNDS[1]);
    if (
      x < northWest.x ||
      x > southEast.x ||
      y < northWest.y ||
      y > southEast.y ||
      this.tiles.has(key) ||
      this.pending.has(key)
    )
      return;
    this.pending.add(key);
    if (front) this.queue.unshift({ key, x, y });
    else this.queue.push({ key, x, y });
  }
  private dispatch() {
    for (const worker of this.workers)
      if (!this.busy.has(worker) && this.queue.length) {
        this.busy.add(worker);
        worker.postMessage({
          ...this.queue.shift(),
          url: `${location.origin}/tiles/mogadishu.pmtiles`,
        });
      }
    this.stats.pending = this.pending.size;
  }
  private stream(force = false) {
    const now = performance.now();
    if (!force && now - this.lastStream < 600) return;
    this.lastStream = now;
    const center = this.map.getCenter(),
      at = this.tileOf(center.lng, center.lat),
      cp = toLngLat(this.camera.position.x, this.camera.position.z),
      cameraTile = this.tileOf(...cp);
    const candidates: { x: number; y: number; d: number }[] = [];
    for (const anchor of [at, cameraTile])
      for (let x = anchor.x - 2; x <= anchor.x + 2; x++)
        for (let y = anchor.y - 2; y <= anchor.y + 2; y++)
          candidates.push({
            x,
            y,
            d: Math.hypot(x - cameraTile.x, y - cameraTile.y),
          });
    candidates.sort((a, b) => a.d - b.d);
    for (const c of candidates) {
      const tile = this.tiles.get(`${c.x}/${c.y}`);
      if (tile) tile.used = now;
      else this.enqueue(c.x, c.y);
    }
    this.dispatch();
    for (const [key, tile] of [...this.tiles].sort(
      (a, b) => a[1].used - b[1].used,
    )) {
      if (this.tiles.size <= 55) break;
      if (now - tile.used > 5000) {
        tile.group.removeFromParent();
        this.disposeTile(tile);
        this.stats.buildings -= tile.data.buildingCount;
        this.tiles.delete(key);
      }
    }
    this.stats.tiles = this.tiles.size;
  }
  prefetch(coordinates: Coordinate[]) {
    for (
      let i = 0;
      i < coordinates.length;
      i += Math.max(1, Math.floor(coordinates.length / 35))
    ) {
      const at = this.tileOf(...coordinates[i]);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) this.enqueue(at.x + dx, at.y + dy);
    }
    this.dispatch();
  }
  async prepare(location: Coordinate) {
    const at = this.tileOf(...location);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) this.enqueue(at.x + dx, at.y + dy, true);
    this.dispatch();
    const start = performance.now();
    while (
      !this.tiles.has(`${at.x}/${at.y}`) &&
      performance.now() - start < 8000 &&
      !this.disposed
    )
      await new Promise((r) => setTimeout(r, 40));
  }
  canWalk(x: number, z: number) {
    const at = this.tileOf(...toLngLat(x, z)),
      tile = this.tiles.get(`${at.x}/${at.y}`);
    if (!tile) return false;
    const p = [x, z];
    if (
      this.obstacles.some(
        (b) =>
          x > b.min.x - 0.8 &&
          x < b.max.x + 0.8 &&
          z > b.min.z - 0.8 &&
          z < b.max.z + 0.8,
      )
    )
      return false;
    for (const f of tile.grid.get(
      `${Math.floor(x / 64)}/${Math.floor(z / 64)}`,
    ) ?? []) {
      if (
        pointInRing(p, f.rings[0]) &&
        !f.rings.slice(1).some((r) => pointInRing(p, r))
      )
        return false;
      for (const ring of f.rings)
        for (let i = 1; i < ring.length; i++)
          if (segmentDistance(p, ring[i - 1], ring[i]).distance < 0.45)
            return false;
    }
    return (
      tile.data.beaches.some((b) => pointInRing(p, b)) ||
      tile.data.walkways.some((r) =>
        r.points.some(
          (b, i) =>
            i &&
            segmentDistance(p, r.points[i - 1], b).distance <=
              r.width / 2 + 1.8,
        ),
      )
    );
  }
  safeRoute(coordinates: Coordinate[]) {
    return this.trimEnd(this.trimEnd(coordinates).reverse()).reverse();
  }
  private trimEnd(coordinates: Coordinate[]) {
    const points = coordinates.map((p) => toWorld(p));
    let end = points.length - 1;
    for (; end > 0; end--) {
      const a = points[end],
        b = points[end - 1],
        length = Math.hypot(a[0] - b[0], a[1] - b[1]);
      for (let d = 0; d < length; d += 1) {
        const x = a[0] + ((b[0] - a[0]) * d) / length,
          z = a[1] + ((b[1] - a[1]) * d) / length;
        if (
          this.canWalk(x, z) &&
          this.obstacles.every(
            (b) => b.distanceToPoint(new T.Vector3(x, 1.6, z)) > 8,
          ) &&
          [
            [2, 0],
            [-2, 0],
            [0, 2],
            [0, -2],
          ].every(([dx, dz]) => this.canWalk(x + dx, z + dz))
        )
          return [...coordinates.slice(0, end), toLngLat(x, z)];
      }
    }
    return coordinates;
  }
  setSettings(settings: Partial<typeof this.settings>) {
    Object.assign(this.settings, settings);
    this.renderer.shadowMap.enabled = this.settings.shadows;
    this.traffic.density = this.settings.traffic;
    for (const tile of this.tiles.values()) {
      tile.trees.visible = this.settings.trees > 0;
      tile.trees.children.forEach((o) => {
        if (o instanceof T.InstancedMesh)
          o.count = Math.floor(o.instanceMatrix.count * this.settings.trees);
      });
    }
    this.lighting.setHour(this.settings.hour, this.scene);
    const night = this.lighting.night.value;
    this.map.setSky({
      "sky-color": night > 0.5 ? "#101a2a" : "#a9b4b9",
      "horizon-color": night > 0.5 ? "#192333" : "#b3b3a7",
      "fog-color": night > 0.5 ? "#151e2c" : "#b3b3a7",
      "sky-horizon-blend": 0.8,
      "horizon-fog-blend": 0.8,
      "fog-ground-blend": 0.5,
    });
    this.map.triggerRepaint();
  }
  render(_gl: WebGL2RenderingContext, args: CustomRenderMethodInput) {
    const now = performance.now();
    if (this.last)
      this.stats.frameMs = this.stats.frameMs * 0.9 + (now - this.last) * 0.1;
    this.last = now;
    this.time.value = now / 1000;
    const center = this.map.getCenter(),
      mercator = MercatorCoordinate.fromLngLat(center),
      worldSize = 512 * Math.pow(2, this.map.getZoom()),
      ppm = mercator.meterInMercatorCoordinateUnits() * worldSize,
      cameraDistance =
        this.map.getCanvas().clientHeight / (2 * Math.tan(args.fov / 2)) / ppm,
      pitch = (this.map.getPitch() * Math.PI) / 180,
      bearing = (this.map.getBearing() * Math.PI) / 180;
    const offset =
        cameraDistance *
        Math.sin(pitch) *
        mercator.meterInMercatorCoordinateUnits(),
      cameraMercator = new MercatorCoordinate(
        mercator.x - Math.sin(bearing) * offset,
        mercator.y + Math.cos(bearing) * offset,
      ),
      ll = cameraMercator.toLngLat(),
      [x, z] = toWorld([ll.lng, ll.lat]),
      [cx, cz] = toWorld([center.lng, center.lat]),
      elevation = this.map.getCameraTargetElevation();
    this.camera.matrixAutoUpdate = true;
    this.camera.position.set(
      x,
      cameraDistance * Math.cos(pitch) + elevation,
      z,
    );
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(cx, elevation, cz);
    this.camera.rotateZ((-this.map.getRoll() * Math.PI) / 180);
    this.camera.updateMatrixWorld(true);
    this.camera.projectionMatrix.fromArray(args.projectionMatrix);
    this.camera.projectionMatrix.elements[14] /= ppm;
    this.camera.projectionMatrixInverse
      .copy(this.camera.projectionMatrix)
      .invert();
    this.camera.near = args.nearZ / ppm;
    this.camera.far = args.farZ / ppm;

    this.stream();
    this.lighting.update();
    this.traffic.update(now, this.camera.position, this.lighting.night.value);
    const canvas = this.map.getCanvas();
    this.renderer.getSize(this.renderSize);
    if (
      this.renderSize.x !== canvas.width ||
      this.renderSize.y !== canvas.height
    )
      this.renderer.setSize(canvas.width, canvas.height, false);
    this.renderer.resetState();
    this.renderer.setViewport(0, 0, canvas.width, canvas.height);
    this.renderer.info.reset();
    if (this.camera.position.y < 80)
      this.post.render(this.renderer, this.scene, this.camera);
    else this.renderer.render(this.scene, this.camera);
    this.stats.drawCalls = this.renderer.info.render.calls;
    this.stats.triangles = this.renderer.info.render.triangles;
    this.map.triggerRepaint();
  }
  private disposeTile(tile: Tile) {
    tile.group.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of materials)
          if (m !== this.buildings && m !== this.roads && m !== this.land)
            m.dispose();
      }
    });
  }
  onRemove() {
    this.disposed = true;
    this.workers.forEach((w) => w.terminate());
    this.tiles.forEach((t) => this.disposeTile(t));
    this.tiles.clear();
    this.traffic.dispose();
    this.post.dispose();
    this.lighting.dispose();
    this.buildings.dispose();
    this.roads.dispose();
    this.land.dispose();
    this.scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => m.dispose());
      }
    });
    this.renderer.dispose();
  }
}
