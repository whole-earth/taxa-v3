import { initCellRenderer } from './cellInit.js';
import { initProductRenderer } from './productInit.js';
import { textFadeInit } from './text.js';
import { scaleTransform } from './transition.js';

document.addEventListener('DOMContentLoaded', async function () {
  await Promise.all([initCellRenderer(), initProductRenderer()]);
  scaleTransform();
  textFadeInit();
});

export function threeSceneResize(render, camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  render.setSize(window.innerWidth, window.innerHeight);
}