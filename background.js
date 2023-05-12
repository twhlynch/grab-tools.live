import * as THREE from 'https://unpkg.com/three@0.145.0/build/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
});

const objectTypes = ['cube', 'circle', 'cylinder'];

function createObject() {
    
  const objectType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
  const color = new THREE.Color(Math.random(), Math.random(), Math.random());
  const size = Math.random();

  let object;
  if (objectType === 'cube') {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({ color });
    object = new THREE.Mesh(geometry, material);
  } else if (objectType === 'circle') {
    const geometry = new THREE.CircleGeometry(size / 2, 32);
    const material = new THREE.MeshBasicMaterial({ color });
    object = new THREE.Mesh(geometry, material);
  } else if (objectType === 'cylinder') {
    const geometry = new THREE.CylinderGeometry(size / 2, size / 2, size, 32);
    const material = new THREE.MeshBasicMaterial({ color });
    object = new THREE.Mesh(geometry, material);
  }

  object.position.set(Math.random() * 20 + 30, Math.random() * 10 - 5, Math.random() * 20 - 10);
  object.velocity = new THREE.Vector3(-(Math.random() * 0.05 + 0.01), 0, 0);

  scene.add(object);
}

for (let i = 0; i < 1000; i++) {
  createObject();
}

function animate() {
  requestAnimationFrame(animate);

  scene.children.forEach((object) => {
    object.position.add(object.velocity);
    if (object.position.x < -30) {
      object.position.set(Math.random() * 20 + 30, Math.random() * 10 - 5, Math.random() * 20 - 10);
    }
  });

  renderer.render(scene, camera);
}

animate();
