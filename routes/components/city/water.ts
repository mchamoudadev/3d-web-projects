import * as T from "three";
import { oceanPolygon } from "@/lib/coast";
import { toWorld } from "@/lib/geo";
import { MeshBuilder } from "./geometry";
export function ocean(
  coast: GeoJSON.FeatureCollection,
  time: { value: number },
  night: { value: number },
) {
  const feature = oceanPolygon(coast),
    builder = new MeshBuilder();
  builder.polygon(
    (feature.geometry as GeoJSON.Polygon).coordinates.map((r) =>
      r.map(toWorld),
    ),
    -0.03,
    new T.Color("white"),
  );
  const data = builder.finish(),
    geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.BufferAttribute(data.position, 3));
  const material = new T.ShaderMaterial({
    side: T.DoubleSide,
    uniforms: { uTime: time, uNight: night },
    vertexShader: `varying vec3 vWorld; void main(){vWorld=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uTime;uniform float uNight;varying vec3 vWorld;void main(){vec2 p=vWorld.xz;float w=sin(p.x*.025+p.y*.07+uTime*.7)*sin(p.y*.09-uTime*.4);float fine=sin(p.x*.5+p.y*.7+uTime)*sin(p.y*.39-uTime);vec3 view=normalize(cameraPosition-vWorld);float fresnel=pow(1.-max(view.y,0.),3.);float glint=pow(max(0.,w*.65+fine*.35),16.)*pow(max(0.,dot(normalize(vec3(-.6,.2,.5)),reflect(-view,normalize(vec3(w*.08,1.,fine*.08))))),12.);vec3 color=mix(vec3(.035,.19,.24),vec3(.2,.38,.43),fresnel)+vec3(.8,.57,.28)*glint*.6;color*=1.-uNight*.78;float fog=1.-exp(-length(cameraPosition-vWorld)*.0002);gl_FragColor=vec4(mix(color,mix(vec3(.44,.44,.39),vec3(.07,.09,.12),uNight),fog*.8),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
  });
  const root = new T.Group();
  root.add(new T.Mesh(geometry, material));
  const foam = new MeshBuilder();
  for (const f of coast.features) {
    if (f.geometry.type !== "LineString") continue;
    const points = f.geometry.coordinates.map(toWorld);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz) || 1;
      foam.quad(
        [a[0], 0.025, a[1]],
        [b[0], 0.025, b[1]],
        [b[0] - (dz / len) * 2, 0.025, b[1] + (dx / len) * 2],
        [a[0] - (dz / len) * 2, 0.025, a[1] + (dx / len) * 2],
        new T.Color("#bac6b8"),
      );
    }
  }
  const fd = foam.finish(),
    fg = new T.BufferGeometry();
  fg.setAttribute("position", new T.BufferAttribute(fd.position, 3));
  const fm = new T.MeshBasicMaterial({
    color: "#c2cebb",
    transparent: true,
    opacity: 0.32,
    side: T.DoubleSide,
    depthWrite: false,
  });
  root.add(new T.Mesh(fg, fm));
  return root;
}
