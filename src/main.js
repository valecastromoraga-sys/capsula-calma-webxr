import './style.css';
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const app = document.querySelector('#app');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9f9284);
scene.fog = new THREE.FogExp2(0x9f9284, 0.12);

const camera = new THREE.PerspectiveCamera(
  68,
  window.innerWidth / window.innerHeight,
  0.1,
  60,
);
camera.position.set(0, 1.5, 2.65);
camera.lookAt(0, 1.36, -1.1);

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
  targetBackground: new THREE.Color(0x9f9284),
  targetFog: new THREE.Color(0x9f8d7d),
  wall: new THREE.Color(0xd1c5b7),
  floor: new THREE.Color(0xbba994),
  accent: new THREE.Color(0xbd7141),
  secondary: new THREE.Color(0xc8877f),
  darkness: 0.42,
  pulseSpeed: 0.45,
  particleDrift: 0.028,
};

const modes = {
  regularme: {
    label: 'Regularme',
    background: 0xa49282,
    fog: 0x9d8473,
    wall: 0xd2c5b7,
    floor: 0xbda995,
    accent: 0xbf7445,
    secondary: 0xc7867c,
    text: 0x40271f,
    darkness: 0.42,
    pulseSpeed: 0.42,
    particleDrift: 0.026,
    audio: 'regularme',
    ambient: 'ambiente-regularme',
  },
  pausa: {
    label: 'Pausar',
    background: 0x171826,
    fog: 0x1b1c2c,
    wall: 0x9296a9,
    floor: 0x71798f,
    accent: 0x49477d,
    secondary: 0x776d99,
    text: 0x26223a,
    darkness: 0.24,
    pulseSpeed: 0.13,
    particleDrift: 0.008,
    audio: 'pausa',
    ambient: 'ambiente-pausa',
  },
  reenfocarme: {
    label: 'Reenfocarme',
    background: 0x9fb9ba,
    fog: 0x93abaa,
    wall: 0xcbd7d3,
    floor: 0xa7c0ba,
    accent: 0x4c99a4,
    secondary: 0x63a78e,
    text: 0x113a44,
    darkness: 0.48,
    pulseSpeed: 0.25,
    particleDrift: 0.012,
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

const shell = new THREE.Mesh(new THREE.SphereGeometry(3.45, 96, 48), shellMaterial);
shell.scale.set(1.02, 0.76, 0.92);
shell.position.y = 1.42;
shell.receiveShadow = true;
capsule.add(shell);

const ceilingSoftener = new THREE.Mesh(
  new THREE.SphereGeometry(2.35, 64, 24, 0, Math.PI * 2, 0, Math.PI * 0.5),
  new THREE.MeshStandardMaterial({
    color: modeState.wall.clone().multiplyScalar(0.92),
    roughness: 0.98,
    metalness: 0,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.42,
  }),
);
ceilingSoftener.position.set(0, 1.9, -0.42);
ceilingSoftener.scale.set(1.15, 0.62, 0.92);
capsule.add(ceilingSoftener);

const rearPanel = new THREE.Mesh(
  new THREE.CircleGeometry(2.35, 96),
  new THREE.MeshStandardMaterial({
    color: modeState.wall.clone().multiplyScalar(0.96),
    roughness: 0.98,
    metalness: 0,
    side: THREE.DoubleSide,
  }),
);
rearPanel.position.set(0, 1.45, -2.16);
rearPanel.scale.y = 0.86;
capsule.add(rearPanel);

const floorMaterial = new THREE.MeshStandardMaterial({
  color: modeState.floor,
  roughness: 0.9,
  metalness: 0.02,
});
const floor = new THREE.Mesh(new THREE.CircleGeometry(2.65, 128), floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
capsule.add(floor);

const floorGlow = new THREE.Mesh(
  new THREE.RingGeometry(0.58, 2.05, 128),
  new THREE.MeshBasicMaterial({
    color: modeState.accent,
    transparent: true,
    opacity: 0.055,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
floorGlow.rotation.x = -Math.PI / 2;
floorGlow.position.y = 0.018;
capsule.add(floorGlow);

const floorEdgeShade = new THREE.Mesh(
  new THREE.RingGeometry(1.85, 2.66, 128),
  new THREE.MeshBasicMaterial({
    color: 0x2d271f,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  }),
);
floorEdgeShade.rotation.x = -Math.PI / 2;
floorEdgeShade.position.y = 0.021;
capsule.add(floorEdgeShade);

const ringLightMesh = new THREE.Mesh(
  new THREE.TorusGeometry(0.92, 0.018, 16, 160),
  new THREE.MeshBasicMaterial({
    color: modeState.accent,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
  }),
);
ringLightMesh.rotation.x = Math.PI / 2;
ringLightMesh.position.set(0, 2.38, -0.58);
capsule.add(ringLightMesh);

const hemisphereLight = new THREE.HemisphereLight(0xe8d9c8, 0x7f766e, 0.52);
scene.add(hemisphereLight);

const topLight = new THREE.PointLight(modeState.accent, 1.1, 4.7);
topLight.position.copy(ringLightMesh.position);
scene.add(topLight);

const floorLight = new THREE.PointLight(modeState.secondary, 0.34, 3.6);
floorLight.position.set(0, 0.28, -0.25);
scene.add(floorLight);

const softFrontLight = new THREE.DirectionalLight(0xffead2, 0.12);
softFrontLight.position.set(0, 2.8, 2.4);
scene.add(softFrontLight);

const wallDots = createWallDots();
capsule.add(wallDots.group);

const focusLines = createFocusLines();
capsule.add(focusLines);

const prompt = createTextPlane('¿Qué necesitas ahora?', {
  width: 1024,
  height: 160,
  fontSize: 58,
  textColor: '#54493d',
  transparentBackground: true,
});
prompt.position.set(0, 1.88, -1.72);
prompt.scale.set(1.86, 0.3, 1);
prompt.renderOrder = 40;
capsule.add(prompt);

const buttonGroup = new THREE.Group();
buttonGroup.position.set(0, 1.28, -1.72);
capsule.add(buttonGroup);

const buttonMeshes = [];
const buttonLabels = [];
Object.entries(modes).forEach(([key, mode], index) => {
  const x = (index - 1) * 1.18;
  const z = Math.abs(index - 1) * 0.12;
  const yaw = (1 - index) * 0.18;
  const button = new THREE.Mesh(
    new RoundedBoxGeometry(1.02, 0.36, 0.075, 8, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0xf5efe7,
      roughness: 0.72,
      metalness: 0.03,
      transparent: true,
      opacity: 0.82,
      emissive: new THREE.Color(mode.accent),
      emissiveIntensity: key === modeState.current ? 0.16 : 0.05,
    }),
  );
  button.position.set(x, 0, z);
  button.rotation.y = yaw;
  button.renderOrder = 30;
  button.userData.mode = key;
  button.userData.accent = new THREE.Color(mode.accent);
  button.userData.restEmissive = key === modeState.current ? 0.16 : 0.05;
  button.userData.baseScale = new THREE.Vector3(1, 1, 1);
  button.userData.targetGlow = key === modeState.current ? 0.2 : 0.06;
  buttonMeshes.push(button);
  buttonGroup.add(button);

  const label = createTextPlane(mode.label, {
    width: 512,
    height: 160,
    fontSize: 58,
    textColor: `#${mode.text.toString(16).padStart(6, '0')}`,
    transparentBackground: true,
    maxWidth: 420,
    lineHeight: 62,
  });
  label.position.set(x, 0.003, z + 0.052);
  label.rotation.y = yaw;
  label.scale.set(0.92, 0.29, 1);
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
const ambientFadeTimers = new WeakMap();
let activeVoice = null;

renderer.xr.addEventListener('sessionstart', () => {
  unlockAudio({ playWelcome: true });
});

window.addEventListener(
  'pointerdown',
  (event) => {
    updatePointer(event);
    const button = getPointerButton();
    if (button) {
      unlockAudio({ playWelcome: false });
      setMode(button.userData.mode, { playCue: true });
      pulseButton(button);
    } else {
      unlockAudio({ playWelcome: true });
    }
  },
);

window.addEventListener('pointermove', (event) => {
  updatePointer(event);
});

function createWallDots() {
  const group = new THREE.Group();
  const dots = [];

  for (let i = 0; i < 42; i += 1) {
    const theta = THREE.MathUtils.degToRad(218 + Math.random() * 104);
    const y = 0.58 + Math.random() * 1.58;
    const radius = 2.34 + Math.random() * 0.12;
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.006 + Math.random() * 0.01, 18),
      new THREE.MeshBasicMaterial({
        color: modeState.secondary,
        transparent: true,
        opacity: 0.08 + Math.random() * 0.16,
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
    const y = 0.82 + i * 0.13;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.08, y, -2.06),
      new THREE.Vector3(-0.36, y + 0.02, -2.18),
      new THREE.Vector3(0.36, y + 0.02, -2.18),
      new THREE.Vector3(1.08, y, -2.06),
    ]);
    const line = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.006, 8, false),
      new THREE.MeshBasicMaterial({
        color: modeState.secondary,
        transparent: true,
        opacity: 0.045,
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
  const audioBase = `${import.meta.env.BASE_URL}audio/`;
  const files = {
    bienvenida: `${audioBase}bienvenida.mp3`,
    regularme: `${audioBase}regularme.mp3`,
    pausa: `${audioBase}pausa.mp3`,
    reenfocarme: `${audioBase}reenfocarme.mp3`,
    'ambiente-regularme': `${audioBase}ambiente-regularme.mp3`,
    'ambiente-pausa': `${audioBase}ambiente-pausa.mp3`,
    'ambiente-reenfocarme': `${audioBase}ambiente-reenfocarme.mp3`,
  };

  return Object.fromEntries(
    Object.entries(files).map(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'none';
      audio.loop = key.startsWith('ambiente-');
      audio.volume = key.startsWith('ambiente-') ? 0 : 0.92;
      audio.userData = {
        targetVolume: key.startsWith('ambiente-') ? 0.055 : 0.92,
      };
      audio.addEventListener('error', () => {
        console.warn(`Audio no disponible: ${src}`);
      });
      return [key, audio];
    }),
  );
}

function unlockAudio({ playWelcome = false } = {}) {
  audioUnlocked = true;
  if (playWelcome && !welcomePlayed) {
    welcomePlayed = true;
    playVoice('bienvenida', { duckAmbient: false });
  }
  playAmbient(modes[modeState.current].ambient);
}

function playVoice(key, { duckAmbient = true } = {}) {
  const audio = audioLibrary[key];
  if (!audio || !audioUnlocked) return;
  if (activeVoice && activeVoice !== audio) {
    stopVoice(activeVoice, 220);
  }

  activeVoice = audio;
  audio.volume = audio.userData?.targetVolume ?? 0.9;
  audio.currentTime = 0;
  if (duckAmbient && activeAmbient) {
    fadeAudio(activeAmbient, 0.025, 260);
  }
  audio.onended = () => {
    releaseVoice(audio);
  };
  audio.play().catch(() => {
    console.warn(`Audio no disponible o bloqueado por el navegador: ${audio.src}`);
    releaseVoice(audio);
  });
}

function stopVoice(audio = activeVoice, duration = 180) {
  if (!audio) return;
  fadeAudio(audio, 0, duration, () => {
    audio.pause();
    audio.currentTime = 0;
    audio.onended = null;
    if (activeVoice === audio) {
      activeVoice = null;
    }
  });
}

function releaseVoice(audio) {
  if (activeVoice !== audio) return;
  activeVoice = null;
  audio.onended = null;
  if (activeAmbient) {
    fadeAudio(activeAmbient, activeAmbient.userData?.targetVolume ?? 0.055, 700);
  }
}

function playAmbient(key) {
  const next = audioLibrary[key];
  if (!next || !audioUnlocked) return;

  if (activeAmbient && activeAmbient !== next) {
    const outgoingAmbient = activeAmbient;
    fadeAudio(outgoingAmbient, 0, 900, () => {
      outgoingAmbient.pause();
      outgoingAmbient.currentTime = 0;
    });
  }

  activeAmbient = next;
  activeAmbient.volume = Math.min(activeAmbient.volume, 0.02);
  activeAmbient.play().catch(() => {
    console.warn(`Audio ambiente no disponible o bloqueado: ${next.src}`);
  });
  const targetVolume = activeVoice ? 0.025 : activeAmbient.userData?.targetVolume ?? 0.055;
  fadeAudio(activeAmbient, targetVolume, 1200);
}

function fadeAudio(audio, targetVolume, duration = 800, onComplete) {
  const previousTimer = ambientFadeTimers.get(audio);
  if (previousTimer) {
    clearInterval(previousTimer);
  }

  const startVolume = audio.volume;
  const startTime = performance.now();
  const timer = setInterval(() => {
    const progress = Math.min((performance.now() - startTime) / duration, 1);
    audio.volume = THREE.MathUtils.lerp(startVolume, targetVolume, progress);
    if (progress >= 1) {
      clearInterval(timer);
      ambientFadeTimers.delete(audio);
      onComplete?.();
    }
  }, 50);
  ambientFadeTimers.set(audio, timer);
}

function onSelectStart(controller) {
  const button = getPointedButton(controller);
  if (!button) {
    unlockAudio({ playWelcome: true });
    return;
  }
  unlockAudio({ playWelcome: false });
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
  button.scale.copy(button.userData.baseScale).multiplyScalar(1.045);
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
    button.userData.targetGlow = active ? 0.2 : 0.06;
    button.userData.baseScale.set(active ? 1.035 : 1, active ? 1.035 : 1, 1);
    button.scale.copy(button.userData.baseScale);
  });

  if (options.playCue) {
    welcomePlayed = true;
    stopVoice();
    playVoice(mode.audio, { duckAmbient: true });
  }
  playAmbient(mode.ambient);
}

function updateControllers() {
  const pointerButton = getPointerButton();

  controllers.forEach((controller) => {
    const hoveredButton = getPointedButton(controller);
    if (controller.userData.hoveredButton && controller.userData.hoveredButton !== hoveredButton) {
      controller.userData.hoveredButton.userData.targetGlow =
        controller.userData.hoveredButton.userData.mode === modeState.current ? 0.2 : 0.06;
    }
    if (hoveredButton) {
      hoveredButton.userData.targetGlow = 0.28;
    }
    controller.userData.hoveredButton = hoveredButton;
  });

  buttonMeshes.forEach((button) => {
    if (button === pointerButton) {
      button.userData.targetGlow = 0.28;
    } else if (!controllers.some((controller) => controller.userData.hoveredButton === button)) {
      button.userData.targetGlow = button.userData.mode === modeState.current ? 0.2 : 0.06;
    }
  });
}

function updateCapsule(delta, elapsed) {
  const breath = 0.5 + 0.5 * Math.sin(elapsed * modeState.pulseSpeed * Math.PI * 2);
  const breatheOpacity = 0.1 + breath * 0.12;

  scene.background.lerp(modeState.targetBackground, 0.018);
  scene.fog.color.lerp(modeState.targetFog, 0.018);
  shellMaterial.color.lerp(modeState.wall, 0.018);
  ceilingSoftener.material.color.lerp(modeState.wall.clone().multiplyScalar(0.9), 0.018);
  rearPanel.material.color.lerp(modeState.wall.clone().multiplyScalar(0.96), 0.018);
  floorMaterial.color.lerp(modeState.floor, 0.018);

  ringLightMesh.material.color.lerp(modeState.accent, 0.05);
  ringLightMesh.material.opacity = 0.1 + breath * 0.12;
  ringLightMesh.scale.setScalar(1 + breath * 0.008);

  floorGlow.material.color.lerp(modeState.accent, 0.05);
  floorGlow.material.opacity = breatheOpacity * 0.24;

  topLight.color.lerp(modeState.accent, 0.05);
  topLight.intensity = 0.66 * modeState.darkness + breath * 0.34;
  floorLight.color.lerp(modeState.secondary, 0.05);
  floorLight.intensity = 0.16 * modeState.darkness + breath * 0.16;
  hemisphereLight.intensity = 0.24 + modeState.darkness * 0.28;

  wallDots.dots.forEach((dot, index) => {
    dot.material.color.lerp(index % 2 ? modeState.accent : modeState.secondary, 0.04);
    dot.material.opacity =
      dot.userData.baseOpacity * (0.24 + breath * 0.32) * modeState.darkness;
    dot.position.y +=
      Math.sin(elapsed * 0.18 + dot.userData.phase) * modeState.particleDrift * delta;
  });

  focusLines.children.forEach((line, index) => {
    line.material.color.lerp(modeState.secondary, 0.04);
    line.material.opacity =
      modeState.current === 'reenfocarme'
        ? 0.09 + Math.sin(elapsed * 0.38 + index) * 0.014
        : 0.018;
  });

  buttonMeshes.forEach((button) => {
    const target = button.userData.targetGlow;
    button.material.emissive.lerp(button.userData.accent, 0.08);
    button.material.emissiveIntensity = THREE.MathUtils.lerp(
      button.material.emissiveIntensity,
      target,
      0.12,
    );
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
