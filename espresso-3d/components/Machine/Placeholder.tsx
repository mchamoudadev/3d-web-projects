import { RoundedBox } from "@react-three/drei";
import { type ReactNode, useCallback } from "react";
import { type Group, type Vector3Tuple } from "three";
import { type PartName, useMachineParts } from "./useMachineParts";

const steel = { color: "#aaa59b", metalness: 0.88, roughness: 0.27 };
const brass = { color: "#b8935a", metalness: 0.8, roughness: 0.3 };
const dark = { color: "#242321", metalness: 0.6, roughness: 0.36 };

function Part({ name, position = [0, 0, 0], children }: { name: PartName; position?: Vector3Tuple; children: ReactNode }) {
  const { register } = useMachineParts();
  const ref = useCallback((group: Group | null) => register(name, group), [name, register]);
  return <group name={name} position={position} ref={ref}>{children}</group>;
}

function Box({ position = [0, 0, 0], size, material = steel, radius = 0.04 }: {
  position?: Vector3Tuple; size: Vector3Tuple; material?: typeof steel; radius?: number;
}) {
  return <RoundedBox position={position} args={size} radius={radius} smoothness={3} castShadow receiveShadow>
    <meshStandardMaterial {...material} />
  </RoundedBox>;
}

function Cylinder({ position = [0, 0, 0], radius, height, material = steel, rotation = [0, 0, 0] }: {
  position?: Vector3Tuple; radius: number; height: number; material?: typeof steel; rotation?: Vector3Tuple;
}) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <cylinderGeometry args={[radius, radius, height, 48]} /><meshStandardMaterial {...material} />
  </mesh>;
}

function Dial() {
  return <group position={[-0.1, 1.14, 1.19]} rotation={[Math.PI / 2, 0, 0]}>
    <Cylinder radius={0.35} height={0.09} material={brass} />
    <Cylinder radius={0.299} height={0.102} material={{ color: "#e5dbc5", metalness: 0.05, roughness: 0.6 }} />
    {Array.from({ length: 25 }, (_, i) => {
      const angle = (-130 + i * 260 / 24) * Math.PI / 180;
      return <mesh key={i} position={[Math.sin(angle) * 0.244, 0.058, -Math.cos(angle) * 0.244]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[i % 4 === 0 ? 0.013 : 0.007, 0.004, i % 4 === 0 ? 0.057 : 0.027]} />
        <meshBasicMaterial color="#403a30" />
      </mesh>;
    })}
    <mesh position={[-0.071, 0.066, 0.02]} rotation={[0, 1.25, 0]}><boxGeometry args={[0.014, 0.008, 0.21]} /><meshBasicMaterial color="#6a4430" /></mesh>
    <Cylinder radius={0.027} height={0.14} material={brass} />
  </group>;
}

