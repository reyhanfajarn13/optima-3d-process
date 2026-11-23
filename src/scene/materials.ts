import * as THREE from 'three';

/**
 * Geometri & material dibagi pakai (shared) agar memori GPU kecil
 * dan jumlah program shader minim. Semua aset dibangun dari primitif ini.
 */
export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
  cylLow: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  sphere: new THREE.SphereGeometry(0.5, 18, 14),
  cone: new THREE.ConeGeometry(0.5, 1, 14),
  capsule: new THREE.CapsuleGeometry(0.5, 1, 4, 10),
  plane: new THREE.PlaneGeometry(1, 1),
  torus: new THREE.TorusGeometry(0.5, 0.05, 8, 40),
  ico: new THREE.IcosahedronGeometry(0.5, 1),
  circle: new THREE.CircleGeometry(0.5, 28),
};

const lambert = new Map<string, THREE.MeshLambertMaterial>();
/** Material Lambert (murah) di-cache per warna */
export function mat(color: string): THREE.MeshLambertMaterial {
  let m = lambert.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color });
    lambert.set(color, m);
  }
  return m;
}

const glow = new Map<string, THREE.MeshBasicMaterial>();
/** Material tanpa pencahayaan untuk LED / lampu / elemen menyala */
export function glowMat(color: string): THREE.MeshBasicMaterial {
  let m = glow.get(color);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    glow.set(color, m);
  }
  return m;
}

export const PALETTE = {
  skin: '#e8b48f',
  skin2: '#c98d66',
  hair: '#2b2220',
  pants: '#2f3a4a',
  desk: '#f3f1ec',
  deskLeg: '#9aa3ad',
  wood: '#a87b55',
  metal: '#c7ced6',
  dark: '#2b313a',
  darker: '#1c2027',
  coal: '#2a2a2c',
  ground: '#acc4a1',
  white: '#ffffff',
  paper: '#fbfaf6',
};

/** Bayangan "blob" lembut — jauh lebih murah dibanding shadow map real-time */
export const shadowTexture = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(20,30,45,0.45)');
  g.addColorStop(0.6, 'rgba(20,30,45,0.15)');
  g.addColorStop(1, 'rgba(20,30,45,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

export const shadowMaterial = new THREE.MeshBasicMaterial({
  map: shadowTexture,
  transparent: true,
  depthWrite: false,
  toneMapped: false,
});

export const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
