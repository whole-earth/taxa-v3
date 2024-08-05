import { initCellRenderer } from './cellInit.js';
import { textFadeInit } from './text.js';

document.addEventListener('DOMContentLoaded', async function () {
  await initCellRenderer();
  // textTransitionInit();
});

export function threeSceneResize(render, camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  render.setSize(window.innerWidth, window.innerHeight);
}