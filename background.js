import * as THREE from 'https://unpkg.com/three@0.145.0/build/three.module.js';
import { OBJLoader } from 'https://cdn.skypack.dev/three@v0.132.0/examples/jsm/loaders/OBJLoader.js';

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

const geometries = [];

const objPaths = [
    "models/avatar_old.sgm.obj",
    "models/balloon_heart.sgm.obj",
    "models/cheese_basic.sgm.obj",
    "models/egg_basic_easter.sgm.obj",
    "models/flag_basic.sgm.obj",
    "models/katana_basic.sgm.obj",
    "models/lantern_chinese.sgm.obj",
    "models/lifebuoyflag_basic.sgm.obj",
    "models/ninjabanner_basic.sgm.obj",
    "models/northpole_2022.sgm.obj",
    "models/orb_basic_pulsating.sgm.obj",
    "models/pumpkin_basic.sgm.obj",
    "models/scepter_royal.sgm.obj",
    "models/sir_duckton.sgm.obj",
    "models/snowman_2022.sgm.obj",
    "models/ufo_basic_beam.sgm.obj",
    "models/arrow_heart.sgm.obj",
    "models/candycane_2022.sgm.obj",
    "models/carrot_basic.sgm.obj",
    "models/cheese_string.sgm.obj",
    "models/easter_2023.sgm.obj",
    "models/foldingfan_basic.sgm.obj",
    "models/kunai_basic.sgm.obj",
    "models/rocket_basic.sgm.obj",
    "models/shark_basic.sgm.obj",
    "models/shoge_basic.sgm.obj",
    "models/shovel_basic.sgm.obj",
    "models/spider_basic.sgm.obj",
    "models/stake_basic_wood.sgm.obj",
    "models/sword_royal.sgm.obj",
    "models/trident_basic_gold.sgm.obj",
    "models/beard_christmas_2022.sgm.obj",
    "models/hmd_meta_basic.sgm.obj",
    "models/mask_dragon_paper.sgm.obj",
    "models/mask_oni_basic.sgm.obj",
    "models/baseballcap_basic.sgm.obj",
    "models/bunnyears_basic.sgm.obj",
    "models/cheese_basic.sgm.obj",
    "models/christmas_basic.sgm.obj",
    "models/cowboyhat_basic.sgm.obj",
    "models/cowboyhat_basic_dev.sgm.obj",
    "models/crown_royal.sgm.obj",
    "models/fedora_easter_2023.sgm.obj",
    "models/headband_basic.sgm.obj",
    "models/ninjahat_basic.sgm.obj",
    "models/sunhat_basic.sgm.obj",
    "models/sunhat_basic_moderator.sgm.obj",
    "models/tophat_basic.sgm.obj",
    "models/tophat_heart.sgm.obj",
    "models/tree_christmas_2022.sgm.obj",
    "models/umbrellahat_basic.sgm.obj",
    "models/witchhat_basic.sgm.obj",
    "models/space_basic.sgm.obj",
    "models/body.sgm.obj",
    "models/checkpoint.sgm.obj",
    "models/feet.sgm.obj",
    "models/grapple_anchor.sgm.obj",
    "models/hand.sgm.obj",
    "models/head.sgm.obj",
    "models/cube.sgm.obj",
    "models/cylinder.sgm.obj",
    "models/prism.sgm.obj",
    "models/pyramid.sgm.obj",
    "models/sign.sgm.obj",
    "models/sphere.sgm.obj"
];

function createObjectsWithGeometries() {
	for (let i = 0; i < 1000; i++) {
		const geometry = geometries[Math.floor(Math.random() * geometries.length)];
		const color = new THREE.Color(Math.random(), Math.random(), Math.random());
		const material = new THREE.MeshBasicMaterial({ color });
		const mesh = new THREE.Mesh(geometry, material);
		mesh.velocity = new THREE.Vector3(-(Math.random() * 0.01 + 0.005), 0, 0);
		scene.add(mesh);
	}
}

function loadGeometries(callback) {
	const loader = new OBJLoader();
	let loadedCount = 0;
	for (let i = 0; i < objPaths.length; i++) {
		const path = objPaths[i];
		loader.load(path, (obj) => {
			const geometry = obj.children[0].geometry;
			geometries.push(geometry);
			loadedCount++;
			if (loadedCount === objPaths.length) {
				callback();
			}
		});
	}
}

loadGeometries(createObjectsWithGeometries);
const clock = new THREE.Clock();

function animate() {
	requestAnimationFrame(animate);
	const elapsedTime = clock.getElapsedTime();
	scene.children.forEach((object) => {
		object.rotation.y = elapsedTime * 3;
		object.rotation.z = elapsedTime * 2;
		object.rotation.x = elapsedTime * 1;
		object.position.add(object.velocity);

		if (object.position.x < -30) {
			object.position.set(Math.random() * 20 + 30, Math.random() * 10 - 5, Math.random() * 20 - 10);
		}
	});

	renderer.render(scene, camera);
}

animate();
