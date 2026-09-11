import * as T from "three";
export class StreetPost {
  private target = new T.WebGLRenderTarget(1, 1, { depthBuffer: true });
  private scene = new T.Scene();
  private camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material: T.ShaderMaterial;
  private size = new T.Vector2();
  constructor() {
    this.target.depthTexture = new T.DepthTexture(1, 1, T.UnsignedIntType);
    this.material = new T.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        colorTexture: { value: this.target.texture },
        depthTexture: { value: this.target.depthTexture },
        resolution: { value: new T.Vector2(1, 1) },
        near: { value: 0.1 },
        far: { value: 20000 },
      },
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader: `varying vec2 vUv;uniform sampler2D colorTexture;uniform sampler2D depthTexture;uniform vec2 resolution;uniform float near;uniform float far;
 float depth(vec2 uv){float z=texture2D(depthTexture,uv).x;return near*far/(far-z*(far-near));}
 void main(){float d=depth(vUv);vec2 pixel=1./resolution;float blur=min(.8,abs(d-18.)/180.);vec3 color=texture2D(colorTexture,vUv).rgb*.4;float ao=0.;for(int i=0;i<4;i++){float angle=float(i)*1.5707963;vec2 delta=vec2(cos(angle),sin(angle))*pixel;float other=depth(vUv+delta*3.);ao+=step(.03,d-other)*(1.-smoothstep(.15,1.8,d-other));color+=texture2D(colorTexture,vUv+delta*blur).rgb*.15;}color*=1.-ao*.035;gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
    });
    this.scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), this.material));
  }
  render(
    renderer: T.WebGLRenderer,
    scene: T.Scene,
    camera: T.PerspectiveCamera,
  ) {
    renderer.getDrawingBufferSize(this.size);
    const w = Math.floor(this.size.x),
      h = Math.floor(this.size.y);
    if (this.target.width !== w || this.target.height !== h) {
      this.target.setSize(w, h);
      this.material.uniforms.resolution.value.set(w, h);
    }
    this.material.uniforms.near.value = camera.near;
    this.material.uniforms.far.value = camera.far;
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.target.dispose();
    this.material.dispose();
    (this.scene.children[0] as T.Mesh).geometry.dispose();
  }
}
