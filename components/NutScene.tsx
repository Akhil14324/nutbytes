"use client";

/* three.js scenes mutate buffers and loaded textures every frame by design */
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from "react";
import manifest from "../public/nuts/manifest.json";

/* ------------------------------------------------------------------ *
 *  The nuts are real studio photographs, cut out and packed into one
 *  texture atlas by `scripts/build-nuts.mjs`. Each one is flown through
 *  the scene as a textured card, all in a single draw call.
 * ------------------------------------------------------------------ */

type Cut = { u: number; v: number; uw: number; vh: number; aspect: number };
const ATLAS = manifest as { atlas: string; w: number; h: number; types: Record<string, Cut[]> };

// share of the ball, and the world length of the longest edge (min, max)
const TYPES: { key: string; share: number; size: [number, number] }[] = [
  { key: "cashew", share: 3, size: [0.62, 0.78] },
  { key: "almond", share: 3, size: [0.62, 0.78] },
  { key: "walnut", share: 1.6, size: [0.78, 0.96] },
  { key: "pista", share: 2.6, size: [0.5, 0.62] },
  { key: "peanut", share: 2, size: [0.52, 0.66] },
  { key: "seed", share: 2.2, size: [0.46, 0.58] },
  { key: "raisin", share: 3, size: [0.36, 0.48] },
  { key: "prune", share: 1.4, size: [0.55, 0.7] },
  { key: "fig", share: 1.6, size: [0.72, 0.9] },
  { key: "date", share: 1.5, size: [0.78, 0.96] },
  { key: "apricot", share: 1.2, size: [0.7, 0.86] },
];

const BALL_R = 1.28;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Inst = {
  cut: Cut;
  length: number;
  start: THREE.Vector3;
  target: THREE.Vector3;
  targetQ: THREE.Quaternion;
  tiltX: number;
  tiltY: number;
  roll: number;
  rollSpeed: number;
  speed: number;
  delay: number;
  phase: number;
  swirl: number;
  load: number;
};

function plan(vw: number, vh: number, ballScale: number): Inst[] {
  const TOTAL = ballScale < 0.9 ? 120 : 230; // lighter on phones: less clutter, faster
  const r = rng(20261102);
  const present = TYPES.filter((t) => ATLAS.types[t.key]?.length);
  const shareSum = present.reduce((n, t) => n + t.share, 0) || 1;

  // fibonacci points over the sphere, shuffled so the types mix evenly
  const pts: THREE.Vector3[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < TOTAL; i++) {
    const y = 1 - (i / (TOTAL - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    pts.push(new THREE.Vector3(Math.cos(ga * i) * rad, y, Math.sin(ga * i) * rad));
  }
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }

  const out: Inst[] = [];
  let n = 0;
  present.forEach((t, ti) => {
    const cuts = ATLAS.types[t.key];
    const count = ti === present.length - 1 ? TOTAL - n : Math.round((t.share / shareSum) * TOTAL);
    for (let i = 0; i < count && n < TOTAL; i++, n++) {
      const normal = pts[n].clone();
      const target = normal.clone().multiplyScalar(BALL_R * ballScale * (0.97 + r() * 0.08));
      const rnd = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      const tangent = new THREE.Vector3().crossVectors(normal, rnd).normalize();
      const bit = new THREE.Vector3().crossVectors(normal, tangent).normalize();
      const targetQ = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(tangent, bit, normal)
      );
      out.push({
        cut: cuts[Math.floor(r() * cuts.length)],
        length: (t.size[0] + r() * (t.size[1] - t.size[0])) * Math.max(0.72, ballScale),
        start: new THREE.Vector3((r() - 0.5) * vw * 1.15, (r() - 0.5) * vh * 1.15, -3 + r() * 4.4),
        target,
        targetQ,
        tiltX: (r() - 0.5) * 0.9,
        tiltY: (r() - 0.5) * 0.9,
        roll: r() * Math.PI * 2,
        rollSpeed: (r() - 0.5) * 0.5,
        speed: 0.25 + r() * 0.55,
        delay: r(),
        phase: r() * 6.28,
        swirl: (r() - 0.5) * 3.4,
        load: r(),
      });
    }
  });
  return out;
}

