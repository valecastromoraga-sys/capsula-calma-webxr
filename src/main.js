import './style.css';
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

const app = document.querySelector('#app');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071018);
scene.fog = new THREE.FogExp2(0x071018, 0.045);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  80,
);
camera.position.set(0, 1.65, 4.3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const vrButton = VRButton.createButton(renderer);
vrButton.classList.add('vr-entry');
document.body.appendChild(vrButton);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();
const lastControllerPositions = new WeakMap();
const controllerVelocities = new WeakMap();

const modeState = {
  current: 'aurora',
  targetColor: new THREE.Color(0x071018),
  targetFog: new THREE.Color(0x071018),
  accent: new THREE.Color(0x8bd3dd),
};

const modes = {
  aurora: {
    label: 'Aurora',
    color: 0x071018,
    fog: 0x0a1022,
    accent: 0x93f5d8,
    secondary: 0xe1a4ff,
    light: 0x91ffe1,
  },
  ocean: {
    label: 'Oceano',
    color: 0x061923,
    fog: 0x092a38,
    accent: 0x60d6ff,
    secondary: 0x4a8bff,
    light: 0x8fe7ff,
  },
  forest: {
    label: 'Bosque',
    color: 0x10180f,
    fog: 0x162414,
    accent: 0xa4e96f,
    secondary: 0xffc879,
    light: 0xd8ffae,
  },
};

const room = new THREE.Group();
scene.add(room);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(7, 96),
  new THREE.MeshStandardMaterial({
    color: 0x142125,
    roughness: 0.86,
    metalness: 0.02,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
room.add(floor);

const dome = new THREE.Mesh(
  new THREE.SphereGeometry(18, 64, 32),
  new THREE.MeshBasicMaterial({
    color: 0x071018,
    side: THREE.BackSide,
  }),
);
room.add(dome);

const hemisphereLight = new THREE.HemisphereLight(0xdffcff, 0x182120, 1.45);
scene.add(hemisphereLight);

const mainLight = new THREE.DirectionalLight(0xbdf9ff, 2.2);
mainLight.position.set(-2.5, 5, 3);
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(1024, 1024);
scene.add(mainLight);

const accentLight = new THREE.PointLight(0x93f5d8, 6, 10);
accentLight.position.set(0, 2.4, -2.5);
scene.add(accentLight);

const createGlowMaterial = (color, opacity = 0.56) =>
  new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

const ribbons = Array.from({ length: 5 }, (_, index) => {
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 10 }, (__, pointIndex) => {
      const x = (pointIndex - 4.5) * 0.9;
      const y = 2.8 + Math.sin(pointIndex * 0.9 + index) * 0.22;
      const z = -4.4 - index * 0.22;
      return new THREE.Vector3(x, y, z);
    }),
  );

  const ribbon = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 96, 0.018 + index * 0.004, 8, false),
    createGlowMaterial(index % 2 ? modes.aurora.secondary : modes.aurora.accent),
  );
  ribbon.userData.phase = index * 0.72;
  room.add(ribbon);
  return ribbon;
});

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 180;
const particlePositions = new Float32Array(particleCount * 3);
const particleSeeds = [];
for (let i = 0; i < particleCount; i += 1) {
  const radius = 2.2 + Math.random() * 4.2;
  const angle = Math.random() * Math.PI * 2;
  particlePositions[i * 3] = Math.cos(angle) * radius;
  particlePositions[i * 3 + 1] = 0.8 + Math.random() * 3.3;
  particlePositions[i * 3 + 2] = Math.sin(angle) * radius - 1.2;
  particleSeeds.push(Math.random() * 100);
}
particleGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(particlePositions, 3),
);
const particles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({
    color: modes.aurora.accent,
    size: 0.045,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  }),
);
room.add(particles);

const buttonGroup = new THREE.Group();
buttonGroup.position.set(0, 2.15, -2.05);
scene.add(buttonGroup);

const buttonMeshes = [];
const modeKeys = Object.keys(modes);

modeKeys.forEach((key, index) => {
  const mode = modes[key];
  const button = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 0.4),
    new THREE.MeshBasicMaterial({
      map: createButtonTexture(mode.label, mode.accent),
      transparent: true,
      opacity: key === modeState.current ? 1 : 0.78,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    }),
  );
  button.position.set((index - 1) * 2.05, 0, 0);
  button.scale.set(1.55, 1.55, 1);
  button.renderOrder = 20;
  button.frustumCulled = false;
  button.userData.mode = key;
  button.userData.baseScale = new THREE.Vector3(1.55, 1.55, 1);
  buttonGroup.add(button);
  buttonMeshes.push(button);
});

