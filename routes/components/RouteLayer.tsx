import * as THREE from "three";
import type { RouteResult } from "@/lib/types";
import { toWorld } from "@/lib/geo";
export class RouteVisual {
  group = new THREE.Group();
  private core: THREE.Mesh;
  private halo: THREE.Mesh;
  private segments: number;
  private totalIndices: number;
  private highlight: THREE.Mesh;
  constructor(scene: THREE.Scene, result: RouteResult) {
    const points = result.route.geometry.coordinates.map((p) => {
      const [x, z] = toWorld(p);
      return new THREE.Vector3(x, 38, z);
    });
    const curve = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 1; i < points.length; i++)
      curve.add(new THREE.LineCurve3(points[i - 1], points[i]));
    this.segments = Math.max(128, Math.ceil(result.route.distance / 12));
    const geometry = new THREE.TubeGeometry(
      curve,
      this.segments,
      1.5,
      4,
      false,
    );
    this.totalIndices = geometry.index!.count;
    this.core = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: "#f9dcad",
        depthTest: false,
        transparent: true,
        opacity: 0.95,
      }),
    );
    this.halo = new THREE.Mesh(
      new THREE.TubeGeometry(curve, this.segments, 6, 4, false),
      new THREE.MeshBasicMaterial({
        color: "#e8c79a",
        depthTest: false,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.core.renderOrder = 20;
    this.halo.renderOrder = 19;
    this.group.add(this.halo, this.core);
    this.highlight = new THREE.Mesh(
      new THREE.CircleGeometry(50, 48),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { color: { value: new THREE.Color("#e8c79a") } },
        vertexShader:
          "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 vUv;uniform vec3 color;void main(){float d=length(vUv-.5)*2.;float a=pow(max(0.,1.-d),2.)*.55;gl_FragColor=vec4(color,a);}",
      }),
    );
    this.highlight.rotation.x = -Math.PI / 2;
    this.highlight.position.y = 1;
    this.group.add(this.highlight);
    this.highlight.visible = false;
    scene.add(this.group);
    this.reveal(0);
  }
  setDrive(drive: boolean) {
    this.core.scale.y = drive ? 0.04 : 1;
    this.halo.scale.y = drive ? 0.02 : 1;
    this.core.position.y = drive ? -38 * 0.04 + 0.22 : 0;
    this.halo.position.y = drive ? -38 * 0.02 + 0.18 : 0;
    (this.core.material as THREE.MeshBasicMaterial).opacity = drive
      ? 0.45
      : 0.95;
    (this.core.material as THREE.MeshBasicMaterial).depthTest = drive;
    (this.halo.material as THREE.MeshBasicMaterial).depthTest = drive;
  }
  reveal(progress: number) {
    const count = Math.min(
      this.totalIndices,
      Math.floor(Math.max(0, progress) * this.segments) * 24,
    );
    this.core.geometry.setDrawRange(0, count);
    this.halo.geometry.setDrawRange(0, count);
  }
  focus(lng: number, lat: number) {
    const [x, z] = toWorld([lng, lat]);
    this.highlight.position.set(x, 1, z);
    this.highlight.visible = true;
  }
  clearFocus() {
    this.highlight.visible = false;
  }
  dispose() {
    this.group.removeFromParent();
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
  }
}
