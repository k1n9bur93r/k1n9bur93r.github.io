import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create and setup canvas for texture
const textureCanvas = document.createElement('canvas');
const context = textureCanvas.getContext('2d');
textureCanvas.width = 512;
textureCanvas.height = 512;

// Draw something on the canvas
function updateCanvas() {
    context.fillStyle = 'white';
    context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
    
    // Draw some animated content
    const time = Date.now() * 0.001;
    context.fillStyle = 'red';
    context.beginPath();
    context.arc(
        256 + Math.sin(time) * 100,
        256 + Math.cos(time) * 100,
        50,
        0,
        Math.PI * 2
    );
    context.fill();
    
    // Text
    context.fillStyle = 'black';
    context.font = '48px Arial';
    context.fillText('Dynamic Texture', 120, 256);
}

// Create canvas texture
const canvasTexture = new THREE.CanvasTexture(textureCanvas);
canvasTexture.needsUpdate = true;

// Create materials using the canvas texture
const material = new THREE.MeshBasicMaterial({ map: canvasTexture });

// Create cylinder and sphere
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 3, 32);
const cylinder = new THREE.Mesh(cylinderGeometry, material);
cylinder.position.x = -2;

const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const sphere = new THREE.Mesh(sphereGeometry, material);
sphere.position.x = 2;

scene.add(cylinder);
scene.add(sphere);

// Set up camera position
camera.position.z = 10;

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update the canvas content
    updateCanvas();
    
    // Update the texture
    canvasTexture.needsUpdate = true;
    
    // Update controls
    controls.update();
    
    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


