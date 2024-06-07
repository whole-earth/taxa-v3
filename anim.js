import { initCellRenderer } from './cellInit.js';
import { initFigureRenderer } from './figureInit.js';
import { textFadeInit } from './text.js';
import { scaleTransformRenderer } from './transition-wip.js';

document.addEventListener('DOMContentLoaded', async function () {
  await Promise.all([initCellRenderer(), initFigureRenderer()]);
  scaleTransformRenderer();
  textFadeInit();
});

export function threeSceneResize(render, camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  render.setSize(window.innerWidth, window.innerHeight);
}