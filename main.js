import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

let scene, camera, renderer;
let ball, raycaster, mouse;
let isDragging = false, startDrag, velocity = new THREE.Vector3();
let dragPlane, obstacles = [], goal;
let currentLevel = 0;
const levels = [createLevel1, createLevel2];
let cameraTarget = new THREE.Vector3();

init();
loadLevel(currentLevel);
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaeeeee);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, -10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function loadLevel(levelIndex) {
  clearScene();

  // Chão
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1, 40),
    new THREE.MeshLambertMaterial({ color: 0x55aa55 })
  );
  ground.position.y = -0.5;
  scene.add(ground);

  // Bola
  ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  ball.position.set(0, 0.3, 0);
  scene.add(ball);

  velocity.set(0, 0, 0);

  // Nível específico
  levels[levelIndex]();
}

function clearScene() {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    let obj = scene.children[i];
    if (obj !== camera && obj.type !== 'DirectionalLight') {
      scene.remove(obj);
    }
  }
  obstacles = [];
}

function createWall(x, z, w, h) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w, 1, h),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  wall.position.set(x, 0.5, z);
  scene.add(wall);
  obstacles.push(wall);
}

function createGoal(x, z) {
  goal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  goal.position.set(x, 0.05, z);
  scene.add(goal);
}

function createLevel1() {
  createWall(-4, 5, 2, 8);
  createWall(4, 5, 2, 8);
  createGoal(0, 15);
}

function createLevel2() {
  createWall(0, 7, 6, 1);
  createWall(-3, 12, 1, 6);
  createWall(3, 12, 1, 6);
  createGoal(0, 18);
}

function onMouseDown(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(ball);
  if (intersects.length > 0) {
    isDragging = true;
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, point);
    startDrag = point;
  }
}

function onMouseMove(event) {
  if (isDragging) {
    // linha guia opcional
  }
}

function onMouseUp(event) {
  if (!isDragging) return;
  updateMouse(event);
  const point = new THREE.Vector3();
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(dragPlane, point);

  const force = new THREE.Vector3().subVectors(startDrag, point);
  force.y = 0;
  velocity.add(force.multiplyScalar(1.5));

  isDragging = false;
}

function updateMouse(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
  requestAnimationFrame(animate);

  // Movimento da bola
  ball.position.add(velocity);
  velocity.multiplyScalar(0.95);

  // Colisões com obstáculos
  obstacles.forEach(obj => {
    const dist = obj.position.distanceTo(ball.position);
    if (dist < 1) {
      velocity.reflect(new THREE.Vector3().subVectors(ball.position, obj.position).normalize());
      velocity.multiplyScalar(0.7);
    }
  });

  // Verifica vitória
  if (goal && ball.position.distanceTo(goal.position) < 0.5 && velocity.length() < 0.1) {
    if (currentLevel + 1 < levels.length) {
      currentLevel++;
      setTimeout(() => loadLevel(currentLevel), 1000);
    } else {
      alert('🎉 Parabéns! Você venceu todas as fases!');
      currentLevel = 0;
      setTimeout(() => loadLevel(currentLevel), 1000);
    }
  }

  // 🎥 Câmera segue suavemente a bola
  const desiredPosition = ball.position.clone().add(new THREE.Vector3(0, 6, -10));
  camera.position.lerp(desiredPosition, 0.1);
  cameraTarget.lerp(ball.position, 0.1);
  camera.lookAt(cameraTarget);

  renderer.render(scene, camera);
}
