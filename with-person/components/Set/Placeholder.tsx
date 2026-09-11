import { RoundedBox } from "@react-three/drei";
import type { Vec3 } from "@/config/timeline";
export const palette = {
  steel: "#9e9690",
  brass: "#b8935a",
  black: "#211e1a",
  cream: "#e8dcc5",
  wood: "#382419",
  hands: "#b99779",
};
export function Block({
  position = [0, 0, 0],
  size = [1, 1, 1],
  color = palette.steel,
  metal = 0.8,
  rough = 0.27,
  radius = 0.04,
}: {
  position?: Vec3;
  size?: Vec3;
  color?: string;
  metal?: number;
  rough?: number;
  radius?: number;
}) {
  return (
    <RoundedBox
      args={size}
      radius={Math.min(radius, ...size.map((v) => v * 0.45))}
      smoothness={2}
      position={position}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </RoundedBox>
  );
}
export function Cylinder({
  position = [0, 0, 0],
  radius = 0.15,
  height = 0.2,
  color = palette.steel,
  metal = 0.8,
  rotation = [0, 0, 0],
}: {
  position?: Vec3;
  radius?: number;
  height?: number;
  color?: string;
  metal?: number;
  rotation?: Vec3;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, 40]} />
      <meshStandardMaterial color={color} metalness={metal} roughness={0.28} />
    </mesh>
  );
}
