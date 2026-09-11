import * as THREE from "three";
import {
  MercatorCoordinate,
  type CustomLayerInterface,
  type Map as MLMap,
  type CustomRenderMethodInput,
} from "maplibre-gl";
import { ORIGIN } from "@/lib/geo";
import { createLandmarks } from "./Landmarks";
export class PreviewLayer implements CustomLayerInterface {
  id = "landmarks-preview";
  type = "custom" as const;
  renderingMode = "3d" as const;
  scene = new THREE.Scene();
  camera = new THREE.Camera();
  renderer!: THREE.WebGLRenderer;
  map!: MLMap;
  onAdd(map: MLMap, gl: WebGL2RenderingContext) {
    this.map = map;
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;
    this.scene.add(new THREE.HemisphereLight(0xffe4be, 0x25282c, 2));
    const sun = new THREE.DirectionalLight(0xffd9a1, 2);
    sun.position.set(-400, 600, 400);
    this.scene.add(sun);
    this.scene.add(createLandmarks());
  }
  render(_gl: WebGL2RenderingContext, args: CustomRenderMethodInput) {
    const c = MercatorCoordinate.fromLngLat(ORIGIN),
      s = c.meterInMercatorCoordinateUnits();
    const m = new THREE.Matrix4()
      .makeTranslation(c.x, c.y, 0)
      .scale(new THREE.Vector3(s, -s, s))
      .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    this.camera.projectionMatrix
      .fromArray(args.defaultProjectionData.mainMatrix)
      .multiply(m);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
  }
  onRemove() {
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
    this.renderer.dispose();
  }
}
