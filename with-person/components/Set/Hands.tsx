import { useMemo } from "react";
import { LatheGeometry, Vector2 } from "three";
import { Part } from "@/hooks/useSetParts";
import { useHands } from "@/hooks/useHands";
import { Block, Cylinder } from "./Placeholder";
const skin = "#b18565";
function Arm({ side, shirt }: { side: "L" | "R"; shirt: string }) {
  return (
    <group>
      <mesh name={`upper${side}`} castShadow>
        <cylinderGeometry args={[0.155, 0.14, 1, 12]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      <mesh name={`sleeve${side}`} castShadow>
        <cylinderGeometry args={[0.205, 0.18, 1, 12]} />
        <meshStandardMaterial color={shirt} roughness={1} />
      </mesh>
      <mesh name={`lower${side}`} castShadow>
        <cylinderGeometry args={[0.125, 0.085, 1, 12]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      <group name={`palm${side}`}>
        <mesh scale={[1, 0.53, 1.18]} castShadow>
          <sphereGeometry args={[0.125, 10, 8]} />
          <meshStandardMaterial color={skin} roughness={1} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <group
            key={i}
            position={[-0.09 + i * 0.06, 0, 0.1]}
            rotation={[0.4, 0, 0]}
          >
            <mesh
              position={[0, 0, 0.04]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <capsuleGeometry args={[0.027, 0.08, 3, 6]} />
              <meshStandardMaterial color={skin} roughness={1} />
            </mesh>
            <mesh position={[0, -0.035, 0.1]} rotation={[0.25, 0, 0]}>
              <capsuleGeometry args={[0.024, 0.055, 3, 6]} />
              <meshStandardMaterial color={skin} roughness={1} />
            </mesh>
          </group>
        ))}
        <mesh position={[-0.14, -0.012, 0.025]} rotation={[0.8, 0, -0.75]}>
          <capsuleGeometry args={[0.035, 0.1, 3, 6]} />
          <meshStandardMaterial color={skin} roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
function Human({ customer = false }: { customer?: boolean }) {
  const torso = useMemo(
    () =>
      new LatheGeometry(
        [
          [0.39, 0],
          [0.45, 0.15],
          [0.5, 1],
          [0.61, 1.85],
          [0.6, 2.05],
          [0.43, 2.22],
          [0.2, 2.28],
        ].map((p) => new Vector2(...p)),
        24,
      ),
    [],
  );
  const shirt = customer ? "#8f4d35" : "#d2c4ac";
  const hair = customer ? "#3b2318" : "#241c15";
  return (
    <group name={customer ? "customerPerson" : "baristaPerson"}>
      <mesh geometry={torso} scale={[1, 1, 0.62]} castShadow>
        <meshStandardMaterial color={shirt} roughness={1} />
      </mesh>
      <mesh position={[0, 2.43, 0]} castShadow>
        <capsuleGeometry args={[0.145, 0.3, 5, 12]} />
        <meshStandardMaterial color={skin} roughness={1} />
      </mesh>
      {!customer && (
        <group>
          <Block
            position={[0, 1.12, 0.415]}
            size={[0.92, 1.76, 0.055]}
            color="#4a5140"
            metal={0}
            rough={1}
            radius={0.025}
          />
          {[-0.32, 0.32].map((x) => (
            <Block
              key={x}
              position={[x, 2.03, 0.39]}
              size={[0.08, 0.64, 0.055]}
              color="#4a5140"
              metal={0}
              rough={1}
              radius={0.01}
            />
          ))}
          <Block
            position={[0, 0.8, 0.456]}
            size={[0.59, 0.36, 0.026]}
            color="#626750"
            metal={0}
            rough={1}
            radius={0.018}
          />
          <Block
            position={[0.22, 1.8, 0.456]}
            size={[0.19, 0.09, 0.025]}
            color="#b8935a"
            metal={0.3}
            rough={0.7}
            radius={0.005}
          />
        </group>
      )}
      <group name="head" position={[0, 2.96, 0]}>
        <mesh scale={[0.86, 1.08, 0.9]} castShadow>
          <sphereGeometry args={[0.42, 16, 12]} />
          <meshStandardMaterial color={skin} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.24, -0.06]} scale={[1, 0.8, 1]} castShadow>
          <sphereGeometry
            args={[0.385, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.67]}
          />
          <meshStandardMaterial color={hair} roughness={1} />
        </mesh>
        {customer && (
          <mesh position={[0, 0.1, -0.23]} scale={[0.98, 1.08, 0.72]}>
            <sphereGeometry args={[0.39, 12, 10]} />
            <meshStandardMaterial color={hair} roughness={1} />
          </mesh>
        )}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.356, -0.01, 0]} scale={[0.5, 1, 0.7]}>
              <sphereGeometry args={[0.115, 10, 8]} />
              <meshStandardMaterial color={skin} roughness={1} />
            </mesh>
            <mesh position={[side * 0.14, 0.055, 0.331]} scale={[1, 0.5, 0.35]}>
              <sphereGeometry args={[0.065, 12, 8]} />
              <meshStandardMaterial color="#ded3ba" roughness={0.7} />
            </mesh>
            <mesh position={[side * 0.14, 0.053, 0.352]}>
              <sphereGeometry args={[0.027, 10, 8]} />
              <meshStandardMaterial color="#302018" roughness={0.6} />
            </mesh>
            <mesh
              position={[side * 0.14, 0.139, 0.332]}
              rotation={[0, 0, Math.PI / 2 + side * -0.09]}
            >
              <capsuleGeometry args={[0.016, 0.096, 3, 8]} />
              <meshStandardMaterial color={hair} roughness={1} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.035, 0.367]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.064, 0.145, 5]} />
          <meshStandardMaterial color={skin} roughness={1} />
        </mesh>
        <mesh position={[0, -0.173, 0.337]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.018, 0.11, 3, 8]} />
          <meshStandardMaterial color="#6c4231" roughness={1} />
        </mesh>
        {!customer && (
          <mesh position={[0, -0.28, 0.065]} scale={[0.88, 0.47, 0.93]}>
            <sphereGeometry
              args={[
                0.35,
                14,
                8,
                0,
                Math.PI * 2,
                Math.PI * 0.15,
                Math.PI * 0.85,
              ]}
            />
            <meshStandardMaterial color="#453022" roughness={1} />
          </mesh>
        )}
      </group>
      {[-0.28, 0.28].map((x) => (
        <group key={x}>
          <mesh position={[x, -0.98, 0]} castShadow>
            <capsuleGeometry args={[0.24, 1.8, 5, 12]} />
            <meshStandardMaterial color="#292a26" roughness={1} />
          </mesh>
          <Block
            position={[x, -2.05, 0.14]}
            size={[0.4, 0.26, 0.66]}
            color="#29221c"
            metal={0}
            rough={0.9}
          />
        </group>
      ))}
      <Part name={customer ? "viewerHands" : "baristaHands"}>
        <Arm side="L" shirt={shirt} />
        <Arm side="R" shirt={shirt} />
      </Part>
      {customer && (
        <group position={[0, -1.55, -0.15]}>
          <Cylinder radius={0.48} height={0.14} color="#513821" metal={0} />
          <Cylinder
            position={[0, -0.5, 0]}
            radius={0.06}
            height={1.0}
            color="#4b4540"
          />
        </group>
      )}
    </group>
  );
}
export default function Hands() {
  useHands();
  return (
    <>
      <Part name="barista" position={[-0.65, 0, -1.25]}>
        <Human />
      </Part>
      <Part
        name="customer"
        position={[-2.8, 0, 1.8]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <group scale={0.82}>
          <Human customer />
        </group>
      </Part>
    </>
  );
}
