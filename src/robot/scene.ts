import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/*
 * Open Duck Mini v2 replaying a recorded MuJoCo walking rollout on a treadmill.
 * Data comes from public/robot/duck.{json,bin} (see README). Scroll progress
 * drives the camera through three beats: walk → joints → signal.
 */

type MeshMeta = { name: string; v: [number, number]; f: [number, number]; u32: boolean };
type Meta = {
  fps: number;
  frames: number;
  treadmillSpeed: number;
  meshes: MeshMeta[];
  geoms: { mesh: number; body: string }[];
  joints: string[];
  offsets: { frames: number; jointFrames: number; angles: number };
};

export type Label = { x: number; y: number; on: boolean; deg: number };
export type FrameInfo = { frame: number; frames: number; labels: Label[] };

export type RobotScene = {
  sampleAngle: (joint: number, t: number) => number;
  angleRange: (joint: number) => [number, number];
  jointNames: string[];
  dispose: () => void;
};

type Key = { p: number; r: number; theta: number; phi: number; look: [number, number, number]; off: [number, number] };

// camera beats, spherical around the look target (theta from +X toward +Z, phi from horizon)
const KEYS: Key[] = [
  { p: 0.0, r: 1.45, theta: 0.92, phi: 0.17, look: [0, 0.21, 0], off: [-0.2, 0.02] },
  { p: 0.12, r: 1.36, theta: 1.02, phi: 0.15, look: [0, 0.21, 0], off: [-0.2, 0.02] },
  { p: 0.34, r: 0.64, theta: 1.36, phi: 0.07, look: [0.0, 0.13, 0], off: [0.14, 0] },
  { p: 0.52, r: 0.6, theta: 1.64, phi: 0.12, look: [0.0, 0.14, 0], off: [0.14, 0] },
  { p: 0.66, r: 1.55, theta: 2.3, phi: 0.3, look: [0, 0.22, 0], off: [-0.19, 0.12] },
  { p: 0.88, r: 1.6, theta: 2.5, phi: 0.34, look: [0, 0.22, 0], off: [-0.19, 0.12] },
  { p: 1.0, r: 2.4, theta: 2.7, phi: 1.0, look: [0, 0.05, 0], off: [-0.05, 0.1] },
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function camAt(p: number, portrait: boolean) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = smooth(clamp01((p - a.p) / (b.p - a.p)));
  const k = {
    r: lerp(a.r, b.r, t),
    theta: lerp(a.theta, b.theta, t),
    phi: lerp(a.phi, b.phi, t),
    look: a.look.map((v, j) => lerp(v, b.look[j], t)) as [number, number, number],
    off: [lerp(a.off[0], b.off[0], t), lerp(a.off[1], b.off[1], t)] as [number, number],
  };
  if (portrait) {
    // phones: robot below the text, then below the caption, then between caption and scope
    const toJoints = smooth(clamp01((p - 0.12) / 0.2));
    const toSignal = smooth(clamp01((p - 0.52) / 0.14));
    k.r *= lerp(lerp(1.95, 1.8, toJoints), 2.2, toSignal);
    k.off = [0, lerp(lerp(-0.25, -0.2, toJoints), -0.02, toSignal)];
  }
  return k;
}

const PALETTE: [RegExp, number, number, number][] = [
  // pattern, color, roughness, metalness
  [/antenna$/, 0x5eead4, 0.35, 0.1],
  [/tpu/, 0x16191e, 0.9, 0.0],
  [/neck|head_bot/, 0xb7bec8, 0.5, 0.1],
  [/sheet|spacer|motor/, 0x2c313a, 0.45, 0.55],
  [/roll_to_pitch|pitch_to_yaw|yaw_to_roll|cache|holder/, 0x8f98a4, 0.5, 0.15],
  [/.*/, 0xdfe3e8, 0.55, 0.05],
];

const gridVert = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const gridFrag = /* glsl */ `
  uniform float uOffset;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec3 vWorld;
  float line(vec2 p, float size, float width) {
    vec2 q = p / size;
    vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
    return 1.0 - min(min(g.x, g.y) / width, 1.0);
  }
  void main() {
    vec2 p = vWorld.xz;
    p.x += uOffset;
    float minor = line(p, 0.05, 1.0);
    float major = line(p, 0.25, 1.3);
    float d = length(vWorld.xz);
    float fade = exp(-d * d * 1.5);
    float a = (minor * 0.07 + major * 0.3) * fade * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`;

