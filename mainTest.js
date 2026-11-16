import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

// Scene 
const scene = new THREE.Scene();
var sceneObjects = [];

// Camera
const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth / window.innerHeight,
0.1,
1000
);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x555555);
document.body.appendChild(renderer.domElement);

// Ambient light
const ambientLight = new THREE.AmbientLight(0x555555);
scene.add(ambientLight);

// Directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-100, 700, 200).normalize();
scene.add(directionalLight);

// Axes
const axesHelper = new THREE.AxesHelper(400,400,400);
scene.add(axesHelper);

// Cube geometry
const cubeGeometry = new THREE.BoxGeometry(100,100,100);
const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 200, 0);
scene.add(cube);
sceneObjects.push(cube);

// Cone geometry
const coneGeometry = new THREE.ConeGeometry(50, 200, 320);
const coneMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const cone = new THREE.Mesh(coneGeometry, coneMaterial);
cone.position.set(0, 0, 200);
scene.add(cone);
sceneObjects.push(cone);

// Sphere geometry
const sphereGeometry = new THREE.SphereGeometry(80,160,80);
const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x45c7ff });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(200, 0 , 0);
scene.add(sphere);
sceneObjects.push(sphere);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Position camera
camera.position.set(400, 400, 600);
controls.update();

// Composer
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass)

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Outline
const outline = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outline.edgeThickness = 2.0;
outline.edgeStrength = 3.0;
outline.visibleEdgeColor.set(0xffffff);
composer.addPass(outline);

// Variables needed for intersection
let INTERSECTED;
const selectedObjects = [];

// Create infospot - Cube
const spriteMaterial = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(createInfospotTexture()),
    sizeAttenuation: false
});
const infospot = new THREE.Sprite(spriteMaterial);
infospot.scale.set(0.1, 0.1, 1);
infospot.visible = false;
scene.add(infospot);

function createInfospotTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.font = '230px Arial'; // Increased from 96px
    context.fillText('Cube', 20, 180); // Adjusted Y position to accommodate larger text
    return canvas;
}

function updateInfospotPosition() {
    if (infospot.visible) {
        const cubePosition = new THREE.Vector3();
        cube.getWorldPosition(cubePosition);
        infospot.position.set(cubePosition.x, cubePosition.y + 70, cubePosition.z);
        infospot.lookAt(camera.position);
    }
}

function addSelectedObjects(object){
    if (selectedObjects.length > 0) {
        selectedObjects.pop();
    }
    selectedObjects.push(object);
}

function intersection () {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, false);

    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object && intersects[0].object.type === 'Mesh') {
            INTERSECTED = intersects[0].object;
            addSelectedObjects(INTERSECTED);
            outline.selectedObjects = selectedObjects;
            console.log('Object has been intersected');
        }
    } else {
        INTERSECTED = null;
    }
}

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;     
    
    intersection();

    // Check if the mouse is over the cube
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cube);

    infospot.visible = intersects.length > 0;
}

document.addEventListener('mousemove', onMouseMove, false);

function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object === cube) {
            console.log('Cube clicked!');
        } else if (intersects[i].object === cone) {
            console.log('Cone clicked!');
        } else if (intersects[i].object === sphere) {
            console.log('Sphere clicked');
        }
    }
}

window.addEventListener('click', onClick, false);

// Drag and Drop
const dragControls = new DragControls(sceneObjects, camera, renderer.domElement);

dragControls.addEventListener('dragstart', function (event) {
    event.object.material.emissive.set(0xaaaaaa);
    controls.enabled = false; // Disable OrbitControls when dragging starts
});

dragControls.addEventListener('dragend', function (event) {
    event.object.material.emissive.set(0x000000);
    controls.enabled = true; // Re-enable OrbitControls when dragging ends
});

function animate() {
    requestAnimationFrame(animate);

    // Rotate Cone
    cone.rotation.x += 0.01;
    cone.rotation.z += 0.01;

    // Update Controls
    controls.update();

    // Update Info Spot
    updateInfospotPosition();

    // Render Scene
    composer.render();
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

// Start the animation
animate();