import { useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { Part } from "@/hooks/useSetParts";
import { Block, Cylinder, palette } from "./Placeholder";
function Badge({ dial = false }: { dial?: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = dial ? 512 : 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = dial ? "#e7dcc5" : "#25211c";
    ctx.fillRect(0, 0, 512, canvas.height);
    ctx.fillStyle = dial ? "#514635" : "#cbb38b";
    ctx.textAlign = "center";
    if (dial) {
      ctx.translate(0, 120);
      for (let i = 0; i <= 24; i++) {
        const a = Math.PI * (0.85 + (i / 24) * 1.3);
        ctx.beginPath();
        ctx.moveTo(256 + Math.cos(a) * 95, 135 + Math.sin(a) * 95);
        ctx.lineTo(
          256 + Math.cos(a) * (i % 4 === 0 ? 75 : 86),
          135 + Math.sin(a) * (i % 4 === 0 ? 75 : 86),
        );
        ctx.strokeStyle = "#514635";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.font = "23px monospace";
      ctx.fillText("BAR", 256, 189);
      ctx.beginPath();
      ctx.moveTo(256, 135);
      ctx.lineTo(190, 88);
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(256, 135, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.font = "italic 108px Georgia";
      ctx.fillText("9 bar", 256, 133);
      ctx.font = "16px monospace";
      ctx.fillText("PRECISION IN EVERY DROP", 256, 190);
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [dial]);
  return (
    <mesh>
      {dial ? (
        <circleGeometry args={[0.195, 48]} />
      ) : (
        <planeGeometry args={[0.72, 0.36]} />
      )}
      <meshStandardMaterial map={texture} roughness={0.5} metalness={0.2} />
    </mesh>
  );
}
export default function Machine() {
  return (
    <group position={[1.4, 0, -0.45]} name="espressoMachine">
      <Part name="body">
        <Block
          position={[0, 1.15, -0.43]}
          size={[2.32, 2.04, 0.66]}
          color={palette.black}
          rough={0.32}
        />
        <Block position={[0, 1.82, 0.01]} size={[2.23, 0.64, 0.62]} />
        <Block
          position={[0, 1.48, 0.03]}
          size={[2.14, 0.04, 0.65]}
          color={palette.brass}
        />
        <Block
          position={[0, 0.78, -0.03]}
          size={[2.06, 1.15, 0.08]}
          color="#645e55"
        />
        <Block
          position={[0, 2.19, -0.14]}
          size={[2.5, 0.1, 1.08]}
          color={palette.black}
        />
        <Block
          position={[0, 2.24, 0.34]}
          size={[2.5, 0.035, 0.04]}
          color={palette.brass}
          radius={0.008}
        />
        <group position={[-0.32, 1.85, 0.332]}>
          <Badge />
        </group>
        <Cylinder
          position={[0.68, 1.85, 0.35]}
          radius={0.225}
          height={0.045}
          color={palette.brass}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <group position={[0.68, 1.85, 0.378]}>
          <Badge dial />
        </group>
        {[-1.02, 1.02].map((x) => (
          <Cylinder
            key={x}
            position={[x, 0.07, -0.22]}
            radius={0.1}
            height={0.14}
            color={palette.black}
          />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <Block
            key={i}
            position={[-0.82 + i * 0.15, 2.27, -0.2]}
            size={[0.025, 0.025, 0.7]}
            color={palette.steel}
            radius={0.006}
          />
        ))}
      </Part>
      <Part name="sidePanelL" position={[-1.15, 1.2, -0.2]}>
        <Block
          size={[0.15, 1.94, 0.92]}
          color={palette.wood}
          rough={0.5}
          metal={0.05}
        />
      </Part>
      <Part name="sidePanelR" position={[1.15, 1.2, -0.2]}>
        <Block
          size={[0.15, 1.94, 0.92]}
          color={palette.wood}
          rough={0.5}
          metal={0.05}
        />
      </Part>
      <Part name="dripTray">
        <Block
          position={[0, 0.2, 0.23]}
          size={[2.48, 0.23, 1.24]}
          color={palette.black}
        />
        <Block position={[0, 0.33, 0.25]} size={[2.35, 0.045, 1.12]} />
        {Array.from({ length: 19 }, (_, i) => (
          <Block
            key={i}
            position={[-1.03 + i * 0.114, 0.357, 0.25]}
            size={[0.043, 0.012, 0.97]}
            color="#25221e"
            radius={0.004}
          />
        ))}
        <Block
          position={[0, 0.21, 0.86]}
          size={[2.3, 0.08, 0.018]}
          color={palette.brass}
          radius={0.008}
        />
      </Part>
      <Part name="groupHead" position={[0, 1.3, 0.28]}>
        <Cylinder radius={0.3} height={0.2} />
        <Cylinder
          position={[0, -0.13, 0]}
          radius={0.24}
          height={0.09}
          color={palette.brass}
        />
      </Part>
      <Part name="basket" position={[0, 1.14, 0.28]}>
        <Cylinder radius={0.21} height={0.07} color="#4a3321" />
      </Part>
      <Part name="portafilter" position={[0, 1.07, 0.28]}>
        <Cylinder radius={0.235} height={0.1} />
        <Cylinder
          position={[0, 0, 0.39]}
          rotation={[Math.PI / 2, 0, 0]}
          radius={0.07}
          height={0.72}
          color={palette.wood}
          metal={0.05}
        />
        {[-0.09, 0.09].map((x) => (
          <Cylinder
            key={x}
            position={[x, -0.1, 0.06]}
            radius={0.035}
            height={0.13}
          />
        ))}
      </Part>
      <Part name="brewButton" position={[-0.81, 1.8, 0.36]}>
        <Cylinder
          radius={0.08}
          height={0.04}
          color={palette.brass}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Cylinder
          radius={0.045}
          height={0.045}
          color="#25221e"
          rotation={[Math.PI / 2, 0, 0]}
        />
      </Part>
      <Part name="steamWand" position={[0.86, 1.15, 0.32]}>
        <Cylinder radius={0.055} height={0.58} rotation={[0, 0, -0.22]} />
        <Cylinder
          position={[0.11, -0.37, 0]}
          radius={0.035}
          height={0.3}
          rotation={[0, 0, -0.38]}
        />
        <Cylinder
          position={[0, 0.3, 0]}
          radius={0.12}
          height={0.14}
          color={palette.wood}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </Part>
      <Part name="boiler" position={[0, 1.48, -0.45]}>
        <Cylinder
          radius={0.38}
          height={0.8}
          color="#9b6840"
          rotation={[0, 0, Math.PI / 2]}
        />
      </Part>
      <Part name="heatingElement" position={[0, 1.4, -0.4]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.23, 0.025, 8, 32]} />
          <meshStandardMaterial
            color="#65321b"
            emissive="#ff6a1f"
            emissiveIntensity={0.2}
          />
        </mesh>
      </Part>
      <Part name="pump" position={[0.75, 0.75, -0.45]}>
        <Cylinder radius={0.14} height={0.4} color={palette.brass} />
      </Part>
      <Part name="reservoir" position={[-0.73, 1.18, -0.48]}>
        <Block
          size={[0.32, 0.9, 0.35]}
          color="#727e78"
          rough={0.16}
          metal={0.2}
        />
      </Part>
    </group>
  );
}
