"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from "react";
import manifest from "../public/nuts/manifest.json";

/* ------------------------------------------------------------------ *
 *  The nuts are real studio photographs, cut out and flown through a
 *  3D scene as textured cards. Drop a new sheet through
 *  `scripts/cut-nuts.mjs <type> <sheet>` and it is picked up here.
 * ------------------------------------------------------------------ */

type Cut = { file: string; w: number; h: number };
const SHEETS = manifest as Record<string, Cut[]>;

// relative share of the ball and world width (min, max) of each nut type
const TYPES: { key: string; share: number; size: [number, number] }[] = [
  { key: "cashew", share: 3, size: [0.58, 0.74] },
  { key: "almond", share: 3, size: [0.5, 0.64] },
  { key: "walnut", share: 2, size: [0.62, 0.78] },
  { key: "pista", share: 2, size: [0.34, 0.44] },
  { key: "peanut", share: 2, size: [0.36, 0.46] },
  { key: "seed", share: 2, size: [0.32, 0.4] },
  { key: "raisin", share: 2, size: [0.24, 0.32] },
  { key: "fig", share: 1.5, size: [0.5, 0.62] },
  { key: "date", share: 1.5, size: [0.5, 0.62] },
  { key: "apricot", share: 1, size: [0.48, 0.6] },
];

const TOTAL = 190;
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

type Variant = { file: string; aspect: number; count: number };
type Inst = {
  variant: number;
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
  scale: number;
  load: number;
};

function plan(vw: number, vh: number, ballScale: number) {
  const r = rng(20261102);
  const present = TYPES.filter((t) => SHEETS[t.key]?.length);
  const shareSum = present.reduce((n, t) => n + t.share, 0) || 1;

  // fibonacci points over the sphere, shuffled so types mix
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

  const variants: Variant[] = [];
  const insts: Inst[] = [];
  let n = 0;

  present.forEach((t, ti) => {
    const cuts = SHEETS[t.key];
    const count = ti === present.length - 1 ? TOTAL - n : Math.round((t.share / shareSum) * TOTAL);
    const base = variants.length;
    cuts.forEach((c) => variants.push({ file: c.file, aspect: c.h / c.w, count: 0 }));

    for (let i = 0; i < count && n < TOTAL; i++, n++) {
      const normal = pts[n].clone();
      const target = normal.clone().multiplyScalar(BALL_R * ballScale * (0.97 + r() * 0.08));
      const rnd = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      const tangent = new THREE.Vector3().crossVectors(normal, rnd).normalize();
      const bit = new THREE.Vector3().crossVectors(normal, tangent).normalize();
      const targetQ = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(tangent, bit, normal)
      );

      const v = base + (i % cuts.length);
      variants[v].count++;
      insts.push({
        variant: v,
        start: new THREE.Vector3(
          (r() - 0.5) * vw * 1.15,
          (r() - 0.5) * vh * 1.15,
          -3 + r() * 4.4
        ),
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
        scale: (t.size[0] + r() * (t.size[1] - t.size[0])) * Math.max(0.72, ballScale),
        load: r(),
      });
    }
  });
  return { variants, insts };
}

