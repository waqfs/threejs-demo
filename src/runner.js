import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function report(type, details = {}) {
  parent.postMessage({ type, ...details }, '*');
}

function describe(error) {
  const location = error.stack?.match(/<anonymous>:(\d+):(\d+)/);
  const line = location && Number(location[1]) - 3;
  return `${line > 0 ? `Line ${line}: ` : ''}${error.message ?? error}`;
}

function start() {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', 'Rendered Three.js scene');
  document.body.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.autoClear = false;

  const guides = new THREE.Scene();
  const grid = new THREE.GridHelper(64, 64, 0x41536f, 0x35435d);
  grid.position.y = -1.35;
  grid.material.transparent = true;
  grid.material.opacity = 0.38;
  guides.add(grid);
  guides.fog = new THREE.Fog(0x151e2d, 4, 20);

  let program;
  let frame;
  let width = 1;
  let height = 1;

  function fitCamera({ camera, wideView }) {
    const aspect = width / height;
    camera.aspect = aspect;
    // Leave room for the position exercise at x = ±2, including on phones.
    const minAspect = wideView ? 1.78 : 1.12;
    const verticalAngle = Math.tan(THREE.MathUtils.degToRad(21));
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(verticalAngle / Math.min(1, aspect / minAspect)));
    camera.updateProjectionMatrix();
  }

  function draw(scene, camera) {
    renderer.clear();
    if (program.showGrid && !scene.background) renderer.render(guides, camera);
    renderer.render(scene, camera);
    program.drewFrame = true;
  }

  function renderFrame(now) {
    try {
      program.drewFrame = false;
      program.animate?.call(undefined, now - program.started);
      if (!program.manualRender && !program.drewFrame) draw(program.scene, program.camera);
      frame = requestAnimationFrame(renderFrame);
      return true;
    } catch (error) {
      report('error', { id: program.id, message: describe(error) });
      return false;
    }
  }

  function disposeScene(scene) {
    const resources = new Set();
    scene.traverse(({ geometry, material }) => {
      if (geometry) resources.add(geometry);
      for (const item of [material].flat()) {
        if (!item) continue;
        resources.add(item);
        for (const value of Object.values(item)) {
          if (value?.isTexture) resources.add(value);
        }
      }
    });
    for (const texture of [scene.background, scene.environment]) {
      if (texture?.isTexture) resources.add(texture);
    }
    for (const resource of resources) resource.dispose();
  }

  function load({ code, id, showGrid, wideView }) {
    cancelAnimationFrame(frame);
    renderer.clear();
    if (program) {
      program.controls.dispose();
      disposeScene(program.scene);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 200);
    camera.position.z = 5;
    fitCamera({ camera, wideView });
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.minDistance = 1;
    controls.maxDistance = 30;

    program = { id, scene, camera, controls, showGrid, wideView, started: performance.now() };
    const current = program;
    const sketchRenderer = {
      render: (scene, camera) => draw(scene, camera),
      setAnimationLoop(callback) {
        current.animate = callback;
        current.manualRender = Boolean(callback);
      },
    };

    try {
      const evaluate = new Function('THREE', 'scene', 'camera', 'renderer',
        `"use strict";\n${code}\nreturn typeof animate === "function" ? animate : undefined;`);
      const animate = evaluate(THREE, scene, camera, sketchRenderer);
      if (!program.manualRender) program.animate = animate;
      // OrbitControls looks at the origin. Preserve the snippet's chosen camera transform until interaction.
      controls.saveState();
      if (renderFrame(performance.now())) report('running', { id });
    } catch (error) {
      report('error', { id, message: describe(error) });
    }
  }

  new ResizeObserver(([entry]) => {
    width = Math.max(1, entry.contentRect.width);
    height = Math.max(1, entry.contentRect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    if (program) fitCamera(program);
  }).observe(document.body);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') report('escape');
  });

  window.addEventListener('message', ({ source, data }) => {
    if (source !== parent) return;
    if (data?.type === 'run') load(data);
    if (data?.type === 'reset-view') program?.controls.reset();
  });

  report('ready');
}

try {
  start();
} catch {
  report('unavailable', { message: 'WebGL 2 is unavailable in this browser.' });
}
