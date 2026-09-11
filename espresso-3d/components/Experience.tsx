"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import CameraRig from "./CameraRig";
import Machine from "./Machine/Machine";
import { MachinePartsProvider } from "./Machine/useMachineParts";
import ScrollEngine from "./ScrollEngine";
import Gauge from "./ui/Gauge";
import PinnedText from "./ui/PinnedText";
import { useProgress } from "@/store/progress";

function Ready() {
  useEffect(() => { useProgress.getState().setReady(true); return () => useProgress.getState().setReady(false); }, []);
  return null;
}

export default function Experience() {
  const ready = useProgress((state) => state.ready);
  return <>
    <ScrollEngine />
    <div className="canvas-frame" role="img" aria-label="An interactive brass and steel espresso machine. Scroll to move the camera through the machine's story.">
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [6.6, 4.3, 10.8], fov: 35, near: 0.1, far: 80 }} gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }} fallback={<div className="grid h-full place-items-center p-10 font-serif text-xl">This experience needs a browser with WebGL enabled.</div>}>
        <color attach="background" args={["#12100e"]} />
        <fog attach="fog" args={["#12100e", 18, 38]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[1, 7, 5]} intensity={3.5} color="#ffe2b7" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} shadow-normalBias={0.025} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
        <directionalLight position={[-4, 3, -4]} intensity={1.3} color="#a1b8cd" />
        <Environment resolution={128} frames={1}>
          <Lightformer position={[0, 5, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[5, 5, 1]} intensity={2.5} color="#fff0d5" />
          <Lightformer position={[-4, 1, 2]} rotation={[0, Math.PI / 2, 0]} scale={[2, 6, 1]} intensity={1.4} color="#b6c8d8" />
          <Lightformer position={[4, 2, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[1, 5, 1]} intensity={3} color="#edd0a4" />
        </Environment>
        <MachinePartsProvider><Machine /><Ready /></MachinePartsProvider>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#12100e" roughness={0.9} /></mesh>
        <CameraRig />
      </Canvas>
    </div>
    <div style={{ opacity: ready ? 1 : 0, transition: "opacity 700ms ease" }}><PinnedText /><Gauge /></div>
    <noscript><p>This scroll-driven 3D experience requires JavaScript.</p></noscript>
  </>;
}
