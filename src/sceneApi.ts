/**
 * Jembatan imperatif antara UI DOM dan kamera 3D.
 * Sengaja tanpa import three.js agar bundle awal tetap kecil;
 * implementasinya dipasang oleh <CameraRig /> setelah scene termuat.
 */
export type DragMode = 'rotate' | 'pan';

export const sceneApi = {
  zoom: (_dir: 1 | -1): void => {},
  setDragMode: (_mode: DragMode): void => {},
};
