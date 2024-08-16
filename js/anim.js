import * as THREE from 'three';
import { GLTFLoader } from 'three/GLTFLoader';
import { DRACOLoader } from 'three/DracoLoader';
import { OrbitControls } from 'three/OrbitControls';
import { RGBELoader } from 'three/RGBELoader';
import { PMREMGenerator } from 'three';
import { dispersion, grayPurple, iridescent } from './materials.js';
import { animatePage } from './scroll.js';

document.addEventListener('DOMContentLoaded', async () => initCellRenderer());

export let lastScrollY = 0;
export function setLastScrollY(value) { lastScrollY = value; }

function initCellRenderer() {
    let scene, camera, renderer, controls;
    let scrollTimeout;
    const spheres = [];

    return new Promise((resolve) => {
        const boundingBoxes = [];
        const loadedObjects = [];
        const globalShaders = {};
        scene = new THREE.Scene();
        camera = initCamera();
        renderer = initRenderer();
        controls = initControls(camera, renderer);
        initLights(scene, renderer);
        window.addEventListener('scroll', () => animatePage(controls, camera, spheres, lastScrollY, scrollTimeout));
        window.addEventListener('resize', () => resizeScene(renderer, camera));

        class CellComponent {
            constructor(gltf, shader = null, renderOrder = 1) {
                return new Promise((resolve) => {
                    this.scene = scene;
                    this.position = new THREE.Vector3(0, 0, 0);
                    this.basePath = 'https://cdn.jsdelivr.net/gh/whole-earth/taxa@main/assets/cell/';
                    this.loader = new GLTFLoader();
                    const dracoLoader = new DRACOLoader();
                    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
                    this.loader.setDRACOLoader(dracoLoader);
                    this.loadObject(gltf, shader, renderOrder, resolve);
                    this.boundingBox = new THREE.Box3();
                    boundingBoxes.push(this.boundingBox);
                    if (shader) globalShaders[gltf] = shader;
                });
            }

            loadObject(gltf, shader, renderOrder, resolve) {
                const fullPath = this.basePath + gltf;
                this.loader.load(fullPath, (gltf) => {
                    this.object = gltf.scene;
                    this.object.position.copy(this.position);
                    this.scene.add(this.object);
                    this.centerObject(this.object);
                    if (shader) this.applyCustomShader(shader);
                    this.object.renderOrder = renderOrder;
                    this.boundingBox.setFromObject(this.object);
                    loadedObjects.push(this.object);
                    resolve(this.object);
                });
            }

            applyCustomShader(shader) {
                if (!shader) return;
                this.object.traverse((node) => {
                    if (node.isMesh) {
                        node.material = shader;
                        node.material.needsUpdate = true;
                    }
                });
            }

            centerObject(object) {
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                object.position.sub(center);
            }
        }

        const loadPromises = [
            new CellComponent("blob-outer.glb", dispersion, 2),
            new CellComponent("ribbons.glb", grayPurple, 3),
            new CellComponent("blob-inner.glb", iridescent, 1)
        ];

        Promise.all(loadPromises).then(() => {
            initSpeckles(scene, boundingBoxes);
            resolve();
        });
    });

    function initRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.querySelector("#three").appendChild(renderer.domElement);
        return renderer;
    }

    function initCamera() {
        const splashStartFOV = window.innerWidth < 768 ? 90 : 60;
        const aspectRatio = window.innerWidth / window.innerHeight;
        const camera = new THREE.PerspectiveCamera(splashStartFOV, aspectRatio, 0.5, 2000);
        camera.position.set(0, 0, 60);
        return camera;
    }

    function initLights(scene, renderer) {
        const ambientLight = new THREE.AmbientLight(0xffffff, 4);
        scene.add(ambientLight);
        const rgbeLoader = new RGBELoader();
        rgbeLoader.load("https://cdn.jsdelivr.net/gh/whole-earth/taxa-v3@main/assets/cell/aloe.hdr", function (texture) {
            const pmremGenerator = new PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.environment = envMap;
            scene.environment.mapping = THREE.EquirectangularReflectionMapping;
            texture.dispose();
            pmremGenerator.dispose();
        });
    }

    function initControls(camera, renderer) {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.03;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.2;
        controls.target.set(0, 0, 0);
        controls.minPolarAngle = Math.PI / 2;
        controls.maxPolarAngle = Math.PI / 2;
        return controls;
    }

    function resizeScene(render, camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        render.setSize(window.innerWidth, window.innerHeight);
    }

    function initSpeckles(scene, boundingBoxes) {
        const bounds = boundingBoxes[1].max.z * 0.85;
        const waveGeom = new THREE.SphereGeometry(bounds, 32, 32);
        const waveShader = new THREE.ShaderMaterial({
            uniforms: { time: { value: 0.0 }, opacity: { value: 0.1 } },
            vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        uniform float time;
        float noise(vec3 p) {
          return sin(p.x * 0.5 + time) * 0.5 + sin(p.y * 0.5 + time) * 0.5 + sin(p.z * 0.5 + time) * 0.5;
        }
        void main() {
          vUv = uv;
          vNormal = normal;
          float deformationStrength = 0.6;
          vec3 newPosition = position + vNormal * noise(position * deformationStrength);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
            fragmentShader: `
        uniform float opacity;
        void main() {
          gl_FragColor = vec4(0.823, 0.925, 0.749, opacity);
        }
      `,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false
        });
        const wavingBlob = new THREE.Mesh(waveGeom, waveShader);
        wavingBlob.renderOrder = 1;
        scene.add(wavingBlob);

        for (let i = 0; i < 80; i++) {
            const randomPosition = getRandomPositionWithinBounds(bounds);
            const sphereGeometry = new THREE.SphereGeometry(0.25, 6, 6);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x92cb86, opacity: 1, transparent: true });
            const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphereMesh.userData.color = 0x92cb86;
            sphereMesh.userData.opacity = 1;
            sphereMesh.position.copy(randomPosition);
            const randomDirection = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            sphereMesh.velocity = randomDirection.multiplyScalar(0.014);
            wavingBlob.add(sphereMesh);
            spheres.push(sphereMesh);
        }

        function getRandomPositionWithinBounds(bounds) {
            const x = (Math.random() * 2 - 1) * (bounds * 0.65);
            const y = (Math.random() * 2 - 1) * (bounds * 0.65);
            const z = (Math.random() * 2 - 1) * (bounds * 0.65);
            return new THREE.Vector3(x, y, z);
        }

        function animate() {
            requestAnimationFrame(animate);
            spheres.forEach(sphere => {
                sphere.position.add(sphere.velocity);
                if (sphere.position.length() > bounds) {
                    sphere.velocity.negate();
                }
            });
            waveShader.uniforms.time.value += 0.01;
            controls.update();
            renderer.render(scene, camera);
            console.log(waveShader.uniforms.time.value)
        }

        animate();
    }
}