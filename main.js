let scene, camera, renderer;
let ball, power = 0, angle = 45, isBallMoving = false;
let velocity = null;
let shots = 0;
let target;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // céu azul

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1, 10),
    new THREE.MeshStandardMaterial({ color: 0x228B22 }) // verde grama
  );
  ground.position.y = -0.5;
  scene.add(ground);

  ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  ball.position.y = 0.3;
  scene.add(ball);

  // Alvo (bandeira)
  const targetGeo = new THREE.CylinderGeometry(0.3, 0.3, 1, 32);
  const targetMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  target = new THREE.Mesh(targetGeo, targetMat);
  target.position.set(5, 0.5, 0);
  scene.add(target);

  document.addEventListener('keydown', onKeyDown);
}

function onKeyDown(event) {
  if (isBallMoving) return;

  switch (event.key) {
    case "ArrowUp":
      power = Math.min(power + 5, 100);
      break;
    case "ArrowDown":
      power = Math.max(power - 5, 0);
      break;
    case "ArrowLeft":
      angle = Math.max(angle - 5, -90);
      break;
    case "ArrowRight":
      angle = Math.min(angle + 5, 90);
      break;
    case " ":
      kickBall();
      break;
    case "r":
    case "R":
      resetGame();
      break;
  }
}

function kickBall() {
  const powerRatio = Math.abs(power) / 100;
  const radians = angle * (Math.PI / 180);

  velocity = {
    x: Math.cos(radians) * powerRatio * 0.5,
    y: Math.sin(radians) * powerRatio * 0.5 + 0.2,
  };

  isBallMoving = true;
  shots++;
  document.getElementById("shots").textContent = shots;
}

function animate() {
  requestAnimationFrame(animate);

  if (isBallMoving && velocity) {
    ball.position.x += velocity.x;
    ball.position.y += velocity.y;

    velocity.y -= 0.01; // gravidade

    // quicar no chão
    if (ball.position.y <= 0.3) {
      ball.position.y = 0.3;
      velocity.y *= -0.5;
      velocity.x *= 0.7;

      if (Math.abs(velocity.y) < 0.01) {
        velocity.y = 0;
      }

      if (Math.abs(velocity.x) < 0.01) {
        isBallMoving = false;
        velocity = null;
      }
    }

    // colisão com o alvo (bandeira)
    const dx = ball.position.x - target.position.x;
    const dz = ball.position.z - target.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.5 && ball.position.y <= 0.6 && isBallMoving) {
      isBallMoving = false;
      velocity = null;
      showWinScreen();
    }
  }

  renderer.render(scene, camera);
}

function showWinScreen() {
  const starsEl = document.getElementById("stars");
  starsEl.innerHTML = "";

  let stars = 0;
  if (shots === 1) stars = 3;
  else if (shots <= 3) stars = 2;
  else if (shots <= 5) stars = 1;

  for (let i = 0; i < stars; i++) {
    starsEl.innerHTML += "⭐";
  }

  document.getElementById("win-screen").style.display = "block";
}

function nextLevel() {
  resetGame();
  document.getElementById("win-screen").style.display = "none";
  target.position.x += 3; // move o objetivo para a direita
}

function resetGame() {
  ball.position.set(0, 0.3, 0);
  velocity = null;
  isBallMoving = false;
  power = 0;
  angle = 45;
  shots = 0;
  document.getElementById("shots").textContent = shots;
}
