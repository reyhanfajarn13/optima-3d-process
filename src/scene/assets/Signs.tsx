import { Suspense, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vec3 } from '../../data/process';
import { TEM_LOGO } from '../../data/brands';
import { G } from '../materials';
import { Box } from './primitives';

const signs = new Map<string, THREE.MeshBasicMaterial>();
function signMaterial(text: string, subtitle: string, color: string) {
  const key = `${text}|${subtitle}|${color}`;
  if (signs.has(key)) return signs.get(key)!;
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color; ctx.fillRect(0, 0, 1024, 256);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff'; ctx.font = '700 70px "Segoe UI", sans-serif';
  ctx.fillText(text, 512, subtitle ? 92 : 128, 950);
  if (subtitle) { ctx.fillStyle = '#d7e9ee'; ctx.font = '500 35px "Segoe UI", sans-serif'; ctx.fillText(subtitle, 512, 183, 950); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({map: texture, toneMapped: false});
  signs.set(key, material);
  return material;
}

export function Sign({ text, subtitle = '', width = 4, position = [0, 0, 0], color = '#173a63' }: { text: string; subtitle?: string; width?: number; position?: Vec3; color?: string }) {
  const material = useMemo(() => signMaterial(text, subtitle, color), [text, subtitle, color]);
  return <mesh geometry={G.plane} material={material} position={position} scale={[width, width / 4, 1]} />;
}

function LogoFace({ src, width, height }: { src: string; width: number; height: number }) {
  const texture = useLoader(THREE.TextureLoader, src);
  texture.colorSpace = THREE.SRGBColorSpace;
  return <mesh geometry={G.plane} position={[0, 0, 0.061]} scale={[width, height, 1]}><meshBasicMaterial map={texture} toneMapped={false} transparent /></mesh>;
}

export function LogoPanel({ brand, width = 4, position = [0, 0, 0] }: { brand: 'tem' | 'optima' | 'oracle-netsuite'; width?: number; position?: Vec3 }) {
  const assets = { tem: { src: TEM_LOGO, ratio: 46 / 181 }, optima: { src: '/brands/optima.jpeg', ratio: 1111 / 1600 }, 'oracle-netsuite': { src: '/brands/oracle-netsuite.svg', ratio: 11 / 32 } };
  const asset = assets[brand];
  const height = width * asset.ratio;
  return <group position={position}>
    <Box color="#ffffff" scale={[width + 0.15, height + 0.15, 0.12]} />
    <Suspense fallback={null}><LogoFace src={asset.src} width={width} height={height} /></Suspense>
  </group>;
}
