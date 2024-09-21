import * as THREE from 'three';
import { Group } from 'tween'
import { GLTFLoader } from 'three/GLTFLoader';
import { DRACOLoader } from 'three/DracoLoader';
import { OrbitControls } from 'three/OrbitControls';
import { RGBELoader } from 'three/RGBELoader';
import { PMREMGenerator } from 'three';
import { dispersion, mauve, pearlBlue, vialMaterial } from './materials.js';
import { animatePage } from './scroll.js';

document.addEventListener('DOMContentLoaded', async () => initScene());

export function setLastScrollY(value) { lastScrollY = value; }
export let lastScrollY = 0;
export let dotTweenGroup = new Group();
export let ribbonTweenGroup = new Group();
export let blobTweenGroup = new Group();

function initScene() {
    let scene, camera, renderer, controls;
    let scrollTimeout;
    let cellObject, blobInner, blobOuter, ribbons;
    let dotBounds, wavingBlob;
    let productAnchor, product;
    const spheres = [];

    return new Promise((resolve) => {
        const boundingBoxes = [];
        const loadedObjects = [];
        const globalShaders = {};
        scene = new THREE.Scene();
        camera = initCamera();
        renderer = initRenderer();
        controls = initControls(camera, renderer);
        cellObject = new THREE.Object3D();

        initLights(scene, renderer);
        window.addEventListener('scroll', () => animatePage(controls, camera, cellObject, blobInner, ribbons, spheres, wavingBlob, dotBounds, product, lastScrollY, scrollTimeout));
        window.addEventListener('resize', () => resizeScene(renderer, camera));

        class CellComponent {
            constructor(gltf, shader = null, renderOrder = 1) {
                return new Promise((resolve) => {
                    this.scene = scene;
                    this.position = new THREE.Vector3(0, 0, 0);
                    this.basePath = 'https://cdn.jsdelivr.net/gh/whole-earth/taxa@main/assets/cell/';
                    // this.basePath = './assets/cell/';
                    this.loader = new GLTFLoader();
                    this.gltfFileName = gltf;
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
                    this.object.name = this.gltfFileName.split('/').pop();
                    cellObject.add(this.object);
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

        class productComponent {
            constructor(gltf, shader = null, renderOrder = 1) {
                return new Promise((resolve) => {
                    this.scene = scene;
                    this.position = new THREE.Vector3(0, 0, 0);
                    this.basePath = 'https://cdn.jsdelivr.net/gh/whole-earth/taxa@main/assets/product/';
                    // this.basePath = './assets/product/';
                    this.loader = new GLTFLoader();
                    const dracoLoader = new DRACOLoader();
                    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
                    this.loader.setDRACOLoader(dracoLoader);
                    this.loadObject(gltf, shader, renderOrder, resolve);
                    if (shader) globalShaders[gltf] = shader;
                });
            }

            loadObject(gltf, shader, renderOrder, resolve) {
                const fullPath = this.basePath + gltf;
                this.loader.load(fullPath, (gltf) => {
                    this.object = gltf.scene;
                    this.object.position.copy(this.position);
                    this.centerObject(this.object);
                    this.object.rotation.x = Math.PI / 2.2;
                    if (shader) this.applyCustomShader(shader);
                    this.object.renderOrder = renderOrder;
                    resolve(this.object);
                });
            }

            applyCustomShader(shader) {
                if (!shader) return;
                this.object.traverse((node) => {
                    if (node.isMesh) {
                        node.material.transparent = true;
                        node.material.opacity = 0;
                        node.material.depthWrite = false;
                        node.material.depthTest = false;
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

        const loadCellObjects = [

            new CellComponent("blob-inner.glb", pearlBlue, 0).then((object) => {
                blobInner = object;
                resolve();
            }),

            new CellComponent("blob-outer.glb", dispersion, 2).then((object) => {
                blobOuter = object;
                resolve();
            }),

            new CellComponent("ribbons.glb", mauve, 3).then((object) => {
                ribbons = object;
                resolve();
            })

        ];

        const loadProductObject = [
            new productComponent("compressed.glb", vialMaterial, 200).then((createdProduct) => {
                product = createdProduct;
                productAnchor = new THREE.Object3D();
                productAnchor.add(product);
                scene.add(productAnchor);
                resolve();
            })
        ]

        Promise.all(loadCellObjects).then(() => {
            scene.add(cellObject);
            initSpeckles(scene, boundingBoxes);
            loadProductObject;
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

    function initSpeckles__Prev(scene, boundingBoxes) {
        dotBounds = boundingBoxes[1].max.z * 0.85;
        const waveGeom = new THREE.SphereGeometry(dotBounds, 32, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({ color: 0x92cb86, opacity: 0, transparent: true, depthWrite: false, depthTest: false });
        wavingBlob = new THREE.Mesh(waveGeom, waveMaterial);
        wavingBlob.renderOrder = 5;
        scene.add(wavingBlob);

        const sizes = [0.12, 0.14, 0.16, 0.18, 0.22];

        for (let i = 0; i < 180; i++) {
            const randomPosition = getRandomPositionWithinBounds(dotBounds);
            const sizeIndex = i % sizes.length;
            const sphereGeometry = new THREE.SphereGeometry(sizes[sizeIndex], 6, 6);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff8e00, opacity: 0, transparent: true, depthWrite: false });
            const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
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

            dotTweenGroup.update();
            ribbonTweenGroup.update();
            blobTweenGroup.update();

            if (productAnchor) { productAnchor.lookAt(camera.position); }

            renderer.render(scene, camera);
            controls.update();
            spheres.forEach(sphere => {
                sphere.position.add(sphere.velocity);
                if (sphere.position.length() > dotBounds) {
                    sphere.velocity.negate();
                }
            });

        }

        animate();
    }

    function initSpeckles(scene, boundingBoxes) {
        dotBounds = boundingBoxes[1].max.z * 0.85;
        const waveGeom = new THREE.SphereGeometry(dotBounds, 32, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({ color: 0x92cb86, opacity: 0, transparent: true, depthWrite: false, depthTest: false });
        wavingBlob = new THREE.Mesh(waveGeom, waveMaterial);
        wavingBlob.renderOrder = 5;
    
        const dotsGroup1 = new THREE.Group();
        const dotsGroup2 = new THREE.Group();
        const dotsGroup3 = new THREE.Group();
        wavingBlob.add(dotsGroup1, dotsGroup2, dotsGroup3);
        scene.add(wavingBlob);
        spheres.push(sphereMesh);
    
        const sizes = [0.12, 0.14, 0.16, 0.18, 0.22];
        
        for (let i = 0; i < 180; i++) {
            const randomPosition = getRandomPositionWithinBounds(dotBounds);
            const sizeIndex = i % sizes.length;
            const sphereGeometry = new THREE.SphereGeometry(sizes[sizeIndex], 6, 6);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff8e00, opacity: 0, transparent: true, depthWrite: false });
            const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphereMesh.position.copy(randomPosition);
            const randomDirection = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            sphereMesh.velocity = randomDirection.multiplyScalar(0.014);
            
            if (i % 3 === 0) {
                dotsGroup1.add(sphereMesh);
            } else if (i % 3 === 1) {
                dotsGroup2.add(sphereMesh);
            } else {
                dotsGroup3.add(sphereMesh);
            }
        }
    
        function getRandomPositionWithinBounds(bounds) {
            const x = (Math.random() * 2 - 1) * (bounds * 0.65);
            const y = (Math.random() * 2 - 1) * (bounds * 0.65);
            const z = (Math.random() * 2 - 1) * (bounds * 0.65);
            return new THREE.Vector3(x, y, z);
        }
    
        function animate() {
            requestAnimationFrame(animate);
    
            dotTweenGroup.update();
            ribbonTweenGroup.update();
            blobTweenGroup.update();
    
            if (productAnchor) { productAnchor.lookAt(camera.position); }
    
            renderer.render(scene, camera);
            controls.update();
    
            [dotsGroup1, dotsGroup2, dotsGroup3].forEach(group => {
                group.children.forEach(sphere => {
                    sphere.position.add(sphere.velocity);
                    if (sphere.position.length() > dotBounds) {
                        sphere.velocity.negate();
                    }
                });
            });
        }
    
        animate();
    }
    

    function resizeScene(render, camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        render.setSize(window.innerWidth, window.innerHeight);
    }

}