import { Color, MeshStandardMaterial } from "three";
import { MeshBuilder, hash, type Road } from "./geometry";
import { buildingHeight } from "../Buildings";
import { segmentDistance } from "@/lib/geo";
import { roofGeometry } from "./roofs";
export function extrudeBuilding(
  mesh: MeshBuilder,
  rings: number[][][],
  tags: Record<string, unknown>,
  id: number,
  roads: Road[],
  oldTown: boolean,
) {
  const outer = rings[0];
  if (!outer?.length) return null;
  const x = outer.reduce((s, p) => s + p[0], 0) / outer.length,
    z = outer.reduce((s, p) => s + p[1], 0) / outer.length,
    seed = hash(id);
  const major = roads.some(
    (r) =>
      r.major &&
      r.points.some(
        (p, i) =>
          i && segmentDistance([x, z], r.points[i - 1], p).distance < 25,
      ),
  );
  let height = buildingHeight(tags, Number(tags.area) || 80, major);
  if (tags.amenity === "hospital") height = Math.max(height, 14);
  if (!tags.height && !tags.levels) height *= 0.9 + seed * 0.22;
  const palette = oldTown
    ? ["#ddcfb1", "#c8b294", "#e7dabe", "#bbb095", "#c4beaf"]
    : ["#b5b8b0", "#b6c6c6", "#cabd9f", "#d4c5b2", "#9eaaa7", "#adb9c2"];
  let color = new Color(palette[Math.floor(seed * palette.length)]);
  if (
    typeof tags.colour === "string" &&
    (/^#[\da-f]{6}$/i.test(tags.colour) || tags.colour in Color.NAMES)
  )
    color = new Color(tags.colour);
  const shape = String(tags.roof_shape || "flat");
  const pitched = [
    "gabled",
    "hipped",
    "pyramidal",
    "skillion",
    "round",
    "dome",
  ].includes(shape);
  const roofRise = pitched
    ? Math.min(
        8,
        Number(tags.roof_height) ||
          Math.max(
            1.2,
            Math.min(3.5, Math.sqrt(Number(tags.area) || 80) * 0.15),
          ),
      )
    : 0;
  const wallHeight = tags.height ? Math.max(2, height - roofRise) : height;
  const roofPalette = [
    "#c6bba4",
    "#b8b9b1",
    "#acaeae",
    "#c2c3ba",
    "#b99882",
    "#a5afb0",
  ];
  let roofColor = new Color(
    roofPalette[Math.floor(hash(id + 291) * roofPalette.length)],
  );
  if (
    typeof tags.roof_colour === "string" &&
    (/^#[\da-f]{6}$/i.test(tags.roof_colour) || tags.roof_colour in Color.NAMES)
  )
    roofColor = new Color(tags.roof_colour);
  if (pitched)
    roofGeometry(mesh, rings, wallHeight, roofRise, shape, roofColor);
  else mesh.polygon(rings, height, roofColor);
  for (const ring of rings)
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1],
        b = ring[i],
        width = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (width < 0.1) continue;
      mesh.quad(
        [a[0], 0, a[1]],
        [b[0], 0, b[1]],
        [b[0], wallHeight + (pitched ? 0 : 0.3), b[1]],
        [a[0], wallHeight + (pitched ? 0 : 0.3), a[1]],
        color,
        width,
        wallHeight + (pitched ? 0 : 0.3),
      );
    }
  return {
    x,
    z,
    height: pitched ? wallHeight + roofRise : height,
    seed,
    pitched,
  };
}
export function facadeMaterial(night: { value: number }) {
  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    side: 2,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = night;
    shader.vertexShader =
      "varying vec2 vFacadeUV; varying vec3 vFacadeNormal;\n" +
      shader.vertexShader.replace(
        "#include <uv_vertex>",
        "#include <uv_vertex>\nvFacadeUV=uv;vFacadeNormal=normal;",
      );
    shader.fragmentShader =
      "uniform float uNight;varying vec2 vFacadeUV;varying vec3 vFacadeNormal;\n" +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
 float wall=1.-step(.15,abs(vFacadeNormal.y));
 float seed=fract(dot(diffuseColor.rgb,vec3(17.13,31.71,13.17)));
 vec2 period=vec2(mix(2.8,4.6,seed),mix(3.1,3.6,seed));
 vec2 grid=vFacadeUV/period, cell=fract(grid), aa=max(fwidth(grid),vec2(.002));
 float detail=1.-smoothstep(.12,.45,max(aa.x,aa.y));
 float windowMask=smoothstep(.27-aa.x,.27+aa.x,cell.x)*(1.-smoothstep(.7-aa.x,.7+aa.x,cell.x))*smoothstep(.4-aa.y,.4+aa.y,cell.y)*(1.-smoothstep(.76-aa.y,.76+aa.y,cell.y))*wall*detail;
 float noise=fract(dot(floor(grid),vec2(.137,.731))+seed*31.);
 float trim=smoothstep(.94-aa.y,.94+aa.y,cell.y)*wall*detail;
 float sill=smoothstep(.34-aa.y,.34+aa.y,cell.y)*(1.-smoothstep(.4-aa.y,.4+aa.y,cell.y))*step(.22,cell.x)*step(cell.x,.75)*wall*detail;
 float door=step(.44,cell.x)*step(cell.x,.75)*step(vFacadeUV.y,2.25)*step(.7,noise)*wall*detail;
 float wear=sin(vFacadeUV.x*1.7+seed*41.)*sin(vFacadeUV.y*.43+seed*7.);
 diffuseColor.rgb*=1.-trim*.08+wear*.025;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.16,.23,.25),windowMask*.72);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.25,.32,.31),door*.8);
 diffuseColor.rgb+=sill*.08;
 diffuseColor.rgb*=mix(.82,1.,smoothstep(0.,1.5,vFacadeUV.y)*wall+1.-wall);
 `,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
 totalEmissiveRadiance+=vec3(1.,.65,.28)*windowMask*step(.48,noise)*uNight*1.8;`,
      );
  };
  return material;
}