export default function Placeholder() {
  return <group name="espressoMachine">
    <Part name="body">
      <Box position={[0, 0.05, -0.55]} size={[2.72, 3.62, 1.26]} material={dark} radius={0.11} />
      <Box position={[0, 1.14, 0.58]} size={[2.72, 1.44, 1.06]} material={steel} radius={0.09} />
      <Box position={[0, 1.13, 1.12]} size={[2.58, 1.24, 0.06]} material={{ color: "#afa490", metalness: 0.76, roughness: 0.33 }} />
      <Box position={[0, -0.62, 0.14]} size={[2.54, 1.95, 0.09]} material={steel} />
      <Box position={[0, 1.94, -0.03]} size={[2.96, 0.14, 2.45]} material={steel} />
      <Box position={[0, -1.73, 0.14]} size={[2.91, 0.24, 2.76]} material={dark} />
      <Dial />
      {[-0.91, 0.92].map((x) => <group key={x} position={[x, 1.15, 1.2]}>
        <Cylinder radius={0.2} height={0.13} rotation={[Math.PI / 2, 0, 0]} material={brass} />
        <Cylinder position={[0, 0, 0.1]} radius={0.151} height={0.18} rotation={[Math.PI / 2, 0, 0]} material={dark} />
        <Box position={[0, 0.08, 0.2]} size={[0.015, 0.06, 0.015]} material={brass} radius={0.002} />
      </group>)}
      <mesh position={[-0.92, 0.72, 1.165]}><sphereGeometry args={[0.025, 12, 12]} /><meshBasicMaterial color="#b8935a" /></mesh>
      {[-1.1, 1.1].flatMap((x) => [-0.75, 1].map((z) => <Cylinder key={`${x}-${z}`} position={[x, -1.98, z]} radius={0.17} height={0.3} material={dark} />))}
      {Array.from({ length: 10 }, (_, i) => <Box key={i} position={[-0.97 + i * 0.216, 2.021, -0.05]} size={[0.026, 0.023, 1.5]} material={dark} radius={0.004} />)}
      <Box position={[0, 2.12, -1.13]} size={[2.8, 0.16, 0.04]} material={brass} radius={0.012} />
    </Part>
    <Part name="sidePanelL" position={[-1.46, 0.08, -0.04]}>
      <Box size={[0.19, 3.65, 2.28]} material={brass} radius={0.075} />
    </Part>
    <Part name="sidePanelR" position={[1.46, 0.08, -0.04]}>
      <Box size={[0.19, 3.65, 2.28]} material={brass} radius={0.075} />
      {Array.from({ length: 8 }, (_, i) => <Box key={i} position={[0.098, 0.55 - i * 0.13, -0.2]} size={[0.012, 0.035, 1.1]} material={dark} radius={0.005} />)}
    </Part>
    <Part name="dripTray" position={[0, -1.49, 0.97]}>
      <Box size={[2.6, 0.12, 1.23]} material={steel} />
      {Array.from({ length: 17 }, (_, i) => <Box key={i} position={[-1.15 + i * 0.143, 0.065, 0]} size={[0.05, 0.014, 0.98]} material={dark} radius={0.005} />)}
    </Part>
    <Part name="groupHead" position={[-0.1, 0.29, 0.89]}>
      <Cylinder radius={0.47} height={0.29} material={brass} />
      <Cylinder position={[0, -0.17, 0]} radius={0.37} height={0.13} />
    </Part>
    <Part name="portafilter" position={[-0.1, -0.03, 0.89]}>
      <Cylinder radius={0.38} height={0.22} />
      <Cylinder position={[0.53, 0, 0.23]} radius={0.11} height={0.73} rotation={[0, 0, -Math.PI / 2]} material={dark} />
      <Cylinder position={[0.91, 0, 0.23]} radius={0.12} height={0.12} rotation={[0, 0, -Math.PI / 2]} material={brass} />
      <Cylinder position={[0, -0.17, 0]} radius={0.09} height={0.19} />
    </Part>
    <Part name="basket" position={[-0.1, 0.035, 0.89]}>
      <Cylinder radius={0.32} height={0.075} material={{ color: "#483021", metalness: 0.12, roughness: 0.88 }} />
    </Part>
    <Part name="boiler" position={[0, 0.7, -0.52]}>
      <Cylinder radius={0.68} height={1.7} material={brass} />
    </Part>
    <Part name="heatingElement" position={[0, 0.25, -0.52]}>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, i * 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.43, 0.035, 8, 40]} /><meshStandardMaterial color="#5d3325" /></mesh>)}
    </Part>
    <Part name="pump" position={[-0.7, -0.9, -0.52]}><Cylinder radius={0.25} height={0.73} material={dark} /></Part>
    <Part name="reservoir" position={[0.8, 0.25, -0.61]}>
      <RoundedBox args={[0.55, 2.7, 0.72]} radius={0.06}><meshStandardMaterial color="#77817e" transparent opacity={0.35} roughness={0.2} depthWrite={false} /></RoundedBox>
    </Part>
    <Part name="steamWand" position={[1.08, 0.39, 0.94]}>
      <Cylinder radius={0.075} height={0.25} material={brass} />
      <Cylinder position={[0.17, -0.44, 0.08]} radius={0.036} height={0.83} rotation={[0, 0, 0.4]} />
      <Cylinder position={[0.35, -0.97, 0.08]} radius={0.037} height={0.34} />
      <Cylinder position={[0.35, -1.16, 0.08]} radius={0.059} height={0.12} material={brass} />
    </Part>
    <Part name="cup" position={[-0.12, -1.15, 1.0]}>
      <mesh castShadow><cylinderGeometry args={[0.35, 0.245, 0.48, 64, 1, true]} /><meshStandardMaterial color="#e8dfce" roughness={0.22} side={2} /></mesh>
      <Cylinder position={[0, -0.235, 0]} radius={0.25} height={0.03} material={{ color: "#e8dfce", metalness: 0, roughness: 0.22 }} />
      <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.348, 0.018, 10, 64]} /><meshStandardMaterial color="#f2e8d5" /></mesh>
      <mesh position={[0.35, 0.015, 0]}><torusGeometry args={[0.14, 0.035, 12, 32]} /><meshStandardMaterial color="#e8dfce" roughness={0.22} /></mesh>
      <Cylinder position={[0, -0.27, 0]} radius={0.51} height={0.045} material={{ color: "#e8dfce", metalness: 0, roughness: 0.22 }} />
    </Part>
    <Part name="pitcher" position={[2.12, -1.56, 0.24]}>
      <mesh castShadow><cylinderGeometry args={[0.3, 0.36, 0.8, 48, 1, true]} /><meshStandardMaterial {...steel} side={2} /></mesh>
      <Cylinder position={[0, -0.39, 0]} radius={0.36} height={0.025} />
      <mesh position={[0.34, 0.04, 0]} scale={[1, 1.3, 1]}><torusGeometry args={[0.19, 0.032, 8, 32]} /><meshStandardMaterial {...steel} /></mesh>
    </Part>
  </group>;
}
