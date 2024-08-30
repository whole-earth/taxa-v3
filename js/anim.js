import * as THREE from 'three';
import { Group } from 'tween'
import { GLTFLoader } from 'three/GLTFLoader';
import { DRACOLoader } from 'three/DracoLoader';
import { OrbitControls } from 'three/OrbitControls';
import { RGBELoader } from 'three/RGBELoader';
import { PMREMGenerator } from 'three';
import { dispersion, grayPurple, iridescent, vialMaterial, textBlobMaterial } from './materials.js';
import { animatePage } from './scroll.js';

document.addEventListener('DOMContentLoaded', async () => initScene());

export let dotTweenGroup = new Group();
export let zoomBlobTween = new Group();

export let lastScrollY = 0;
export function setLastScrollY(value) { lastScrollY = value; }

function initScene() {

    let animationProgress = 0;
    let rootBoneInitialY, midBoneInitialY, endBoneInitialY;
    let rootBone, midBone, endBone;

    let scene, camera, renderer, controls;
    let scrollTimeout;
    let cellObject, blobInner, blobOuter, ribbons;
    let dotBounds, wavingBlob;
    let zoomShapeAnchor, zoomShape;
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
        window.addEventListener('scroll', () => animatePage(controls, camera, cellObject, spheres, zoomShape, wavingBlob, dotBounds, product, lastScrollY, scrollTimeout));
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

            new CellComponent("blob-inner.glb", iridescent, 1).then((object) => {
                blobInner = object;
                resolve();
            }),

            new CellComponent("blob-outer.glb", dispersion, 2).then((object) => {
                blobOuter = object;
                resolve();
            }),

            new CellComponent("ribbons.glb", grayPurple, 3).then((object) => {
                ribbons = object;
                resolve();
            })

        ];

        const loadProductObject = [
            new productComponent("vial_placeholder.glb", vialMaterial, 200).then((createdProduct) => {
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
            initZoomShape();
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

    function initZoomShape() {
        // Create bones
        const bones = [];
        rootBone = new THREE.Bone();
        midBone = new THREE.Bone();
        endBone = new THREE.Bone();
        
        rootBone.add(midBone);
        midBone.add(endBone);
        rootBone.position.set(0, -1, 0);
        midBone.position.set(0, 0, 0);
        endBone.position.set(0, 1, 0);
        rootBoneInitialY = rootBone.position.y;
        midBoneInitialY = midBone.position.y;
        endBoneInitialY = endBone.position.y;
        bones.push(rootBone, midBone, endBone);
    
        const geometry = new THREE.CapsuleGeometry(1, 6, 8, 20); // radius, length, capSegments, radialSegments
        zoomShape = new THREE.SkinnedMesh(geometry, textBlobMaterial);
    
        const skeleton = new THREE.Skeleton(bones);
        zoomShape.add(rootBone);
        zoomShape.bind(skeleton);
    
        // Assign skin indices and weights
        const position = geometry.attributes.position;
        const skinIndices = [];
        const skinWeights = [];
    
        const segmentHeight = 4; // Total height of the capsule
        const halfHeight = segmentHeight / 2;
    
        for (let i = 0; i < position.count; i++) {
            const vertex = new THREE.Vector3().fromBufferAttribute(position, i);
    
            // Normalize y to range 0-1
            const y = (vertex.y + halfHeight) / segmentHeight;
    
            // Assign indices and weights based on y position
            if (y <= 0.5) {
                // Lower half - influenced by root and mid bones
                const weight = y * 2;
                skinIndices.push(0, 1, 0, 0);
                skinWeights.push(1 - weight, weight, 0, 0);
            } else {
                // Upper half - influenced by mid and end bones
                const weight = (y - 0.5) * 2;
                skinIndices.push(1, 2, 0, 0);
                skinWeights.push(1 - weight, weight, 0, 0);
            }
        }
    
        geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
        geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

        zoomShape.position.set(4, -3.6, 42);
        zoomShape.rotation.z = Math.PI / 1.8;
        
        zoomShape.material.opacity = 1;
        zoomShape.material.needsUpdate = true;
    
        zoomShapeAnchor = new THREE.Object3D();
        zoomShapeAnchor.add(zoomShape);
        scene.add(zoomShapeAnchor);
    }

    function animateBones() {
        animationProgress += 0.01;
        if (animationProgress > 1) animationProgress = 0;
    
        // Calculate the deformation factor
        // This will be 0 at progress 0 and 1, and 1 at progress 0.5
        const deformationFactor = Math.sin(animationProgress * Math.PI);
    
        // Define the maximum deformation
        const maxDeformation = 1.0; // Adjust this to increase/decrease the S-curve
    
        // Animate rootBone
        //rootBone.rotation.x = THREE.MathUtils.lerp(0, 0.5 * maxDeformation, deformationFactor);
        rootBone.rotation.y = rootBoneInitialY + THREE.MathUtils.lerp(0, 0.5 * maxDeformation, deformationFactor);
    
        // Animate midBone
        //midBone.rotation.x = THREE.MathUtils.lerp(0, -1.0 * maxDeformation, deformationFactor);
        midBone.rotation.y = midBoneInitialY + THREE.MathUtils.lerp(0, 1.0 * maxDeformation, deformationFactor);
    
        // Animate endBone
        //endBone.rotation.x = THREE.MathUtils.lerp(0, 0.5 * maxDeformation, deformationFactor);
        endBone.rotation.y = endBoneInitialY + THREE.MathUtils.lerp(0, -0.5 * maxDeformation, deformationFactor);
    
        // Update the skinned mesh
        zoomShape.skeleton.update();
    }

    function initSpeckles(scene, boundingBoxes) {
        dotBounds = boundingBoxes[1].max.z * 0.85;
        const waveGeom = new THREE.SphereGeometry(dotBounds, 32, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({ color: 0x92cb86, opacity: 0, transparent: true, depthWrite: false, depthTest: false });
        wavingBlob = new THREE.Mesh(waveGeom, waveMaterial);
        wavingBlob.renderOrder = 1;
        scene.add(wavingBlob);

        for (let i = 0; i < 180; i++) {
            const randomPosition = getRandomPositionWithinBounds(dotBounds);
            const sphereGeometry = new THREE.SphereGeometry(0.15, 6, 6);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x92cb86, opacity: 0, transparent: true });
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

            if (zoomBlobTween) { zoomBlobTween.update(); }

            if (zoomShapeAnchor) {
                zoomShapeAnchor.lookAt(camera.position);
                animateBones();
            }

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

    function resizeScene(render, camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        render.setSize(window.innerWidth, window.innerHeight);
    }

}