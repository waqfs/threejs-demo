const mesh = `const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
});
const cube = new THREE.Mesh(geometry, material);`;

const cube = `${mesh}
scene.add(cube);`;

const tilt = `cube.rotation.set(0.28, 0.42, 0);`;

const animation = `function animate(time) {
  cube.rotation.y = time * 0.001;
}`;

export const presets = [
  {
    id: 'playground',
    label: 'Playground',
    code: `${cube}

function animate(time) {
  cube.rotation.x = 0.35;
  cube.rotation.y = time * 0.001;
}`,
  },
  {
    id: 'viewpoint',
    label: 'Viewpoint',
    code: `${cube}
${tilt}

// Try 3 or 8. What changes on screen?
camera.position.z = 5;`,
  },
  {
    id: 'mesh',
    label: 'Mesh',
    code: `// Change the first 1 to 2 to make the box wider.
${cube}

${tilt}`,
  },
  {
    id: 'position',
    label: 'Position',
    wideView: true,
    code: `${cube}

camera.position.z = 5;
cube.position.x = 2;
${tilt}

// Mark the starting position in gray.
const origin = new THREE.Mesh(
  geometry,
  new THREE.MeshBasicMaterial({ color: 0x718096, wireframe: true })
);
origin.rotation.copy(cube.rotation);
scene.add(origin);`,
  },
  {
    id: 'animation',
    label: 'Animation',
    code: `${cube}

// Try 0.002, 0, or a negative value.
${animation}`,
  },
  {
    id: 'your-turn',
    label: 'Your turn',
    wideView: true,
    code: `// Make the cube blue, move it left, and spin it around x.

${cube}

${animation}`,
  },
  {
    id: 'debugging',
    label: 'Debugging',
    code: `// The preview is blank. Add the missing line.

${mesh}
${tilt}
camera.position.z = 5;`,
    showGrid: false,
  },
];
