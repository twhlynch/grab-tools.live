import * as THREE from 'https://unpkg.com/three@0.145.0/build/three.module.js';
import { OBJLoader } from 'https://cdn.skypack.dev/three@v0.132.0/examples/jsm/loaders/OBJLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
});

var geometries = [];
var objects = [];

var objPaths = [
    "models/avatar_old.sgm.obj",
    // "models/balloon_heart.sgm.obj",
    // "models/cheese_basic.sgm.obj",
    // "models/egg_basic_easter.sgm.obj",
    // "models/flag_basic.sgm.obj",
    "models/katana_basic.sgm.obj",
    // "models/lantern_chinese.sgm.obj",
    // "models/lifebuoyflag_basic.sgm.obj",
    // "models/ninjabanner_basic.sgm.obj",
    // "models/northpole_2022.sgm.obj",
    // "models/orb_basic_pulsating.sgm.obj",
    "models/pumpkin_basic.sgm.obj",
    "models/scepter_royal.sgm.obj",
    "models/sir_duckton.sgm.obj",
    "models/snowman_2022.sgm.obj",
    // "models/ufo_basic_beam.sgm.obj",
    "models/arrow_heart.sgm.obj",
    // "models/candycane_2022.sgm.obj",
    // "models/carrot_basic.sgm.obj",
    // "models/cheese_string.sgm.obj",
    // "models/easter_2023.sgm.obj",
    // "models/foldingfan_basic.sgm.obj",
    "models/kunai_basic.sgm.obj",
    "models/rocket_basic.sgm.obj",
    "models/shark_basic.sgm.obj",
    // "models/shoge_basic.sgm.obj",
    // "models/shovel_basic.sgm.obj",
    "models/spider_basic.sgm.obj",
    // "models/stake_basic_wood.sgm.obj",
    "models/sword_royal.sgm.obj",
    // "models/trident_basic_gold.sgm.obj",
    // "models/beard_christmas_2022.sgm.obj",
    // "models/hmd_meta_basic.sgm.obj",
    // "models/mask_dragon_paper.sgm.obj",
    // "models/mask_oni_basic.sgm.obj",
    // "models/baseballcap_basic.sgm.obj",
    // "models/bunnyears_basic.sgm.obj",
    "models/cheese_basic.sgm.obj",
    "models/christmas_basic.sgm.obj",
    // "models/cowboyhat_basic.sgm.obj",
    "models/cowboyhat_basic_dev.sgm.obj",
    "models/crown_royal.sgm.obj",
    "models/fedora_easter_2023.sgm.obj",
    // "models/headband_basic.sgm.obj",
    // "models/ninjahat_basic.sgm.obj",
    // "models/sunhat_basic.sgm.obj",
    "models/sunhat_basic_moderator.sgm.obj",
    "models/tophat_basic.sgm.obj",
    // "models/tophat_heart.sgm.obj",
    // "models/tree_christmas_2022.sgm.obj",
    // "models/umbrellahat_basic.sgm.obj",
    "models/witchhat_basic.sgm.obj",
    // "models/space_basic.sgm.obj",
    // "models/body.sgm.obj",
    "models/checkpoint.sgm.obj",
    // "models/feet.sgm.obj",
    // "models/grapple_anchor.sgm.obj",
    // "models/hand.sgm.obj",
    "models/head.sgm.obj",
    // "models/cube.sgm.obj",
    // "models/cylinder.sgm.obj",
    // "models/prism.sgm.obj",
    // "models/pyramid.sgm.obj",
    // "models/sign.sgm.obj",
    // "models/sphere.sgm.obj",
    'models/index.obj',
];

function createObjectsWithGeometries() {
    var speed = 50;
	setInterval( () => {
        var halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
        var halfWidth = Math.tan(halfFov) * camera.position.z;
        var rightEdge = halfWidth * camera.aspect;
		var geometry = geometries[Math.floor(Math.random() * geometries.length)];
		// var color = new THREE.Color(Math.random(), Math.random(), Math.random());
		// var material = new THREE.MeshBasicMaterial({ color });
        var brightness = Math.random() * .5;
        var material = new THREE.MeshBasicMaterial({  
            color: 0x5f8bc2
          });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.velocity = new THREE.Vector3(-(Math.random() * 0.1 - 0.05), Math.random() * 0.1 - 0.05, 0);
        var rotation = new THREE.Vector3(0, 0, 0);
        Math.random() > 0.5 ? rotation.x = Math.random() * 360 : {};
        Math.random() > 0.5 ? rotation.y = Math.random() * 360 : {};
        Math.random() > 0.5 ? rotation.z = Math.random() * 360 : {};
		var x = rightEdge * 3;
        var y = Math.random() * 30 - 15;
        mesh.position.set(x, y, 0);
        scene.add(mesh);
        objects.push(mesh);
        // speed *= .99
	}, speed);
}

function loadGeometries(callback) {
	var loader = new OBJLoader();
	let loadedCount = 0;
	for (let i = 0; i < objPaths.length; i++) {
		var path = objPaths[i];
		loader.load(path, (obj) => {
			var geometry = obj.children[0].geometry;
			geometries.push(geometry);
			loadedCount++;
			if (loadedCount === objPaths.length) {
				callback();
			}
		});
	}
}

setInterval( () => {
    var halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    var halfWidth = Math.tan(halfFov) * camera.position.z;
    var leftEdge = -halfWidth * camera.aspect;
    var rightEdge = halfWidth * camera.aspect;
    var Mloader = new OBJLoader();
    var Mpath = 'models/mountain.obj';
    Mloader.load(Mpath, async (obj) => {
        var Mgeometry = await obj.children[0].geometry;
        
        var brightness = Math.random() * .4;
        var material = new THREE.MeshBasicMaterial({  
            color: 0x5f8bc2
        });
        var mesh = new THREE.Mesh(Mgeometry, material);
        mesh.velocity = new THREE.Vector3(-0.01, 0, 0);
        mesh.mountain = true;
        var x = rightEdge * 3;
        var y = -4;
        mesh.position.set(x, y, 0);
        mesh.scale.set(0.013, 0.013, 0.013);
        scene.add(mesh);
        objects.push(mesh);
    });
}, 120000);

loadGeometries(createObjectsWithGeometries);
var clock = new THREE.Clock();
var mountain = false;
function animate() {
	requestAnimationFrame(animate);
    var halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    var halfWidth = Math.tan(halfFov) * camera.position.z;
    var leftEdge = -halfWidth * camera.aspect;
    var rightEdge = halfWidth * camera.aspect;
	var elapsedTime = clock.getElapsedTime();

	objects.forEach((object) => {
        if (object.mountain) {
            object.rotation.y = elapsedTime * 2;
        } else {
		    object.rotation.z = elapsedTime * 2;
        }
		object.position.add(object.velocity);

		if (object.position.x < leftEdge * 3) {
            scene.remove(object);
            const index = objects.indexOf(object);
            if (index > -1) {
                objects.splice(index, 1);
            }
            // object.position.set(Math.random() * rightEdge * 3, Math.random() * 30 - 15, 0);
		}
	});
    // console.log(objects.length, scene.children.length);
	renderer.render(scene, camera);
}

animate();
