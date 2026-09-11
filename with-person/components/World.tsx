import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { SetPartsProvider } from "@/hooks/useSetParts";
import { useProgress } from "@/store/progress";
import CameraRig from "./CameraRig";
import Cafe from "./Set/Cafe";
import Machine from "./Set/Machine";
import Hands from "./Set/Hands";
import BrewAction from "./Set/BrewAction";
function Ready() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      useProgress.setState({ ready: true }),
    );
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      useProgress.setState({ ready: false });
    };
    const restored = () => useProgress.setState({ ready: true });
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl]);
  return null;
}
export default function World() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 2.65, 7.3], fov: 38, near: 0.025, far: 60 }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      fallback={
        <div className="webgl-fallback">
          This story needs a browser with WebGL enabled.
        </div>
      }
    >
      <color attach="background" args={["#12100e"]} />
      <fog attach="fog" args={["#12100e", 12, 35]} />
      <ambientLight intensity={0.45} color="#d1b998" />
      <hemisphereLight args={["#d7c7ac", "#21140c", 0.7]} />
      <spotLight
        position={[-3.5, 6, 4]}
        target-position={[1, 0, 0]}
        angle={0.55}
        penumbra={0.8}
        intensity={95}
        color="#ffdeb0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
      />
      <directionalLight position={[-4, 4, 1]} intensity={1.5} color="#f5ddbc" />
      <pointLight position={[-0.4, 4.5, 2]} intensity={30} color="#ffddb2" />
      <pointLight position={[-2.8, 4, 3.8]} intensity={18} color="#e0bc96" />
      <pointLight position={[2.5, 3.5, -2]} intensity={14} color="#e6b877" />
      <Environment resolution={128}>
        <Lightformer
          position={[-4, 3, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[4, 5, 1]}
          intensity={3.5}
          color="#fff0d9"
        />
        <Lightformer
          position={[1, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[4, 2, 1]}
          intensity={2}
          color="#e7d2ac"
        />
        <Lightformer
          position={[4, 2, 2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[2, 4, 1]}
          intensity={1.5}
          color="#ccae83"
        />
      </Environment>
      <SetPartsProvider>
        <Cafe />
        <Machine />
        <Hands />
        <BrewAction />
      </SetPartsProvider>
      <CameraRig />
      <Ready />
    </Canvas>
  );
}