const _dummy = new THREE.Object3D();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
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
}: {
  progress: MutableRefObject<number>;
  host: RefObject<HTMLElement | null>;
}) {
  const { viewport, size, gl } = useThree();
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const mats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  const smoothP = useRef(0);

  const ballScale = Math.min(1, (viewport.width * 0.82) / (BALL_R * 2));
  const { variants, insts } = useMemo(
    () => plan(viewport.width, viewport.height, ballScale),
    [viewport.width, viewport.height, ballScale]
  );

  const textures = useLoader(THREE.TextureLoader, variants.map((v) => v.file));
  useEffect(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      t.needsUpdate = true;
    });
  }, [textures, gl]);

  const geos = useMemo(() => variants.map((v) => new THREE.PlaneGeometry(1, v.aspect)), [variants]);

  // a little brightness variation so no two cards look identical
  useEffect(() => {
    const c = new THREE.Color();
    const r = rng(7);
    meshes.current.forEach((m, vi) => {
      if (!m) return;
      for (let i = 0; i < variants[vi].count; i++) {
        const k = 0.9 + r() * 0.16;
        c.setRGB(k, k * (0.98 + r() * 0.03), k * (0.96 + r() * 0.05));
        m.setColorAt(i, c);
      }
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
  }, [variants]);

  // report the assembled ball's pixel size so the laddu photo can match it
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const d = ((BALL_R * 2 * ballScale * 1.12) / viewport.height) * size.height;
    el.style.setProperty("--ball", `${Math.round(d)}px`);
  }, [host, viewport.height, size.height, ballScale]);

  const floatMul = ballScale < 0.9 ? 0.6 : 0.8;
  const warm = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    smoothP.current += (progress.current - smoothP.current) * Math.min(1, dt * 4.5);
    const P = smoothP.current;

    const g = group.current;
    if (g) {
      g.rotation.y = Math.max(0, P - 0.2) * 4.4 + t * 0.06 * smooth(0.45, 0.7, P) + state.pointer.x * 0.12;
      g.rotation.x = 0.2 * smooth(0.3, 0.6, P) + state.pointer.y * -0.08;
      g.scale.setScalar(1 + 0.03 * Math.sin(smooth(0.5, 0.62, P) * Math.PI));
    }

    if (core.current) {
      const s = smooth(0.44, 0.62, P);
      core.current.scale.setScalar(Math.max(0.001, s));
      core.current.visible = s > 0.002;
    }

    // glaze: the cards warm to a golden tone as the ball forms
    const glaze = smooth(0.52, 0.72, P);
    warm.setRGB(1 - glaze * 0.04, 1 - glaze * 0.1, 1 - glaze * 0.24);
    mats.current.forEach((m) => m?.color.copy(warm));

    const counters = variants.map(() => 0);
    for (let n = 0; n < insts.length; n++) {
      const it = insts[n];
      const mesh = meshes.current[it.variant];
      if (!mesh) continue;

      const lt = Math.min(1, Math.max(0, (t - 0.15 - it.load * 0.9) / 0.9));
      const loadS = lt <= 0 ? 0 : easeOutBack(lt);

      const u = Math.min(1, Math.max(0, (P - 0.2 - it.delay * 0.17) / 0.25));
      const e = easeInOut(u);

      _v.copy(it.start);
      _v.x += Math.sin(t * 0.32 * it.speed * 2 + it.phase) * 0.28;
      _v.y += Math.cos(t * 0.27 * it.speed * 2 + it.phase * 1.3) * 0.3 + P * it.start.z * 0.55;
      _v.z += Math.sin(t * 0.21 + it.phase) * 0.22;
      _v.lerp(it.target, e);
      if (e > 0 && e < 1) _v.applyAxisAngle(_yAxis, Math.sin(e * Math.PI) * it.swirl * 0.5);

      // cards stay mostly face-on so they never turn edge-on and vanish
      const wob = 1 - e;
      _e.set(
        it.tiltX + Math.sin(t * 0.35 * it.speed + it.phase) * 0.45 * wob,
        it.tiltY + Math.cos(t * 0.3 * it.speed + it.phase * 1.3) * 0.45 * wob,
        it.roll + t * it.rollSpeed * wob,
        "XYZ"
      );
      _q.setFromEuler(_e);
      _q.slerp(it.targetQ, e);

      _dummy.position.copy(_v);
      _dummy.quaternion.copy(_q);
      _dummy.scale.setScalar(it.scale * loadS * (floatMul + (1.5 - floatMul) * e));
      _dummy.updateMatrix();
      mesh.setMatrixAt(counters[it.variant]++, _dummy.matrix);
    }
    meshes.current.forEach((m) => {
      if (m) m.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group ref={group}>
      <mesh ref={core} visible={false}>
        <sphereGeometry args={[BALL_R * ballScale * 0.84, 48, 32]} />
        <meshStandardMaterial color="#9c6a34" roughness={0.45} metalness={0} />
      </mesh>
      {variants.map((v, i) => (
        <instancedMesh
          key={v.file}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          args={[geos[i], undefined, Math.max(1, v.count)]}
          frustumCulled={false}
        >
          <meshLambertMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            map={textures[i]}
            side={THREE.DoubleSide}
            alphaTest={0.5}
            alphaToCoverage
            toneMapped={false}
          />
        </instancedMesh>
      ))}
    </group>
  );
}

export default function NutScene({
  progress,
  host,
  active,
}: {
  progress: MutableRefObject<number>;
  host: RefObject<HTMLElement | null>;
  active: boolean;
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
        <Nuts progress={progress} host={host} />
      </Suspense>
    </Canvas>
  );
}
