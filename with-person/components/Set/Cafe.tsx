import { useMemo } from "react";
import { LatheGeometry, Vector2 } from "three";
import { CoffeeSurface } from "./BrewAction";
import { Part } from "@/hooks/useSetParts";
import { Block, Cylinder, palette } from "./Placeholder";
function Cup() {
  const geometry = useMemo(
    () =>
      new LatheGeometry(
        [
          [0, 0],
          [0.19, 0],
          [0.23, 0.03],
          [0.29, 0.3],
          [0.3, 0.36],
          [0.275, 0.365],
          [0.266, 0.32],
          [0.205, 0.065],
          [0, 0.065],
        ].map((p) => new Vector2(...p)),
        48,
      ),
    [],
  );
  return (
    <>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={palette.cream}
          roughness={0.21}
          clearcoat={0.65}
        />
      </mesh>
      <mesh
        position={[0.33, 0.21, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <torusGeometry args={[0.125, 0.032, 12, 32]} />
        <meshStandardMaterial color={palette.cream} roughness={0.24} />
      </mesh>
    </>
  );
}
export default function Cafe() {
  return (
    <group name="cafe">
      <Block
        position={[0, -0.18, 1.1]}
        size={[22, 0.34, 4.8]}
        color="#302016"
        metal={0.06}
        rough={0.47}
        radius={0.02}
      />
      {Array.from({ length: 26 }, (_, i) => (
        <mesh
          key={i}
          position={[-11 + i * 0.85, -0.003, 1.1]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[0.009, 4.8]} />
          <meshStandardMaterial color="#1f1610" roughness={1} />
        </mesh>
      ))}
      <Block
        position={[0, 3, -4.0]}
        size={[24, 7, 0.1]}
        color="#181510"
        metal={0}
        rough={1}
      />
      {Array.from({ length: 45 }, (_, i) => (
        <Block
          key={i}
          position={[-10 + i * 0.46, 2.3, -3.87]}
          size={[0.035, 4.5, 0.07]}
          color="#2b241a"
          metal={0}
          rough={1}
          radius={0.008}
        />
      ))}
      <Block
        position={[1.0, 2.92, -3.55]}
        size={[8, 0.08, 0.52]}
        color="#38291c"
        metal={0.1}
      />
      <Block
        position={[1.0, 2.86, -3.49]}
        size={[7.8, 0.018, 0.06]}
        color={palette.brass}
        metal={0.2}
        radius={0.004}
      />
      {[-1.8, -1.32, -0.84, 2.9, 3.38].map((x, i) => (
        <group key={x} position={[x, 3.13 + (i % 2) * 0.06, -3.55]}>
          <Cylinder
            radius={0.14}
            height={0.3 + (i % 2) * 0.12}
            color={i % 2 ? "#6b5135" : "#b1a18a"}
            metal={0.05}
          />
          <Cylinder
            position={[0, 0.17 + (i % 2) * 0.06, 0]}
            radius={0.15}
            height={0.025}
            color={palette.wood}
            metal={0.1}
          />
        </group>
      ))}
      <group position={[-6, 2.8, -1.7]}>
        <mesh>
          <planeGeometry args={[2.8, 4.8]} />
          <meshBasicMaterial color="#e6c596" />
        </mesh>
        <Block size={[0.07, 4.8, 0.1]} color="#403121" />
        <Block size={[2.8, 0.08, 0.1]} color="#403121" />
      </group>
      <group position={[2.9, 4.5, -1.0]}>
        <Cylinder
          position={[0, 1, 0]}
          radius={0.018}
          height={2.1}
          color="#252019"
        />
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.5, 0.35, 48, 1, true]} />
          <meshStandardMaterial
            color="#443424"
            metalness={0.6}
            roughness={0.35}
            side={2}
          />
        </mesh>
        <mesh position={[0, -0.11, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#ffcf88" />
        </mesh>
        <pointLight
          position={[0, -0.2, 0]}
          color="#ffcd88"
          intensity={8}
          distance={9}
          decay={2}
        />
      </group>
      <Part name="grinder" position={[-1.6, 0, -0.75]}>
        <Block
          position={[0, 0.12, 0]}
          size={[0.74, 0.2, 0.83]}
          color={palette.black}
        />
        <Block
          position={[0, 0.7, -0.14]}
          size={[0.52, 1.1, 0.54]}
          color="#292621"
        />
        <Cylinder
          position={[0, 1.52, -0.12]}
          radius={0.24}
          height={0.6}
          color="#3d3125"
          metal={0.3}
        />
        <Cylinder
          position={[0, 1.85, -0.12]}
          radius={0.27}
          height={0.065}
          color={palette.black}
        />
        <Block
          position={[0, 1.1, 0.23]}
          size={[0.23, 0.23, 0.45]}
          color={palette.steel}
        />
        <Block
          position={[0, 0.98, 0.48]}
          size={[0.18, 0.15, 0.12]}
          color={palette.black}
        />
        <Cylinder
          position={[0.28, 0.65, -0.1]}
          radius={0.085}
          height={0.07}
          rotation={[0, 0, Math.PI / 2]}
          color={palette.brass}
        />
      </Part>
      <Part name="saucer" position={[-1.0, 0.028, 1.7]}>
        <Cylinder
          radius={0.49}
          height={0.045}
          color={palette.cream}
          metal={0.1}
        />
        <Cylinder
          position={[0, 0.023, 0]}
          radius={0.32}
          height={0.017}
          color="#c9bca4"
          metal={0.1}
        />
      </Part>
      <Part name="cup" position={[0.3, 0.065, 2.0]}>
        <Cup />
        <CoffeeSurface />
      </Part>
      <Part name="pitcher" position={[-0.2, 0.05, 0.45]}>
        <mesh position={[0, 0.27, 0]} castShadow>
          <cylinderGeometry args={[0.21, 0.25, 0.48, 40, 1, true]} />
          <meshStandardMaterial
            color="#a7a39b"
            metalness={0.95}
            roughness={0.22}
            side={2}
          />
        </mesh>
        <mesh position={[0.26, 0.27, 0]}>
          <torusGeometry args={[0.16, 0.023, 8, 24]} />
          <meshStandardMaterial
            color={palette.steel}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      </Part>
      <Part name="tamper" position={[-0.8, 0.04, 0.7]}>
        <Cylinder radius={0.17} height={0.08} />
        <Cylinder
          position={[0, 0.15, 0]}
          radius={0.075}
          height={0.24}
          color={palette.wood}
          metal={0.02}
        />
        <mesh position={[0, 0.27, 0]}>
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshStandardMaterial color={palette.wood} roughness={0.5} />
        </mesh>
      </Part>
      <Block
        position={[2.9, 0.017, 1.3]}
        size={[1.05, 0.026, 0.7]}
        color="#827461"
        metal={0}
        rough={1}
        radius={0.01}
      />
      {Array.from({ length: 5 }, (_, i) => (
        <Block
          key={i}
          position={[2.48 + i * 0.04, 0.034, 1.3]}
          size={[0.012, 0.003, 0.68]}
          color="#3b342a"
          metal={0}
          radius={0.001}
        />
      ))}
    </group>
  );
}
