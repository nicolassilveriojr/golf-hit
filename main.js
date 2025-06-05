import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

let scene, camera, renderer;
let ball, raycaster, mouse;
let isDragging = false, startDrag, velocity = new THREE.Vector3();
let dragPlane, obstacles = [], goal;
let currentLevel = 0;
let cameraTarget = new THREE.Vector3();
let strokes = 0;

const hitSound = document.getElementById("hitSound");
const winSound = document.getElementById("winSound");

const levels = [createLevel1, createLevel2];

init();
loadLevel(currentLevel);
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // céu azul claro

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, -12);

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);

  dragPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);

  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('keydown', onKeyDown);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function loadLevel(levelIndex) {
  clearScene();

  // chão com material
  const groundMat = new THREE.MeshStandardMaterial({color: 0x3a8e00, roughness: 0.8, metalness: 0});
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1, 40),
    groundMat
  );
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // bola com material brilhante
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x222222,
    emissiveIntensity: 0.1,
  });
  ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 32),
    ballMat
  );
  ball.position.set(0, 0.3, 0);
  ball.castShadow = true;
  ball.receiveShadow = false;
  scene.add(ball);

  velocity.set(0,0,0);

  strokes = 0;
  document.getElementById("strokeCounter").innerText = strokes;
  document.getElementById("winScreen").style.display = "none";

  levels[levelIndex]();
}

function clearScene() {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    let obj = scene.children[i];
    if(obj !== camera && obj.type !== 'DirectionalLight' && obj.type !== 'AmbientLight') {
      scene.remove(obj);
    }
  }
  obstacles = [];
  goal = null;
}

function createWall(x, z, w, h) {
  const wallMat = new THREE.MeshStandardMaterial({color: 0x555555, roughness: 0.6, metalness: 0.1});
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w, 1, h),
    wallMat
  );
  wall.position.set(x, 0.5, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
  obstacles.push(wall);
}

function createGoal(x, z) {
  const goalMat = new THREE.MeshStandardMaterial({color: 0xffcc00, metalness: 1, roughness: 0.3, emissive: 0xffff33, emissiveIntensity: 0.5});
  goal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32),
    goalMat
  );
  goal.position.set(x, 0.05, z);
  goal.castShadow = true;
  goal.receiveShadow = true;
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
  if(intersects.length > 0){
    isDragging = true;
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, point);
    startDrag = point;
  }
}

function onMouseMove(event) {
  if(isDragging) {
    // Aqui pode colocar efeito visual do arrasto, se quiser
  }
}

function onMouseUp(event) {
  if(!isDragging) return;
  updateMouse(event);
  const point = new THREE.Vector3();
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(dragPlane, point);

  const force = new THREE.Vector3().subVectors(startDrag, point);
  force.y = 0;

  velocity.add(force.multiplyScalar(1.5));

  strokes++;
  document.getElementById("strokeCounter").innerText = strokes;

  if(hitSound){
    hitSound.currentTime = 0;
    hitSound.play();
  }

  isDragging = false;
}

function updateMouse(event) {
  mouse.x = (event.clientX / window.innerWidth)*2 -1;
  mouse.y = -(event.clientY / window.innerHeight)*2 +1;
}

function animate(){
  requestAnimationFrame(animate);

  // movimenta bola
  ball.position.add(velocity);
  velocity.multiplyScalar(0.95);

  // colisões com obstáculos
  obstacles.forEach(obj => {
    const dist = obj.position.distanceTo(ball.position);
    if(dist < 1){
      velocity.reflect(new THREE.Vector3().subVectors(ball.position, obj.position).normalize());
      velocity.multiplyScalar(0.7);
    }
  });

  // verifica vitória
  if(goal && ball.position.distanceTo(goal.position) < 0.5 && velocity.length() < 0.1){
    setTimeout(() => {
      showWinScreen();
    }, 500);
  }

  // câmera seguindo a bola suavemente
  const desiredPos = ball.position.clone().add(new THREE.Vector3(0,6,-12));
  camera.position.lerp(desiredPos, 0.1);
  cameraTarget.lerp(ball.position, 0.1);
  camera.lookAt(cameraTarget);

  renderer.render(scene, camera);
}

function showWinScreen(){
  let stars = 1;
  if(strokes <= 2) stars = 3;
  else if(strokes <= 4) stars = 2;

  document.getElementById("stars").innerText = "⭐".repeat(stars);
  document.getElementById("winScreen").style.display = "block";

  if(winSound){
    winSound.currentTime = 0;
    winSound.play();
  }
}

function nextLevel(){
  currentLevel++;
  if(currentLevel >= levels.length){
    alert("🎉 Parabéns! Você concluiu todas as fases!");
    currentLevel = 0;
  }
  loadLevel(currentLevel);
}

function onKeyDown(event){
  if(event.key.toLowerCase() === 'r'){
    // Resetar a fase atual
    loadLevel(currentLevel);
  }
}