const _dummy = new THREE.Object3D();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _p = new THREE.Vector3();
const _yAxis = new THREE.Vector3(0, 1, 0);

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function Nuts({
  progress,
  host,
  calm,
}: {
  progress: MutableRefObject<number>;
  host: RefObject<HTMLElement | null>;
  calm: boolean;
}) {
  const { viewport, size, gl } = useThree();
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const smoothP = useRef(0);

  const ballScale = Math.min(1, (viewport.width * 0.82) / (BALL_R * 2));
  const insts = useMemo(
    () => plan(viewport.width, viewport.height, ballScale),
    [viewport.width, viewport.height, ballScale]
  );

  const atlas = useLoader(THREE.TextureLoader, ATLAS.atlas);
  useEffect(() => {
    atlas.colorSpace = THREE.SRGBColorSpace;
    atlas.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    atlas.needsUpdate = true;
  }, [atlas, gl]);

  // one card, one material; each instance picks its nut from the atlas
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    const rects = new Float32Array(insts.length * 4);
    insts.forEach((it, i) => {
      rects[i * 4] = it.cut.u;
      rects[i * 4 + 1] = it.cut.v;
      rects[i * 4 + 2] = it.cut.uw;
      rects[i * 4 + 3] = it.cut.vh;
    });
    g.setAttribute("aUvRect", new THREE.InstancedBufferAttribute(rects, 4));
    return g;
  }, [insts]);

  const material = useMemo(() => {
    // soft alpha blending gives smooth, anti-aliased edges on every device.
    // The cards are sorted back-to-front each frame (see useFrame) so they layer correctly.
    const m = new THREE.MeshLambertMaterial({
      map: atlas,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      toneMapped: false,
    });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "attribute vec4 aUvRect;\n" +
        shader.vertexShader.replace(
          "#include <uv_vertex>",
          "#include <uv_vertex>\n#ifdef USE_MAP\n  vMapUv = vMapUv * aUvRect.zw + aUvRect.xy;\n#endif"
        );
    };
    return m;
  }, [atlas]);

  // working buffers: cards are rewritten back-to-front every frame
  const buf = useMemo(() => {
    const n = insts.length;
    const r = rng(7);
    const bright = new Float32Array(n);
    for (let i = 0; i < n; i++) bright[i] = 0.92 + r() * 0.14; // so no two cards look identical
    return {
      mats: new Float32Array(n * 16),
      depth: new Float32Array(n),
      order: Int32Array.from({ length: n }, (_, i) => i),
      bright,
    };
  }, [insts]);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(insts.length * 3), 3);
  }, [insts]);

  // report the assembled ball's pixel size so the laddu photo can match it
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const d = ((BALL_R * 2 * ballScale * 1.12) / viewport.height) * size.height;
    el.style.setProperty("--ball", `${Math.round(d)}px`);
  }, [host, viewport.height, size.height, ballScale]);

  const floatMul = ballScale < 0.9 ? 0.62 : 0.82;
  const drift = calm ? 0.25 : 1;
  const warm = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    smoothP.current += (progress.current - smoothP.current) * Math.min(1, dt * 4.5);
    const P = smoothP.current;

    const g = group.current;
    if (g) {
      g.rotation.y = Math.max(0, P - 0.2) * 4.4 + t * 0.06 * drift * smooth(0.45, 0.7, P) + state.pointer.x * 0.12 * drift;
      g.rotation.x = 0.2 * smooth(0.3, 0.6, P) + state.pointer.y * -0.08 * drift;
      g.scale.setScalar(1 + 0.03 * Math.sin(smooth(0.5, 0.62, P) * Math.PI));
    }

    if (core.current) {
      const s = smooth(0.44, 0.62, P);
      core.current.scale.setScalar(Math.max(0.001, s));
      core.current.visible = s > 0.002;
    }

    // glaze: the cards warm to a golden tone as the ball forms
    const glaze = smooth(0.52, 0.72, P);
    warm.setRGB(1 - glaze * 0.03, 1 - glaze * 0.08, 1 - glaze * 0.2);
    material.color.copy(warm);

    if (g) g.updateMatrix();
    for (let n = 0; n < insts.length; n++) {
      const it = insts[n];

      const lt = Math.min(1, Math.max(0, (t - 0.15 - it.load * 0.9) / 0.9));
      const loadS = lt <= 0 ? 0 : easeOutBack(lt);

      const u = Math.min(1, Math.max(0, (P - 0.2 - it.delay * 0.17) / 0.25));
      const e = easeInOut(u);

      _v.copy(it.start);
      _v.x += Math.sin(t * 0.32 * it.speed * 2 + it.phase) * 0.28 * drift;
      _v.y += Math.cos(t * 0.27 * it.speed * 2 + it.phase * 1.3) * 0.3 * drift + P * it.start.z * 0.55;
      _v.z += Math.sin(t * 0.21 + it.phase) * 0.22 * drift;
      _v.lerp(it.target, e);
      if (e > 0 && e < 1) _v.applyAxisAngle(_yAxis, Math.sin(e * Math.PI) * it.swirl * 0.5);

      // cards stay mostly face-on so they never turn edge-on and vanish
      const wob = (1 - e) * drift;
      _e.set(
        it.tiltX + Math.sin(t * 0.35 * it.speed + it.phase) * 0.45 * wob,
        it.tiltY + Math.cos(t * 0.3 * it.speed + it.phase * 1.3) * 0.45 * wob,
        it.roll + t * it.rollSpeed * wob,
        "XYZ"
      );
      _q.setFromEuler(_e);
      _q.slerp(it.targetQ, e);

      // longest edge of the nut = it.length
      const k = it.length * loadS * (floatMul + (1.22 - floatMul) * e);
      const a = it.cut.aspect;
      _dummy.position.copy(_v);
      _dummy.quaternion.copy(_q);
      _dummy.scale.set(a > 1 ? k / a : k, a > 1 ? k : k * a, 1);
      _dummy.updateMatrix();
      _dummy.matrix.toArray(buf.mats, n * 16);
      // distance from the camera, after the ball's own rotation
      buf.depth[n] = g ? _p.copy(_v).applyMatrix4(g.matrix).z : _v.z;
    }

    // painter's algorithm: far cards first
    const { order, depth, mats, bright } = buf;
    order.sort((a, b) => depth[a] - depth[b]);
    const ia = m.instanceMatrix.array as Float32Array;
    const rects = (m.geometry.getAttribute("aUvRect") as THREE.InstancedBufferAttribute);
    const col = m.instanceColor;
    for (let k = 0; k < order.length; k++) {
      const n = order[k];
      ia.set(mats.subarray(n * 16, n * 16 + 16), k * 16);
      const c = insts[n].cut;
      const ra = rects.array as Float32Array;
      ra[k * 4] = c.u; ra[k * 4 + 1] = c.v; ra[k * 4 + 2] = c.uw; ra[k * 4 + 3] = c.vh;
      if (col) {
        const ca = col.array as Float32Array;
        ca[k * 3] = ca[k * 3 + 1] = ca[k * 3 + 2] = bright[n];
      }
    }
    m.instanceMatrix.needsUpdate = true;
    rects.needsUpdate = true;
    if (col) col.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <mesh ref={core} visible={false}>
        <sphereGeometry args={[BALL_R * ballScale * 0.84, 48, 32]} />
        <meshStandardMaterial color="#7a4f28" roughness={0.5} metalness={0} />
      </mesh>
      <instancedMesh
        ref={mesh}
        args={[geometry, material, insts.length]}
        frustumCulled={false}
      />
    </group>
  );
}

export default function NutScene({
  progress,
  host,
  active,
  calm,
}: {
  progress: MutableRefObject<number>;
  host: RefObject<HTMLElement | null>;
  active: boolean;
  calm: boolean;
}) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ position: [0, 0, 9], fov: 32, near: 0.5, far: 40 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={2.25} />
      <directionalLight position={[3, 4, 6]} intensity={1.5} color="#fff4e4" />
      <Suspense fallback={null}>
        <Nuts progress={progress} host={host} calm={calm} />
      </Suspense>
    </Canvas>
  );
}
