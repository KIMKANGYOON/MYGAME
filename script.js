import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";

let scene, camera, renderer, world;
let buildingBlocks = [];
let cctvCameras = [];
let activeCameraIndex = -1;

init();
animate();

function init() {
  // 씬
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // 메인 카메라
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 10);

  // 렌더러
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
  document.getElementById("scene-container").appendChild(renderer.domElement);

  // 물리 월드
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);

  // 바닥
  let groundMaterial = new CANNON.Material();
  let groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: groundMaterial
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  let groundGeo = new THREE.PlaneGeometry(50, 50);
  let groundMat = new THREE.MeshBasicMaterial({ color: 0x228B22 });
  let groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  scene.add(groundMesh);

  // 건물 생성
  createBuilding();

  // 이벤트
  document.getElementById("addCameraBtn").addEventListener("click", addCCTV);
  document.getElementById("explodeBtn").addEventListener("click", explodeBuilding);
  document.getElementById("mainViewBtn").addEventListener("click", () => {
    activeCameraIndex = -1;
  });

  window.addEventListener("resize", onWindowResize);
}

function createBuilding() {
  const blockSize = { x: 1, y: 0.5, z: 1 };
  for (let y = 0; y < 6; y++) {
    for (let x = -2; x <= 2; x++) {
      let boxShape = new CANNON.Box(new CANNON.Vec3(blockSize.x/2, blockSize.y/2, blockSize.z/2));
      let boxBody = new CANNON.Body({ mass: 1, shape: boxShape });
      boxBody.position.set(x, y * blockSize.y + 0.25, 0);
      world.addBody(boxBody);

      let boxGeo = new THREE.BoxGeometry(blockSize.x, blockSize.y, blockSize.z);
      let boxMat = new THREE.MeshBasicMaterial({ color: 0x999999 });
      let boxMesh = new THREE.Mesh(boxGeo, boxMat);
      scene.add(boxMesh);

      buildingBlocks.push({ body: boxBody, mesh: boxMesh });
    }
  }
}

function addCCTV() {
  if (buildingBlocks.length > 0) {
    let block = buildingBlocks[Math.floor(Math.random() * buildingBlocks.length)];
    let cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cam.position.copy(block.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 1)));
    cam.lookAt(block.mesh.position);
    cctvCameras.push(cam);
    activeCameraIndex = cctvCameras.length - 1;
  }
}

function explodeBuilding() {
  buildingBlocks.forEach(obj => {
    let force = new CANNON.Vec3((Math.random() - 0.5) * 50, Math.random() * 50, (Math.random() - 0.5) * 50);
    obj.body.applyImpulse(force, obj.body.position);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / (window.innerHeight * 0.9);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
}

function animate() {
  requestAnimationFrame(animate);

  world.step(1/60);

  buildingBlocks.forEach(obj => {
    obj.mesh.position.copy(obj.body.position);
    obj.mesh.quaternion.copy(obj.body.quaternion);
  });

  let activeCam = activeCameraIndex >= 0 ? cctvCameras[activeCameraIndex] : camera;
  renderer.render(scene, activeCam);
}