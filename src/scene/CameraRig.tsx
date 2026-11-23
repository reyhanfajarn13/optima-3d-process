import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OVERVIEW_CAMERA, STATIONS, STEPS } from '../data/process';
import { sceneApi } from '../sceneApi';
import { useApp } from '../store';


const BOUNDS = { minX: -55, maxX: 65, minZ: -35, maxZ: 40, minY: 0, maxY: 10 };
const FOV = 42;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
/** setengah lebar & kedalaman seluruh peta proses (unit dunia) */
const SCENE_HALF = { x: 53, z: 20 };

/** Area layar yang tertutup UI (px) — harus selaras dengan styles.css */
export function uiInsets(width: number, height: number, panelOpen: boolean) {
  if (width >= 1024) {
    return { left: 76, right: panelOpen ? Math.min(440, width * 0.34) + 16 : 0, top: 0, bottom: 0 };
  }
  return { left: 0, right: 0, top: 118, bottom: panelOpen ? Math.min(height * 0.48, 520) : 0 };
}

function goalFor(width: number, height: number) {
  const { activeStep, focusStation, panelOpen } = useApp.getState();
  const ins = uiInsets(width, height, panelOpen);
  const visW = Math.max(200, width - ins.left - ins.right);
  const visH = Math.max(160, height - ins.top - ins.bottom);
  const fullH = height + Math.abs(ins.bottom - ins.top);
  // area pandang sempit (ponsel) → kamera mundur agar objek tetap muat
  const pullback = THREE.MathUtils.clamp(Math.max(Math.pow(820 / visW, 0.75), Math.pow(560 / visH, 1.1)), 1, 2.6);
  let pos: THREE.Vector3;
  let target: THREE.Vector3;
  if (focusStation) {
    const p = STATIONS[focusStation].position;
    target = new THREE.Vector3(p[0], 1.4, p[2]);
    const offset = focusStation === 'customer' ? [9, 20, 29] : focusStation === 'optima' ? [5, 10, 17] : focusStation === 'warehouse' ? [5, 9, 14] : [4.5, 5.5, 9];
    pos = target.clone().add(new THREE.Vector3(...offset).multiplyScalar(pullback));
  } else if (activeStep > 0) {
    const cam = STEPS[activeStep - 1].camera;
    target = new THREE.Vector3(...cam.target);
    pos = new THREE.Vector3(...cam.position).sub(target).multiplyScalar(pullback).add(target);
  } else {
    // ringkasan: jarak dihitung agar seluruh peta muat di area yang tidak tertutup panel
    target = new THREE.Vector3(...OVERVIEW_CAMERA.target);
    const portrait = visW / visH < 0.9;
    const elevation = THREE.MathUtils.degToRad(portrait ? 60 : 47);
    // potret: alur proses dibuat vertikal di layar (kamera dari sisi -x)
    const across = portrait ? SCENE_HALF.z : SCENE_HALF.x;
    const along = (portrait ? SCENE_HALF.x : SCENE_HALF.z) * Math.sin(elevation) + 4;
    const dW = (across * fullH) / (visW / 2) / (2 * TAN) * 1.15;
    const dH = (along * fullH) / (visH / 2) / (2 * TAN) * 1.15;
    const d = Math.max(dW, dH);
    const dir = portrait
      ? new THREE.Vector3(-Math.cos(elevation), Math.sin(elevation), 0)
      : new THREE.Vector3(0, Math.sin(elevation), Math.cos(elevation));
    pos = target.clone().add(dir.multiplyScalar(d));
  }
  return { pos, target };
}

export function CameraRig() {
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const nonce = useApp((s) => s.cameraNonce);
  const flying = useRef(true);
  const snap = useRef(true); // load pertama: langsung di posisi, tanpa animasi terbang
  const goal = useRef(goalFor(size.width, size.height));

  useEffect(() => {
    goal.current = goalFor(size.width, size.height);
    flying.current = true;
    invalidate();
    // size sengaja tidak dijadikan dependency: resize tidak boleh memindahkan kamera user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, invalidate]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => (flying.current = false);
    const clamp = () => {
      const t = controls.target;
      const cx = THREE.MathUtils.clamp(t.x, BOUNDS.minX, BOUNDS.maxX);
      const cy = THREE.MathUtils.clamp(t.y, BOUNDS.minY, BOUNDS.maxY);
      const cz = THREE.MathUtils.clamp(t.z, BOUNDS.minZ, BOUNDS.maxZ);
      if (cx !== t.x || cy !== t.y || cz !== t.z) {
        const d = new THREE.Vector3(cx - t.x, cy - t.y, cz - t.z);
        t.add(d);
        camera.position.add(d);
      }
    };
    controls.addEventListener('start', stop);
    controls.addEventListener('change', clamp);

    sceneApi.zoom = (dir) => {
      flying.current = false;
      const offset = camera.position.clone().sub(controls.target);
      const next = THREE.MathUtils.clamp(offset.length() * (dir > 0 ? 0.75 : 1.33), controls.minDistance, controls.maxDistance);
      goal.current = { pos: controls.target.clone().add(offset.setLength(next)), target: controls.target.clone() };
      flying.current = true;
      invalidate();
    };
    sceneApi.setDragMode = (mode) => {
      controls.mouseButtons.LEFT = mode === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
      controls.mouseButtons.RIGHT = mode === 'pan' ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
      controls.touches.ONE = mode === 'pan' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
    };
    return () => {
      controls.removeEventListener('start', stop);
      controls.removeEventListener('change', clamp);
    };
  }, [controls, camera, invalidate]);

  useFrame((_, dt) => {
    if (!flying.current || !controls) return;
    if (snap.current) {
      snap.current = false;
      flying.current = false;
      camera.position.copy(goal.current.pos);
      controls.target.copy(goal.current.target);
      controls.update();
      return;
    }
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 3.2);
    camera.position.lerp(goal.current.pos, k);
    controls.target.lerp(goal.current.target, k);
    controls.update();
    if (camera.position.distanceToSquared(goal.current.pos) < 0.002 && controls.target.distanceToSquared(goal.current.target) < 0.002) {
      flying.current = false;
    } else {
      invalidate();
    }
  });

  return null;
}

/**
 * Menggeser titik tengah render ke area yang tidak tertutup panel,
 * sehingga objek fokus tetap berada di tengah ruang yang terlihat.
 */
export function ViewOffset() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera & { manual?: boolean };
  const size = useThree((s) => s.size);
  const panelOpen = useApp((s) => s.panelOpen);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    // R3F also updates aspect on DPR changes. This projection includes UI insets,
    // so ViewOffset owns it across resize and adaptive-resolution updates.
    const previous = camera.manual;
    camera.manual = true;
    return () => { camera.manual = previous; };
  }, [camera]);

  useEffect(() => {
    const ins = uiInsets(size.width, size.height, panelOpen);
    const sx = (ins.right - ins.left) / 2;
    const sy = (ins.bottom - ins.top) / 2;
    if (Math.abs(sx) < 1 && Math.abs(sy) < 1) {
      camera.aspect = size.width / size.height;
      camera.clearViewOffset();
    } else {
      const fullW = size.width + Math.abs(sx) * 2;
      const fullH = size.height + Math.abs(sy) * 2;
      // aspect harus mengikuti ukuran "virtual" agar gambar tidak gepeng
      camera.aspect = fullW / fullH;
      camera.setViewOffset(fullW, fullH, sx > 0 ? sx * 2 : 0, sy > 0 ? sy * 2 : 0, size.width, size.height);
    }
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, panelOpen, invalidate]);

  return null;
}