function createButtonTexture(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  const background = `#${color.toString(16).padStart(6, '0')}`;
  context.fillStyle = background;
  roundRect(context, 18, 18, canvas.width - 36, canvas.height - 36, 28);
  context.fill();
  context.strokeStyle = 'rgba(239,255,248,0.78)';
  context.lineWidth = 6;
  context.stroke();

  context.fillStyle = '#06121c';
  context.font = '800 70px Inter, Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

const interactables = [];
const objectMaterials = [
  new THREE.MeshStandardMaterial({
    color: 0x9fe7ff,
    roughness: 0.38,
    metalness: 0.1,
    emissive: 0x193b45,
  }),
  new THREE.MeshStandardMaterial({
    color: 0xffd38a,
    roughness: 0.5,
    metalness: 0.05,
    emissive: 0x402a10,
  }),
  new THREE.MeshStandardMaterial({
    color: 0xb9ff9b,
    roughness: 0.6,
    metalness: 0.03,
    emissive: 0x17380e,
  }),
];

const objectGeometries = [
  new THREE.IcosahedronGeometry(0.22, 2),
  new THREE.SphereGeometry(0.2, 32, 16),
  new THREE.OctahedronGeometry(0.24, 1),
  new THREE.TorusKnotGeometry(0.14, 0.045, 80, 12),
  new THREE.BoxGeometry(0.34, 0.34, 0.34),
];

for (let i = 0; i < 9; i += 1) {
  const object = new THREE.Mesh(
    objectGeometries[i % objectGeometries.length],
    objectMaterials[i % objectMaterials.length].clone(),
  );
  object.position.set(
    (i % 3 - 1) * 0.82,
    0.76 + Math.floor(i / 3) * 0.36,
    -1.95 - Math.floor(i / 3) * 0.3,
  );
  object.castShadow = true;
  object.receiveShadow = true;
  object.userData.velocity = new THREE.Vector3();
  object.userData.radius = 0.26;
  object.userData.floatPhase = i * 0.51;
  room.add(object);
  interactables.push(object);
}

const controllerGroup = new THREE.Group();
scene.add(controllerGroup);

const controllerModelFactory = new XRControllerModelFactory();
const controllers = [0, 1].map((index) => {
  const controller = renderer.xr.getController(index);
  controller.userData.index = index;
  controller.userData.isSelecting = false;
  controller.userData.grabbed = null;
  controller.userData.hoveredButton = null;
  controller.addEventListener('selectstart', () => onSelectStart(controller));
  controller.addEventListener('selectend', () => onSelectEnd(controller));
  controllerGroup.add(controller);

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 }),
  );
  line.name = 'pointer';
  line.scale.z = 2.5;
  controller.add(line);

  const grip = renderer.xr.getControllerGrip(index);
  grip.add(controllerModelFactory.createControllerModel(grip));
  controllerGroup.add(grip);

  return controller;
});

function onSelectStart(controller) {
  controller.userData.isSelecting = true;

  const button = getPointedButton(controller);
  if (button) {
    setMode(button.userData.mode);
    pulseButton(button);
    return;
  }

  const object = getNearestObject(controller);
  if (!object) return;

  controller.userData.grabbed = object;
  object.userData.wasGrabbed = true;
  object.userData.velocity.set(0, 0, 0);
  controller.attach(object);
}

function onSelectEnd(controller) {
  controller.userData.isSelecting = false;
  const grabbed = controller.userData.grabbed;
  if (!grabbed) return;

  room.attach(grabbed);
  const velocity = controllerVelocities.get(controller) || new THREE.Vector3();
  grabbed.userData.velocity.copy(velocity).multiplyScalar(1.2);
  controller.userData.grabbed = null;
}

function getPointedButton(controller) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  const hits = raycaster.intersectObjects(buttonMeshes, false);
  return hits.length && hits[0].distance < 4 ? hits[0].object : null;
}

