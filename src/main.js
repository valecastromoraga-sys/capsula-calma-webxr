import './style.css';
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

const app = document.querySelector('#app');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4efe6);
scene.fog = new THREE.FogExp2(0xf4efe6, 0.055);

const camera = new THREE.PerspectiveCamera(
  68,
  window.innerWidth / window.innerHeight,
  0.1,
  60,
);
camera.position.set(0, 1.55, 4.1);
camera.lookAt(0, 1.35, -0.4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
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
const pointer = new THREE.Vector2(10, 10);

const modeState = {
  current: 'regularme',
  targetBackground: new THREE.Color(0xf4efe6),
  targetFog: new THREE.Color(0xf1dfcf),
  wall: new THREE.Color(0xf6efe4),
  floor: new THREE.Color(0xe9dfd3),
  accent: new THREE.Color(0xf3a35f),
  secondary: new THREE.Color(0xf6c7b4),
  darkness: 1,
  pulseSpeed: 0.45,
  particleDrift: 0.08,
};

const modes = {
  regularme: {
    label: 'Necesito regularme',
    background: 0xf6eadc,
    fog: 0xf2d8c5,
    wall: 0xf8f0e7,
    floor: 0xeedfcf,
    accent: 0xef9b5a,
    secondary: 0xf4b5a6,
    text: 0x40271f,
    darkness: 1.05,
    pulseSpeed: 0.52,
    particleDrift: 0.07,
    audio: 'regularme',
    ambient: 'ambiente-regularme',
  },
  pausa: {
    label: 'Necesito tomar una pausa',
    background: 0x202236,
    fog: 0x2b2d45,
    wall: 0xd9d7df,
    floor: 0xbfc3d4,
    accent: 0x7771b6,
    secondary: 0xc5b6dd,
    text: 0x29253f,
    darkness: 0.46,
    pulseSpeed: 0.18,
    particleDrift: 0.018,
    audio: 'pausa',
    ambient: 'ambiente-pausa',
  },
  reenfocarme: {
    label: 'Necesito reenfocarme',
    background: 0xe8f7f8,
    fog: 0xd6f0f0,
    wall: 0xf2fbf7,
    floor: 0xd8eee9,
    accent: 0x68c9d5,
    secondary: 0x8bdcba,
    text: 0x113a44,
    darkness: 1.16,
    pulseSpeed: 0.34,
    particleDrift: 0.035,
    audio: 'reenfocarme',
    ambient: 'ambiente-reenfocarme',
  },
};

const capsule = new THREE.Group();
scene.add(capsule);

const shellMaterial = new THREE.MeshStandardMaterial({
  color: modeState.wall,
  roughness: 0.96,
  metalness: 0.01,
  side: THREE.BackSide,
});

const shell = new THREE.Mesh(new THREE.SphereGeometry(4.8, 96, 48), shellMaterial);
shell.scale.set(1.05, 0.62, 1);
shell.position.y = 1.55;
shell.receiveShadow = true;
capsule.add(shell);

const rearPanel = new THREE.Mesh(
  new THREE.CircleGeometry(3.1, 96),
  new THREE.MeshStandardMaterial({
    color: modeState.wall.clone().multiplyScalar(0.96),
    roughness: 0.98,
    metalness: 0,
    side: THREE.DoubleSide,
  }),
);
rearPanel.position.set(0, 1.55, -3.18);
rearPanel.scale.y = 0.72;
capsule.add(rearPanel);

const floorMaterial = new THREE.MeshStandardMaterial({
  color: modeState.floor,
  roughness: 0.9,
  metalness: 0.02,
});
const floor = new THREE.Mesh(new THREE.CircleGeometry(3.85, 128), floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
capsule.add(floor);

const floorGlow = new THREE.Mesh(
  new THREE.RingGeometry(1.05, 3.35, 128),
  new THREE.MeshBasicMaterial({
    color: modeState.accent,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
floorGlow.rotation.x = -Math.PI / 2;
floorGlow.position.y = 0.018;
capsule.add(floorGlow);

const ringLightMesh = new THREE.Mesh(
  new THREE.TorusGeometry(1.35, 0.028, 16, 160),
  new THREE.MeshBasicMaterial({
    color: modeState.accent,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  }),
);
ringLightMesh.rotation.x = Math.PI / 2;
ringLightMesh.position.set(0, 2.78, -0.72);
capsule.add(ringLightMesh);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xd9cab8, 1.8);
scene.add(hemisphereLight);

const topLight = new THREE.PointLight(modeState.accent, 6.5, 8);
topLight.position.copy(ringLightMesh.position);
scene.add(topLight);

const floorLight = new THREE.PointLight(modeState.secondary, 2.8, 7);
floorLight.position.set(0, 0.28, -0.25);
scene.add(floorLight);

const softFrontLight = new THREE.DirectionalLight(0xffffff, 0.9);
softFrontLight.position.set(0, 2.8, 2.4);
scene.add(softFrontLight);

const wallDots = createWallDots();
capsule.add(wallDots.group);

const focusLines = createFocusLines();
capsule.add(focusLines);

const prompt = createTextPlane('¿Cómo quieres acompañar este momento?', {
  width: 1024,
  height: 160,
  fontSize: 46,
  textColor: '#54493d',
  transparentBackground: true,
});
prompt.position.set(0, 2.48, -1.55);
prompt.scale.set(3.65, 0.32, 1);
prompt.renderOrder = 40;
capsule.add(prompt);

const buttonGroup = new THREE.Group();
buttonGroup.position.set(0, 1.25, -1.55);
capsule.add(buttonGroup);

const buttonMeshes = [];
const buttonLabels = [];
Object.entries(modes).forEach(([key, mode], index) => {
  const button = new THREE.Mesh(
    new THREE.PlaneGeometry(3.05, 0.72),
    new THREE.MeshBasicMaterial({
      map: createButtonTexture(mode.label, mode),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  button.position.set(0, (1 - index) * 0.88, 0);
  button.renderOrder = 30;
  button.userData.mode = key;
  button.userData.baseScale = new THREE.Vector3(1, 1, 1);
  button.userData.targetGlow = key === modeState.current ? 1 : 0.62;
  buttonMeshes.push(button);
  buttonGroup.add(button);

  const label = createTextPlane(mode.label, {
    width: 1024,
    height: 210,
    fontSize: 74,
    textColor: `#${mode.text.toString(16).padStart(6, '0')}`,
    transparentBackground: true,
    maxWidth: 850,
    lineHeight: 80,
  });
  label.position.set(button.position.x, button.position.y, 0.018);
  label.scale.set(2.85, 0.62, 1);
  label.renderOrder = 50;
  label.userData.mode = key;
  buttonLabels.push(label);
  buttonGroup.add(label);
});

const controllerModelFactory = new XRControllerModelFactory();
const controllers = [0, 1].map((index) => {
  const controller = renderer.xr.getController(index);
  controller.userData.hoveredButton = null;
  controller.addEventListener('selectstart', () => onSelectStart(controller));
  scene.add(controller);

  const pointer = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]),
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
    }),
  );
  pointer.scale.z = 2.7;
  controller.add(pointer);

  const grip = renderer.xr.getControllerGrip(index);
  grip.add(controllerModelFactory.createControllerModel(grip));
  scene.add(grip);

  return controller;
});

const audioLibrary = createAudioLibrary();
let audioUnlocked = false;
let welcomePlayed = false;
let activeAmbient = null;

renderer.xr.addEventListener('sessionstart', () => {
  unlockAudio();
});

window.addEventListener(
  'pointerdown',
  (event) => {
    unlockAudio();
    updatePointer(event);
    const button = getPointerButton();
    if (button) {
      setMode(button.userData.mode, { playCue: true });
      pulseButton(button);
    }
  },
);

window.addEventListener('pointermove', (event) => {
  updatePointer(event);
});

function createWallDots() {
  const group = new THREE.Group();
  const dots = [];

  for (let i = 0; i < 64; i += 1) {
    const theta = THREE.MathUtils.degToRad(210 + Math.random() * 120);
    const y = 0.6 + Math.random() * 1.95;
    const radius = 3.38 + Math.random() * 0.18;
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.012 + Math.random() * 0.017, 18),
      new THREE.MeshBasicMaterial({
        color: modeState.secondary,
        transparent: true,
        opacity: 0.25 + Math.random() * 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    dot.position.set(Math.sin(theta) * radius, y, Math.cos(theta) * radius);
    dot.lookAt(0, y, 0);
    dot.userData.phase = Math.random() * Math.PI * 2;
    dot.userData.baseOpacity = dot.material.opacity;
    group.add(dot);
    dots.push(dot);
  }

  return { group, dots };
}

function createFocusLines() {
  const group = new THREE.Group();

  for (let i = 0; i < 5; i += 1) {
    const y = 0.88 + i * 0.18;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.45, y, -3.05),
      new THREE.Vector3(-0.52, y + 0.03, -3.18),
      new THREE.Vector3(0.52, y + 0.03, -3.18),
      new THREE.Vector3(1.45, y, -3.05),
    ]);
    const line = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.006, 8, false),
      new THREE.MeshBasicMaterial({
        color: modeState.secondary,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    line.userData.phase = i * 0.4;
    group.add(line);
  }

  return group;
}

function createTextPlane(text, options) {
  const texture = createTextTexture(text, options);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  plane.renderOrder = 25;
  return plane;
}

function createButtonTexture(text, mode) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const accent = `#${mode.accent.toString(16).padStart(6, '0')}`;
  const secondary = `#${mode.secondary.toString(16).padStart(6, '0')}`;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(255, 252, 246, 0.88)';
  roundRect(context, 30, 30, canvas.width - 60, canvas.height - 60, 74);
  context.fill();

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, accent);
  gradient.addColorStop(1, secondary);
  context.strokeStyle = gradient;
  context.lineWidth = 10;
  context.stroke();

  context.shadowColor = accent;
  context.shadowBlur = 22;
  context.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  context.lineWidth = 3;
  context.stroke();
  context.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createTextTexture(text, options) {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = options.textColor;
  context.globalAlpha = 0.86;
  context.font = `700 ${options.fontSize}px Inter, Arial, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  if (options.maxWidth) {
    wrapCanvasText(
      context,
      text,
      canvas.width / 2,
      canvas.height / 2,
      options.maxWidth,
      options.lineHeight,
    );
  } else {
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (context.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  lines.push(current);

  const offset = ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    context.fillText(line, x, y - offset + index * lineHeight);
  });
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

function createAudioLibrary() {
  const files = {
    bienvenida: '/audio/bienvenida.mp3',
    regularme: '/audio/regularme.mp3',
    pausa: '/audio/pausa.mp3',
    reenfocarme: '/audio/reenfocarme.mp3',
    'ambiente-regularme': '/audio/ambiente-regularme.mp3',
    'ambiente-pausa': '/audio/ambiente-pausa.mp3',
    'ambiente-reenfocarme': '/audio/ambiente-reenfocarme.mp3',
  };

  return Object.fromEntries(
    Object.entries(files).map(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.loop = key.startsWith('ambiente-');
      audio.volume = key.startsWith('ambiente-') ? 0.34 : 0.78;
      audio.addEventListener('error', () => {
        console.warn(`Audio no disponible: ${src}`);
      });
      return [key, audio];
    }),
  );
}

function unlockAudio() {
  audioUnlocked = true;
  if (!welcomePlayed) {
    welcomePlayed = true;
    playAudio('bienvenida');
  }
  playAmbient(modes[modeState.current].ambient);
}

function playAudio(key) {
  const audio = audioLibrary[key];
  if (!audio || !audioUnlocked) return;
  audio.currentTime = 0;
  audio.play().catch(() => {
    console.warn(`Audio no disponible o bloqueado por el navegador: ${audio.src}`);
  });
}

function playAmbient(key) {
  const next = audioLibrary[key];
  if (!next || !audioUnlocked) return;

  if (activeAmbient && activeAmbient !== next) {
    activeAmbient.pause();
    activeAmbient.currentTime = 0;
  }

  activeAmbient = next;
  activeAmbient.play().catch(() => {
    console.warn(`Audio ambiente no disponible o bloqueado: ${next.src}`);
  });
}

function onSelectStart(controller) {
  unlockAudio();
  const button = getPointedButton(controller);
  if (!button) return;
  setMode(button.userData.mode, { playCue: true });
  pulseButton(button);
}

function getPointedButton(controller) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  const hits = raycaster.intersectObjects(buttonMeshes, false);
  return hits.length && hits[0].distance < 4.2 ? hits[0].object : null;
}

function updatePointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function getPointerButton() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(buttonMeshes, false);
  return hits.length ? hits[0].object : null;
}

function pulseButton(button) {
  button.scale.set(1.08, 1.08, 1);
  setTimeout(() => {
    button.scale.copy(button.userData.baseScale);
  }, 140);
}

function setMode(key, options = {}) {
  const mode = modes[key];
  modeState.current = key;
  modeState.targetBackground.setHex(mode.background);
  modeState.targetFog.setHex(mode.fog);
  modeState.wall.setHex(mode.wall);
  modeState.floor.setHex(mode.floor);
  modeState.accent.setHex(mode.accent);
  modeState.secondary.setHex(mode.secondary);
  modeState.darkness = mode.darkness;
  modeState.pulseSpeed = mode.pulseSpeed;
  modeState.particleDrift = mode.particleDrift;

  buttonMeshes.forEach((button) => {
    const active = button.userData.mode === key;
    button.userData.targetGlow = active ? 1 : 0.62;
    button.userData.baseScale.set(active ? 1.04 : 1, active ? 1.04 : 1, 1);
    button.scale.copy(button.userData.baseScale);
  });

  if (options.playCue) {
    playAudio(mode.audio);
  }
  playAmbient(mode.ambient);
}

function updateControllers() {
  const pointerButton = getPointerButton();

  controllers.forEach((controller) => {
    const hoveredButton = getPointedButton(controller);
    if (controller.userData.hoveredButton && controller.userData.hoveredButton !== hoveredButton) {
      controller.userData.hoveredButton.userData.targetGlow =
        controller.userData.hoveredButton.userData.mode === modeState.current ? 1 : 0.62;
    }
    if (hoveredButton) {
      hoveredButton.userData.targetGlow = 1.16;
    }
    controller.userData.hoveredButton = hoveredButton;
  });

  buttonMeshes.forEach((button) => {
    if (button === pointerButton) {
      button.userData.targetGlow = 1.16;
    } else if (!controllers.some((controller) => controller.userData.hoveredButton === button)) {
      button.userData.targetGlow = button.userData.mode === modeState.current ? 1 : 0.62;
    }
  });
}

function updateCapsule(delta, elapsed) {
  const breath = 0.5 + 0.5 * Math.sin(elapsed * modeState.pulseSpeed * Math.PI * 2);
  const breatheOpacity = 0.1 + breath * 0.12;

  scene.background.lerp(modeState.targetBackground, 0.018);
  scene.fog.color.lerp(modeState.targetFog, 0.018);
  shellMaterial.color.lerp(modeState.wall, 0.018);
  rearPanel.material.color.lerp(modeState.wall.clone().multiplyScalar(0.96), 0.018);
  floorMaterial.color.lerp(modeState.floor, 0.018);

  ringLightMesh.material.color.lerp(modeState.accent, 0.05);
  ringLightMesh.material.opacity = 0.42 + breath * 0.38;
  ringLightMesh.scale.setScalar(1 + breath * 0.012);

  floorGlow.material.color.lerp(modeState.accent, 0.05);
  floorGlow.material.opacity = breatheOpacity;

  topLight.color.lerp(modeState.accent, 0.05);
  topLight.intensity = 3.6 * modeState.darkness + breath * 2.1;
  floorLight.color.lerp(modeState.secondary, 0.05);
  floorLight.intensity = 1.4 * modeState.darkness + breath * 1.4;
  hemisphereLight.intensity = 0.9 + modeState.darkness * 0.9;

  wallDots.dots.forEach((dot, index) => {
    dot.material.color.lerp(index % 2 ? modeState.accent : modeState.secondary, 0.04);
    dot.material.opacity =
      dot.userData.baseOpacity * (0.45 + breath * 0.65) * modeState.darkness;
    dot.position.y +=
      Math.sin(elapsed * 0.18 + dot.userData.phase) * modeState.particleDrift * delta;
  });

  focusLines.children.forEach((line, index) => {
    line.material.color.lerp(modeState.secondary, 0.04);
    line.material.opacity =
      modeState.current === 'reenfocarme'
        ? 0.16 + Math.sin(elapsed * 0.55 + index) * 0.025
        : 0.035;
  });

  buttonMeshes.forEach((button) => {
    const target = button.userData.targetGlow;
    button.material.opacity = THREE.MathUtils.lerp(button.material.opacity, target, 0.12);
  });
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  updateControllers();
  updateCapsule(delta, elapsed);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setMode('regularme');
renderer.setAnimationLoop(animate);
