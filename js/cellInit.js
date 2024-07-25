import * as THREE from "three";
import { GLTFLoader } from "three/GLTFLoader";
import { DRACOLoader } from 'three/DracoLoader';
import { OrbitControls } from "three/OrbitControls";
import { RGBELoader } from "three/RGBELoader";
import { PMREMGenerator } from "three";
import { threeSceneResize } from './anim.js';

export function initCellRenderer() {
  return new Promise((resolve) => {

    let boundingBoxes = [];
    let loadedObjects = [];

    const globalShaders = {};

    class CellComponent {
      constructor(gltf, shader = null, renderOrder = 1) {
        return new Promise((resolve) => {
          this.scene = scene;
          this.position = new THREE.Vector3(0, 0, 0);

          this.basePath = 'https://cdn.jsdelivr.net/gh/whole-earth/taxa-v3@main/assets/cell/';
          this.loader = new GLTFLoader();
          const dracoLoader = new DRACOLoader()

          dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')
          this.loader.setDRACOLoader(dracoLoader)

          this.loadObject(gltf, shader, renderOrder, resolve);

          this.boundingBox = new THREE.Box3();
          boundingBoxes.push(this.boundingBox);

          if (shader) {
            globalShaders[gltf] = shader;
          }

        });
      }

      loadObject(gltf, shader, renderOrder, resolve) {
        const fullPath = this.basePath + gltf;
        this.loader.load(fullPath, (gltf) => {
          this.object = gltf.scene;
          this.object.position.copy(this.position);
          this.scene.add(this.object);
          this.centerObject(this.object);
          if (shader) { this.applyCustomShader(shader); }

          this.object.renderOrder = renderOrder;

          this.boundingBox.setFromObject(this.object);

          loadedObjects.push(this.object);
          resolve(this.object);
        });
      }

      applyCustomShader(shader) {
        if (!shader) {
          return
        };

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

    const splashStartFOV = window.innerWidth < 768 ? 90 : 65; // 80 for mobile
    const splashEndFOV = splashStartFOV * 0.50; // 50% increase
    const diveStartFOV = splashEndFOV;
    const diveEndFOV = splashEndFOV * 1.15; // 15% decrease
    const zoomOutStartFOV = diveEndFOV;
    const zoomOutEndFOV = 160;

    const multiplierDistanceControl = 10;
    const multiplierValue = 10.05;
    const rotationDegree = 180;

    const scene = new THREE.Scene();
    const aspectRatio = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(splashStartFOV, aspectRatio, 0.5, 2000);
    camera.position.set(0, 0, 60);

    const cellRender = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    cellRender.toneMapping = THREE.ACESFilmicToneMapping;

    cellRender.setSize(window.innerWidth, window.innerHeight);
    cellRender.setPixelRatio(window.devicePixelRatio);

    document.querySelector(".cell-three").appendChild(cellRender.domElement);

    function initControlParams() {
      controls.enableDamping = true;
      controls.dampingFactor = 0.03;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.target.set(0, 0, 0);
      controls.minPolarAngle = Math.PI / 2;
      controls.maxPolarAngle = Math.PI / 2;
    }
    const controls = new OrbitControls(camera, cellRender.domElement);
    initControlParams();

    let lastScrollY = window.scrollY;
    let scrollTimeout;

    //=======================

    const splashArea = document.querySelector('.splash');
    const diveArea = document.querySelector('.dive');
    const zoomOutArea = document.querySelector('.zoom-out');
    const splashAreaRect = splashArea.getBoundingClientRect();
    const diveAreaRect = diveArea.getBoundingClientRect();
    const zoomOutAreaRect = zoomOutArea.getBoundingClientRect();
    const diveHeight = diveAreaRect.height;
    const splashHeight = splashAreaRect.height;

    // offset for possible .announcement banner
    function checkForAnnouncementElem() {
      const announcementElement = document.querySelector('.announcement');
      if (announcementElement) {
        splashOffsetHeight += announcementElement.getBoundingClientRect().height;
        announcementElement.getBoundingClientRect().height;
      }
      const navElement = document.querySelector('.nav');
      if (navElement) {
        splashOffsetHeight += navElement.getBoundingClientRect().height;
      }
    }
    let splashOffsetHeight = 0;
    checkForAnnouncementElem();

    window.addEventListener('scroll', function () {
      const scrollY = window.scrollY;
      const scrollDiff = scrollY - lastScrollY;
      const innerHeight = window.innerHeight;

      const splashBool = scrollY > splashOffsetHeight && scrollY < splashAreaRect.bottom - innerHeight;
      const diveBool = scrollY > diveAreaRect.top - innerHeight && scrollY < diveAreaRect.bottom - innerHeight;
      const zoomOutBool = scrollY > zoomOutAreaRect.top - innerHeight && scrollY < zoomOutAreaRect.bottom;

      const multiplier = Math.floor(scrollDiff / multiplierDistanceControl);
      controls.autoRotateSpeed = 1.0 + multiplier * multiplierValue;

      clearTimeout(scrollTimeout);
      const newLocal = scrollTimeout = setTimeout(function () {
        controls.autoRotateSpeed = 0.5;
      }, 100);

      if (scrollY > zoomOutAreaRect.bottom) {
        lastScrollY = scrollY;
        return;
      }

      if (splashBool) {
        console.log("SPLASH")
        const rotation = rotationDegree / splashHeight;
        camera.position.y = rotation * 0.10;
        const splashProgress = Math.max(0, (scrollY - splashAreaRect.top) / (splashAreaRect.bottom - innerHeight - splashOffsetHeight));
        camera.fov = smoothLerp(splashStartFOV, splashEndFOV, splashProgress);
        updateSphereProperties(dotsGreen, 0);
      }
      else if (diveBool) {
        console.log("DIVE")
        // controls.autoRotate = !(diveHeight * 0.75 + splashHeight < scrollY);
        const diveProgress = Math.max(0, Math.min(1, (scrollY + innerHeight - diveAreaRect.top) / (diveAreaRect.bottom - diveAreaRect.top)));
        camera.fov = smoothLerp(diveStartFOV, diveEndFOV, diveProgress);
        updateSphereProperties(dotsBlack, 1);
        // divide into three; red, black, blue
      }
      else if (zoomOutBool) {
        console.log("ZOOMOUT")
        controls.autoRotate = true;
        const zoomOutProgress = Math.max(0, (scrollY - zoomOutAreaRect.top) / (zoomOutAreaRect.bottom - zoomOutAreaRect.top));
        camera.fov = smoothLerp(zoomOutStartFOV, zoomOutEndFOV, zoomOutProgress);
        updateSphereProperties("orange", 0);

      }

      camera.updateProjectionMatrix();
      lastScrollY = scrollY;
    });

    function initLights() {
      const ambientLight = new THREE.AmbientLight(0xffffff, 4);
      scene.add(ambientLight);

      const rgbeLoader = new RGBELoader();

      rgbeLoader.load("https://cdn.jsdelivr.net/gh/whole-earth/taxa-v3@main/assets/cell/aloe.hdr", function (texture) {
        const pmremGenerator = new PMREMGenerator(cellRender);
        pmremGenerator.compileEquirectangularShader();
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.environment = envMap;
        scene.environment.mapping = THREE.EquirectangularReflectionMapping;
        texture.dispose();
        pmremGenerator.dispose();
      });
    }
    initLights();

    //===================================================================

    const iridescent = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#849ed0'),
      roughness: 0.55,
      metalness: 0.2,
      iridescence: 0.85,
      iridescenceIOR: 1.44,
      transmission: 0.6,
      ior: 1.4,
      thickness: 1,
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthWrite: true
    });

    const grayPurple = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#e7cbef'),
      roughness: 0.55,
      metalness: 0.2,
      iridescence: 0.85,
      iridescenceIOR: 1.44,
      transmission: 0.6,
      ior: 1.4,
      thickness: 1,
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthWrite: true
    });

    const loadPromises = [
      new CellComponent("blob-outer.gltf", null, 2),
      new CellComponent("ribbons.glb", grayPurple, 3),
      new CellComponent("blob-inner_raw.glb", iridescent, 1)
    ];

    let waveShader;
    const numSpheresInside = 80;
    const spheres = [];

    const dotsGreen = 0x92cb86;
    const dotsRed = 0xff0000;
    const dotsBlack = 0x000000;

    function initSpeckles() {
      const bounds = boundingBoxes[1].max.z * 0.85;
      const waveGeom = new THREE.SphereGeometry(bounds, 32, 32);
      waveShader = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          opacity: { value: 0.1 }
        },
        vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                uniform float time;
  
                // Perlin noise function
                float noise(vec3 p) {
                    return sin(p.x * 0.5 + time) * 0.5 + sin(p.y * 0.5 + time) * 0.5 + sin(p.z * 0.5 + time) * 0.5;
                }
  
                void main() {
                    vUv = uv;
                    vNormal = normal;
  
                    // Define the amount of deformation
                    float deformationStrength = 0.6; // Adjust the deformation strength
  
                    // Add Perlin noise to the vertex position
                    vec3 newPosition = position + vNormal * noise(position * deformationStrength);
  
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
        fragmentShader: `
            uniform float opacity;

            void main() {
              gl_FragColor = vec4(0.823, 0.925, 0.749, opacity); // Set color to #d2ecbf
            }
          `,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false
      });
      const wavingBlob = new THREE.Mesh(waveGeom, waveShader);
      wavingBlob.renderOrder = 1;

      scene.add(wavingBlob);

      for (let i = 0; i < numSpheresInside; i++) {
        const randomPosition = getRandomPositionWithinBounds();

        const sphereGeometry = new THREE.SphereGeometry(0.25, 6, 6);
        // const color = i % 3 === 0 ? 0x333333 : 0x92cb86;
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: dotsGreen, opacity: 1, transparent: true });
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

        // NEW 7.24
        sphereMesh.userData.color = dotsGreen;
        sphereMesh.userData.opacity = 1;

        sphereMesh.position.copy(randomPosition);

        const randomDirection = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5,
        ).normalize();
        sphereMesh.velocity = randomDirection.multiplyScalar(0.014);

        wavingBlob.add(sphereMesh);

        spheres.push(sphereMesh);
      }

      function getRandomPositionWithinBounds() {
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
        cellRender.render(scene, camera);

        window.addEventListener('resize', () => threeSceneResize(cellRender, camera));

      }

      animate();
    }

      function updateSphereProperties(color, opacity) {
    spheres.forEach(sphere => {
      sphere.material.color.set(color);
      sphere.material.opacity = opacity;
      sphere.material.transparent = true;
      sphere.material.needsUpdate = true;
    });
  }

    //===================================================================

    Promise.all(loadPromises).then(() => {
      initSpeckles();
      resolve();
    });

  });

  //==================  HELPERS  ================================
  function smoothLerp(start, end, progress) {
    return start + (end - start) * smoothstep(progress);
  }

  function smoothstep(x) {
    return x * x * (3 - 2 * x);
  }

}