function getNearestObject(controller) {
  const controllerPosition = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
  let nearest = null;
  let nearestDistance = 0.34;

  for (const object of interactables) {
    if (object.parent !== room) continue;
    const distance = controllerPosition.distanceTo(object.position);
    if (distance < nearestDistance) {
      nearest = object;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function pulseButton(button) {
  button.scale.copy(button.userData.baseScale).multiplyScalar(1.1);
  setTimeout(() => button.scale.copy(button.userData.baseScale), 130);
}

function setMode(key) {
  const mode = modes[key];
  modeState.current = key;
  modeState.targetColor.setHex(mode.color);
  modeState.targetFog.setHex(mode.fog);
  modeState.accent.setHex(mode.accent);

  buttonMeshes.forEach((button) => {
    const active = button.userData.mode === key;
    button.material.opacity = active ? 1 : 0.72;
    button.userData.baseScale.set(active ? 1.68 : 1.55, active ? 1.68 : 1.55, 1);
    button.scale.copy(button.userData.baseScale);
    button.position.z = active ? 0.04 : 0;
  });

  accentLight.color.setHex(mode.light);
  particles.material.color.setHex(mode.accent);
  ribbons.forEach((ribbon, index) => {
    ribbon.material.color.setHex(index % 2 ? mode.secondary : mode.accent);
  });
}

function updateControllers(delta) {
  controllers.forEach((controller) => {
    const current = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
    const previous = lastControllerPositions.get(controller) || current.clone();
    controllerVelocities.set(
      controller,
      current.clone().sub(previous).divideScalar(Math.max(delta, 0.001)),
    );
    lastControllerPositions.set(controller, current);

    const hoveredButton = getPointedButton(controller);
    if (controller.userData.hoveredButton && controller.userData.hoveredButton !== hoveredButton) {
      controller.userData.hoveredButton.scale.copy(
        controller.userData.hoveredButton.userData.baseScale,
      );
    }
    if (hoveredButton && !controller.userData.isSelecting) {
      hoveredButton.scale.copy(hoveredButton.userData.baseScale).multiplyScalar(1.04);
    }
    controller.userData.hoveredButton = hoveredButton;
  });
}

function updateObjects(delta, elapsed) {
  for (const object of interactables) {
    if (object.parent !== room) continue;

    if (!object.userData.wasGrabbed) {
      object.position.y += Math.sin(elapsed * 0.85 + object.userData.floatPhase) * 0.0009;
      object.rotation.x += delta * 0.18;
      object.rotation.y += delta * 0.24;
      continue;
    }

    object.userData.velocity.y -= 1.15 * delta;
    object.position.addScaledVector(object.userData.velocity, delta);
    object.userData.velocity.multiplyScalar(0.992);
    object.rotation.x += object.userData.velocity.z * delta;
    object.rotation.z -= object.userData.velocity.x * delta;

    if (object.position.y < object.userData.radius) {
      object.position.y = object.userData.radius;
      object.userData.velocity.y = Math.abs(object.userData.velocity.y) * 0.42;
      object.userData.velocity.x *= 0.82;
      object.userData.velocity.z *= 0.82;
    }

    const horizontal = new THREE.Vector2(object.position.x, object.position.z);
    const maxRadius = 6.1;
    if (horizontal.length() > maxRadius) {
      horizontal.setLength(maxRadius);
      object.position.x = horizontal.x;
      object.position.z = horizontal.y;
      object.userData.velocity.x *= -0.45;
      object.userData.velocity.z *= -0.45;
    }
  }
}

function updateAtmosphere(delta, elapsed) {
  scene.background.lerp(modeState.targetColor, 0.025);
  scene.fog.color.lerp(modeState.targetFog, 0.025);
  dome.material.color.lerp(modeState.targetFog, 0.018);
  floor.material.color.lerp(modeState.accent.clone().multiplyScalar(0.18), 0.012);

  accentLight.intensity = 5.6 + Math.sin(elapsed * 1.2) * 0.8;
  buttonGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.045;

  ribbons.forEach((ribbon) => {
    ribbon.position.y = Math.sin(elapsed * 0.65 + ribbon.userData.phase) * 0.08;
    ribbon.rotation.z = Math.sin(elapsed * 0.32 + ribbon.userData.phase) * 0.03;
  });

  const positions = particles.geometry.attributes.position;
  for (let i = 0; i < particleCount; i += 1) {
    positions.array[i * 3 + 1] += Math.sin(elapsed * 0.45 + particleSeeds[i]) * 0.0009;
  }
  positions.needsUpdate = true;
  particles.rotation.y += delta * 0.018;
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  updateControllers(delta);
  updateAtmosphere(delta, elapsed);
  updateObjects(delta, elapsed);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setMode('aurora');
renderer.setAnimationLoop(animate);
