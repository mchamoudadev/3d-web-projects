import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from "three";
import { sampleAction, ease } from "@/config/choreography";
import { useProgress } from "@/store/progress";
import { useSetParts } from "@/hooks/useSetParts";
import type { Vec3 } from "@/config/timeline";
const liquidVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const liquidFragment = `varying vec2 vUv; uniform float uProgress; uniform float uMilk;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float a=atan(p.y,p.x)+uProgress*2.;float n=noise(vec2(a*4.,r*14.)+uProgress*5.);vec3 c=mix(vec3(.19,.065,.018),vec3(.70,.40,.13),n*.8+.18);c=mix(c,vec3(.83,.60,.30),smoothstep(.72,.98,r)*.65);float leaf=abs(p.x)-(.27+.08*sin(p.y*37.))*sqrt(max(0.,1.-pow(p.y*1.7,2.)));float pattern=(1.-smoothstep(-.012,.02,leaf))*(1.-smoothstep(.49,.65,abs(p.y)));float stripes=.65+.35*sin(p.y*50.+abs(p.x)*18.);float stem=1.-smoothstep(.015,.028,abs(p.x));float art=max(pattern*stripes,stem*(1.-smoothstep(.52,.66,abs(p.y))));c=mix(c,vec3(.94,.86,.69),art*uMilk);gl_FragColor=vec4(c,1.);}`;
export function CoffeeSurface() {
  const mesh = useRef<Mesh>(null),
    material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uMilk: { value: 0 } }),
    [],
  );
  const q = useMemo(
    () => new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2),
    [],
  );
  useFrame(() => {
    if (!mesh.current || !material.current) return;
    const p = useProgress.getState().progress,
      a = sampleAction(p);
    mesh.current.visible = a.fill > 0.001;
    mesh.current.position.y = 0.075 + 0.24 * a.fill;
    mesh.current.scale.setScalar(0.78 + 0.2 * a.fill);
    mesh.current.quaternion
      .setFromAxisAngle(new Vector3(0, 0, 1), -a.cupTilt)
      .multiply(q);
    material.current.uniforms.uProgress.value = p;
    material.current.uniforms.uMilk.value = ease((p - 0.675) / 0.03);
  });
  return (
    <mesh name="coffeeSurface" ref={mesh}>
      <circleGeometry args={[0.269, 64]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={liquidVertex}
        fragmentShader={liquidFragment}
      />
    </mesh>
  );
}
export default function BrewAction() {
  const steamMaterial = useRef<ShaderMaterial>(null);
  const parts = useSetParts(),
    grounds = useRef<InstancedMesh>(null),
    stream = useRef<Group>(null),
    milk = useRef<Mesh>(null),
    steam = useRef<Group>(null);
  const work = useMemo(
    () => ({
      point: new Vector3(),
      dummy: new Object3D(),
      up: new Vector3(0, 1, 0),
    }),
    [],
  );
  const steamGeo = useMemo(() => {
    const g = new BufferGeometry();
    const pts = [];
    for (let i = 0; i < 90; i++)
      pts.push(
        Math.sin(i * 79.1) * 0.15,
        (i % 30) / 30,
        Math.cos(i * 51.7) * 0.15,
      );
    g.setAttribute("position", new Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const steamUniforms = useMemo(() => ({ uProgress: { value: 0 } }), []);
  function move(
    name: "cup" | "portafilter" | "basket" | "tamper" | "pitcher",
    point: Vec3,
  ) {
    const part = parts.get(name);
    if (!part) return;
    part.parent?.updateWorldMatrix(true, false);
    work.point.set(...point);
    part.parent?.worldToLocal(work.point);
    part.position.copy(work.point);
    return part;
  }
  useFrame(() => {
    const p = useProgress.getState().progress,
      a = sampleAction(p);
    const cup = move("cup", a.cup);
    if (cup) cup.rotation.set(0, 0, a.cupTilt);
    const filter = move("portafilter", a.filter);
    if (filter) filter.rotation.set(0, a.filterTurn, 0);
    move("basket", [a.filter[0], a.filter[1] + 0.07, a.filter[2]]);
    move("tamper", a.tamper);
    const pitcher = move("pitcher", a.pitcher);
    if (pitcher) pitcher.rotation.set(0, 0, a.pitcherTilt);
    const button = parts.get("brewButton");
    button?.traverse((node) => {
      if (
        node instanceof Mesh &&
        node.material instanceof MeshStandardMaterial
      ) {
        node.material.emissive.set("#ff6a1f");
        node.material.emissiveIntensity = p > 0.388 && p < 0.61 ? 0.75 : 0;
      }
    });
    if (grounds.current) {
      grounds.current.visible = p > 0.102 && p < 0.172;
      for (let i = 0; i < 1200; i++) {
        const phase = (i * 0.618033 + p * 33) % 1;
        work.dummy.position.set(
          -1.6 + Math.sin(i * 72.7) * 0.07,
          0.94 - phase * 0.25,
          -0.27 + Math.cos(i * 13.3) * 0.07,
        );
        work.dummy.scale.setScalar(0.006 + (i % 4) * 0.001);
        work.dummy.updateMatrix();
        grounds.current.setMatrixAt(i, work.dummy.matrix);
      }
      grounds.current.instanceMatrix.needsUpdate = true;
    }
    if (stream.current) {
      stream.current.visible = p > 0.444 && p < 0.601;
      const bottom = 0.465 + 0.24 * a.fill;
      stream.current.position.y = (0.91 + bottom) / 2;
      stream.current.scale.y = 0.91 - bottom;
    }
    if (milk.current) {
      milk.current.visible = p > 0.678 && p < 0.708;
      const end = new Vector3(a.cup[0], a.cup[1] + 0.32, a.cup[2]),
        start = new Vector3(
          a.pitcher[0] -
            0.21 * Math.cos(a.pitcherTilt) -
            0.48 * Math.sin(a.pitcherTilt),
          a.pitcher[1] -
            0.21 * Math.sin(a.pitcherTilt) +
            0.48 * Math.cos(a.pitcherTilt),
          a.pitcher[2],
        );
      milk.current.position.copy(start).add(end).multiplyScalar(0.5);
      work.point.subVectors(end, start);
      milk.current.scale.y = work.point.length();
      milk.current.quaternion.setFromUnitVectors(
        work.up,
        work.point.normalize(),
      );
    }
    if (steam.current) {
      steam.current.visible = p > 0.616 && p < 0.674;
      if (steamMaterial.current)
        steamMaterial.current.uniforms.uProgress.value = p;
    }
  }, -2);
  return (
    <>
      <instancedMesh ref={grounds} args={[undefined, undefined, 1200]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#4d2b14" roughness={1} />
      </instancedMesh>
      <group ref={stream} position={[1.4, 0.8, -0.11]}>
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.018, 1, 12]} />
            <meshStandardMaterial
              color="#9d5420"
              roughness={0.22}
              metalness={0.1}
            />
          </mesh>
        ))}
      </group>
      <mesh ref={milk}>
        <cylinderGeometry args={[0.012, 0.018, 1, 12]} />
        <meshStandardMaterial color="#eadbc1" roughness={0.2} />
      </mesh>
      <group ref={steam} position={[2.15, 0.73, 0.17]}>
        <points geometry={steamGeo}>
          <shaderMaterial
            transparent
            depthWrite={false}
            ref={steamMaterial}
            uniforms={steamUniforms}
            vertexShader={`uniform float uProgress;varying float vAlpha;void main(){vec3 p=position;p.y=mod(p.y+uProgress*9.,1.);p.x+=sin(p.y*7.+uProgress*20.)*.1;vAlpha=(1.-p.y)*.22;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=110./-mv.z;}`}
            fragmentShader={`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.88,.81,.69,smoothstep(.5,.0,d)*vAlpha);}`}
          />
        </points>
      </group>
    </>
  );
}
