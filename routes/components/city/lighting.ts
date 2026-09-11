import * as T from "three";
import { CSM } from "three/addons/csm/CSM.js";
import { Sky } from "three/addons/objects/Sky.js";
export class Lighting {
  csm: CSM;
  sky: Sky;
  ambient: T.HemisphereLight;
  hour = 16.5;
  night = { value: 0 };
  private prepared = new WeakSet<T.Material>();
  constructor(scene: T.Scene, camera: T.PerspectiveCamera) {
    this.ambient = new T.HemisphereLight("#c6e0f2", "#ac9476", 1.05);
    scene.add(this.ambient);
    this.csm = new CSM({
      camera,
      parent: scene,
      cascades: 3,
      maxFar: 2800,
      mode: "practical",
      shadowMapSize: 1024,
      lightDirection: new T.Vector3(-0.6, -0.65, 0.45).normalize(),
      lightIntensity: 2.2,
      lightMargin: 100,
      shadowBias: -0.0003,
    });
    this.csm.fade = true;
    this.csm.lights.forEach((light) => {
      light.shadow.normalBias = 1.5;
    });
    this.sky = new Sky();
    this.sky.scale.setScalar(100000);
    this.sky.material.depthWrite = false;
    this.sky.renderOrder = -100;
    scene.add(this.sky);
    scene.fog = new T.FogExp2("#bfd0d5", 0.00016);
    this.setHour(16.5, scene);
  }
  setup(material: T.Material) {
    if (
      material instanceof T.MeshStandardMaterial &&
      !this.prepared.has(material)
    ) {
      this.prepared.add(material);
      const previous = material.onBeforeCompile;
      const originalKey = material.customProgramCacheKey();
      this.csm.setupMaterial(material);
      const csm = material.onBeforeCompile;
      material.customProgramCacheKey = () => `muqdisho-csm:${originalKey}`;
      material.onBeforeCompile = (shader, renderer) => {
        csm.call(material, shader, renderer);
        previous.call(material, shader, renderer);
      };
    }
  }
  setHour(hour: number, scene: T.Scene) {
    this.hour = hour;
    const angle = ((hour - 6) / 12) * Math.PI,
      altitude = Math.sin(angle),
      night = T.MathUtils.smoothstep(-altitude, -0.04, 0.2);
    this.night.value = night;
    const sun = new T.Vector3(
      Math.cos(angle) * 0.75,
      Math.max(-0.2, altitude),
      0.4,
    ).normalize();
    this.csm.lightDirection.copy(sun).negate();
    this.csm.lights.forEach((l) => {
      l.intensity = night > 0.8 ? 0.15 : 3.1 * (1 - night);
      l.color.set(night > 0.5 ? "#aac7ff" : "#ffe6c4");
    });
    this.ambient.intensity = 1.05 * (1 - night) + 0.38 * night;
    this.sky.material.uniforms.sunPosition.value.copy(sun);
    this.sky.material.uniforms.turbidity.value = 2.4;
    this.sky.material.uniforms.rayleigh.value = 2.5;
    this.sky.material.uniforms.mieCoefficient.value = 0.003;
    this.sky.material.uniforms.mieDirectionalG.value = 0.82;
    this.sky.visible = night < 0.95;
    if (scene.fog) scene.fog.color.set(night > 0.5 ? "#151e2c" : "#bfd0d5");
  }
  update() {
    this.csm.updateFrustums();
    this.csm.update();
  }
  dispose() {
    this.csm.remove();
    this.csm.dispose();
    this.sky.geometry.dispose();
    this.sky.material.dispose();
  }
}