export async function createRobotScene(
  canvas: HTMLCanvasElement,
  opts: {
    getProgress: () => number;
    onFrame: (info: FrameInfo) => void;
    labelJoints: number[];
    reduceMotion: boolean;
  },
): Promise<RobotScene> {
  const base = import.meta.env.BASE_URL;
  const [meta, buf] = await Promise.all([
    fetch(`${base}robot/duck.json`).then((r) => r.json() as Promise<Meta>),
    fetch(`${base}robot/duck.bin`).then((r) => r.arrayBuffer()),
  ]);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07080a, 1.4, 4.2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 30);

  scene.add(new THREE.HemisphereLight(0x9fb4d9, 0x050608, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(1.0, 1.8, 1.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -0.5;
  key.shadow.camera.right = key.shadow.camera.top = 0.5;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 4;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.01;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x5eead4, 1.6);
  rim.position.set(-1.4, 0.9, -1.3);
  scene.add(rim);
  const warm = new THREE.DirectionalLight(0xffc7ae, 0.4);
  warm.position.set(0.6, 0.2, -1.2);
  scene.add(warm);

  // floor: treadmill grid + shadow catcher
  const gridMat = new THREE.ShaderMaterial({
    vertexShader: gridVert,
    fragmentShader: gridFrag,
    transparent: true,
    depthWrite: false,
    uniforms: { uOffset: { value: 0 }, uOpacity: { value: 1 }, uColor: { value: new THREE.Color(0x5eead4) } },
  });
  const floorGeo = new THREE.PlaneGeometry(12, 12);
  floorGeo.rotateX(-Math.PI / 2);
  const grid = new THREE.Mesh(floorGeo, gridMat);
  scene.add(grid);
  const shadowGeo = new THREE.PlaneGeometry(3, 3);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadow = new THREE.Mesh(shadowGeo, new THREE.ShadowMaterial({ opacity: 0.55 }));
  shadow.position.y = 0.0005;
  shadow.receiveShadow = true;
  scene.add(shadow);

  // MuJoCo is Z-up; everything robot-side lives in this Y-up converter
  const root = new THREE.Group();
  root.rotation.x = -Math.PI / 2;
  scene.add(root);

  const geometries = meta.meshes.map((mm) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(buf, mm.v[0], mm.v[1] * 3), 3));
    const idx = mm.u32 ? new Uint32Array(buf, mm.f[0], mm.f[1] * 3) : new Uint16Array(buf, mm.f[0], mm.f[1] * 3);
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const creased = toCreasedNormals(g, Math.PI / 5);
    return { solid: creased, edges: new THREE.EdgesGeometry(g, 40) };
  });

  const materials = new Map<number, THREE.MeshStandardMaterial>();
  const matFor = (name: string) => {
    const [, color, roughness, metalness] = PALETTE.find(([re]) => re.test(name))!;
    if (!materials.has(color)) {
      materials.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness,
          transparent: true,
          emissive: name.endsWith("antenna") ? 0x5eead4 : 0x000000,
          emissiveIntensity: name.endsWith("antenna") ? 0.35 : 0,
        }),
      );
    }
    return materials.get(color)!;
  };
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x5eead4,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const parts = meta.geoms.map((g) => {
    const mm = meta.meshes[g.mesh];
    const mesh = new THREE.Mesh(geometries[g.mesh].solid, matFor(mm.name));
    mesh.castShadow = true;
    mesh.matrixAutoUpdate = false;
    mesh.add(new THREE.LineSegments(geometries[g.mesh].edges, edgeMat));
    root.add(mesh);
    return mesh;
  });

  // joint frames: RGB triads + a ring at each anchor
  const triadGeo = new THREE.BufferGeometry();
  const L = 0.04;
  triadGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, L, 0, 0, 0, 0, 0, 0, L, 0, 0, 0, 0, 0, 0, L], 3));
  const R = [1, 0.36, 0.36];
  const G = [0.36, 1, 0.55];
  const B = [0.36, 0.6, 1];
  triadGeo.setAttribute("color", new THREE.Float32BufferAttribute([...R, ...R, ...G, ...G, ...B, ...B], 3));
  const triadMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthTest: false });
  const dotGeo = new THREE.SphereGeometry(0.0026, 12, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0, depthTest: false });
  const triads = meta.joints.map(() => {
    const g = new THREE.Group();
    g.matrixAutoUpdate = false;
    const lines = new THREE.LineSegments(triadGeo, triadMat);
    lines.renderOrder = 10;
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.renderOrder = 11;
    g.add(lines, dot);
    root.add(g);
    return g;
  });

  const F = meta.frames;
  const NG = meta.geoms.length;
  const NJ = meta.joints.length;
  const frames = new Float32Array(buf, meta.offsets.frames, F * NG * 7);
  const jframes = new Float32Array(buf, meta.offsets.jointFrames, F * NJ * 7);
  const angles = new Float32Array(buf, meta.offsets.angles, F * NJ);

  const ranges = meta.joints.map((_, j) => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let f = 0; f < F; f++) {
      const a = angles[f * NJ + j];
      lo = Math.min(lo, a);
      hi = Math.max(hi, a);
    }
    return [lo, hi] as [number, number];
  });

  const qa = new THREE.Quaternion();
  const qb = new THREE.Quaternion();
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);

  const pose = (arr: Float32Array, stride: number, i: number, f0: number, f1: number, a: number, target: THREE.Matrix4) => {
    const o0 = (f0 * stride + i) * 7;
    const o1 = (f1 * stride + i) * 7;
    pa.set(arr[o0], arr[o0 + 1], arr[o0 + 2]);
    pb.set(arr[o1], arr[o1 + 1], arr[o1 + 2]);
    qa.set(arr[o0 + 4], arr[o0 + 5], arr[o0 + 6], arr[o0 + 3]);
    qb.set(arr[o1 + 4], arr[o1 + 5], arr[o1 + 6], arr[o1 + 3]);
    pa.lerp(pb, a);
    qa.slerp(qb, a);
    target.compose(pa, qa, one);
  };

  const sampleAngle = (j: number, t: number) => {
    const f = (((t * meta.fps) % F) + F) % F;
    const f0 = Math.floor(f);
    const f1 = (f0 + 1) % F;
    return lerp(angles[f0 * NJ + j], angles[f1 * NJ + j], f - f0);
  };

  // sizing
  let W = 0;
  let H = 0;
  let portrait = false;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    portrait = W / H < 0.9;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, portrait ? 1.5 : 1.75));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // pointer parallax, spring-smoothed
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  const onPointer = (e: PointerEvent) => {
    ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  let t = 0;
  let last = performance.now();
  let floorOffset = 0;
  let raf = 0;
  let running = false;
  const m4 = new THREE.Matrix4();
  const v3 = new THREE.Vector3();
  const look = new THREE.Vector3();
  const labels: Label[] = opts.labelJoints.map(() => ({ x: 0, y: 0, on: false, deg: 0 }));

  const render = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!opts.reduceMotion) {
      t += dt;
      floorOffset += meta.treadmillSpeed * dt;
    }
    const p = clamp01(opts.getProgress());

    // robot pose
    const f = (t * meta.fps) % F;
    const f0 = Math.floor(f);
    const f1 = (f0 + 1) % F;
    const a = f - f0;
    for (let i = 0; i < NG; i++) pose(frames, NG, i, f0, f1, a, parts[i].matrix);
    for (let j = 0; j < NJ; j++) pose(jframes, NJ, j, f0, f1, a, triads[j].matrix);
    gridMat.uniforms.uOffset.value = floorOffset;

    // beat-dependent looks
    const xray = smooth(clamp01((p - 0.18) / 0.12)) * (1 - smooth(clamp01((p - 0.54) / 0.1)));
    const solidOpacity = 1 - xray * 0.86;
    materials.forEach((m) => {
      m.opacity = solidOpacity;
      m.depthWrite = solidOpacity > 0.5;
    });
    edgeMat.opacity = 0.06 + xray * 0.75;
    triadMat.opacity = xray;
    dotMat.opacity = xray;
    gridMat.uniforms.uOpacity.value = 1 - smooth(clamp01((p - 0.88) / 0.12)) * 0.7;

    // camera
    ptr.sx += (ptr.x - ptr.sx) * 0.05;
    ptr.sy += (ptr.y - ptr.sy) * 0.05;
    const k = camAt(p, portrait);
    const theta = k.theta + ptr.sx * 0.08;
    const phi = Math.max(0.02, k.phi - ptr.sy * 0.04);
    look.set(k.look[0], k.look[1], k.look[2]);
    camera.position.set(
      look.x + k.r * Math.cos(phi) * Math.cos(theta),
      look.y + k.r * Math.sin(phi),
      look.z + k.r * Math.cos(phi) * Math.sin(theta),
    );
    camera.lookAt(look);
    camera.setViewOffset(W, H, k.off[0] * W, k.off[1] * H, W, H);

    scene.updateMatrixWorld();

    // label anchors (screen space)
    opts.labelJoints.forEach((j, i) => {
      m4.multiplyMatrices(root.matrixWorld, triads[j].matrix);
      v3.setFromMatrixPosition(m4).project(camera);
      labels[i].x = (v3.x * 0.5 + 0.5) * W;
      labels[i].y = (-v3.y * 0.5 + 0.5) * H;
      labels[i].on = xray > 0.6 && v3.z < 1;
      labels[i].deg = lerp(angles[f0 * NJ + j], angles[f1 * NJ + j], a);
    });
    opts.onFrame({ frame: f0, frames: F, labels });

    renderer.render(scene, camera);
  };

  const loop = (now: number) => {
    render(now);
    raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    } else if (!e.isIntersecting && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  });
  io.observe(canvas);
  render(performance.now());

  return {
    sampleAngle,
    angleRange: (j) => ranges[j],
    jointNames: meta.joints,
    dispose: () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      geometries.forEach((g) => {
        g.solid.dispose();
        g.edges.dispose();
      });
      materials.forEach((m) => m.dispose());
      [edgeMat, triadMat, dotMat, gridMat].forEach((m) => m.dispose());
      [triadGeo, dotGeo, floorGeo, shadowGeo].forEach((g) => g.dispose());
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
