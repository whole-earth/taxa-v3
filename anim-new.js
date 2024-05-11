import * as THREE from "three";
import { GLTFLoader } from "three/GLTFLoader";
import { DRACOLoader } from 'three/DracoLoader';
import { OrbitControls } from "three/OrbitControls";
import { RGBELoader } from "three/RGBELoader";
import { PMREMGenerator } from "three";
import { scaleTransformRenderer } from './transition.js';

// delete for prod
import { setupGUI } from "./gui.js";

function initCellRenderer() {
  return new Promise((resolve) => {

    let boundingBoxes = [];
    let loadedObjects = [];

    class CellComponent {
      constructor(gltf, shader = null, addGUI = false) {
        return new Promise((resolve) => {
          this.scene = scene;
          this.position = new THREE.Vector3(0, 0, 0);

          // this.basePath = '/assets/obj/'; // PATHCHANGE
          this.basePath = 'https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/assets/obj/';
          this.loader = new GLTFLoader();
          const dracoLoader = new DRACOLoader()

          dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')
          this.loader.setDRACOLoader(dracoLoader)

          this.loadObject(gltf, shader, resolve, addGUI);

          this.boundingBox = new THREE.Box3();
          boundingBoxes.push(this.boundingBox);

        });
      }

      loadObject(gltf, shader, resolve, addGUI) {
        const fullPath = this.basePath + gltf;
        this.loader.load(fullPath, (gltf) => {
          this.object = gltf.scene;
          this.object.position.copy(this.position);
          this.scene.add(this.object);
          this.centerObject(this.object);
          if (shader) { this.applyCustomShader(shader); }

          // condition to add GUI: delete for prod
          if (addGUI) { setupGUI(this.object.material); }

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

    const scene = new THREE.Scene();

    const splashStartFOV = 70;

    const aspectRatio = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(splashStartFOV, aspectRatio, 0.5, 2000);
    camera.position.set(0, 0, 60);

    // Renderer
    const cellRender = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    cellRender.toneMapping = THREE.ACESFilmicToneMapping;

    cellRender.setSize(window.innerWidth, window.innerHeight);
    cellRender.setPixelRatio(window.devicePixelRatio);

    document.querySelector(".cell-three").appendChild(cellRender.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, cellRender.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.03;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.target.set(0, 0, 0);
    // controls.minPolarAngle = Math.PI / 2 - (22 * Math.PI) / 180;
    // controls.maxPolarAngle = Math.PI / 2 + (22 * Math.PI) / 180;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;

    // Variables for Zoom
    const splashEndFOV = splashStartFOV * 0.80; // 1.2x increase
    const diveStartFOV = splashEndFOV;
    const diveEndFOV = 26;
    const zoomOutStartFOV = diveEndFOV;
    const zoomOutEndFOV = 150;

    const multiplierDistanceControl = 10;
    const multiplierValue = 10.05;
    const rotationDegree = 180;

    let lastScrollY = window.scrollY;
    let scrollTimeout;

    const splashArea = document.querySelector('.splash');
    const diveArea = document.querySelector('.dive');
    const zoomOutArea = document.querySelector('.zoom-out');
    const splashAreaRect = splashArea.getBoundingClientRect();
    const diveAreaRect = diveArea.getBoundingClientRect();
    const zoomOutAreaRect = zoomOutArea.getBoundingClientRect();


    function smoothLerp(start, end, progress) {
      return start + (end - start) * smoothstep(progress);
    }

    function smoothstep(x) {
      return x * x * (3 - 2 * x);
    }

    window.addEventListener('scroll', function () {

      let scrollY = window.scrollY;
      let scrollDiff = scrollY - lastScrollY;
      let diveBool = scrollY < diveAreaRect.bottom - window.innerHeight;
      let splashBool = scrollY < splashAreaRect.bottom - window.innerHeight;
      let zoomOutBool = scrollY < zoomOutAreaRect.bottom;
      const diveHeight = diveAreaRect.height;
      const splashHeight = splashAreaRect.height;

      let multiplier = Math.floor(scrollDiff / multiplierDistanceControl);

      controls.autoRotateSpeed = 1.0 + multiplier * multiplierValue;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        controls.autoRotateSpeed = 0.5;
      }, 100);

      if (scrollY > zoomOutAreaRect.bottom) {
        lastScrollY = scrollY;
        return;
      }

      /*

      zoomBool
          start when top of .zoom-out crosses the bottom of the viewport
          finish when the bottom of .zoom-out crosses the top of the viewport

      */
      if (splashBool) {
        let rotation = (rotationDegree / (splashHeight * 1.000));
        camera.position.y = rotation * 0.10;
        const splashProgress = (scrollY - splashAreaRect.top) / (splashAreaRect.bottom - window.innerHeight);
        camera.fov = smoothLerp(splashStartFOV, splashEndFOV, splashProgress);
      } else if (diveBool) {
        controls.autoRotate = !(diveHeight * 0.8 + splashHeight < scrollY); // stop rotating the last 20% of dive.height
        const diveProgress = (scrollY - (splashAreaRect.bottom - window.innerHeight)) / diveAreaRect.height;
        camera.fov = smoothLerp(diveStartFOV, diveEndFOV, diveProgress);

      } else if (zoomOutBool) {
        controls.autoRotate = true;
        const zoomOutProgress = Math.max(0, (scrollY - zoomOutAreaRect.top) / (zoomOutAreaRect.bottom - zoomOutAreaRect.top));
        console.log(zoomOutProgress)
        camera.fov = smoothLerp(zoomOutStartFOV, zoomOutEndFOV, zoomOutProgress);
      }

      camera.updateProjectionMatrix();
      lastScrollY = scrollY;
    });

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 4);
    scene.add(ambientLight);

    const rgbeLoader = new RGBELoader();

    rgbeLoader.load("https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/assets/environments/aloe.hdr", function (texture) {
      // rgbeLoader.load("/assets/environments/ambient.hdr", function (texture) { // PATHCHANGE
      const pmremGenerator = new PMREMGenerator(cellRender);
      pmremGenerator.compileEquirectangularShader();
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;

      scene.environment = envMap;
      scene.environment.mapping = THREE.EquirectangularReflectionMapping;
      texture.dispose();
      pmremGenerator.dispose();
    });

    //===================================================================

    // InnerBlob
    const iridescent = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#849ed0'),
      roughness: 0.55,
      metalness: 0.2,
      iridescence: 0.85,
      iridescenceIOR: 1.44,
      transmission: 0.6,
      ior: 1.4,
      thickness: 1,
      envMapIntensity: 1.5
    });

    // RIBBON TEXTURE
    const grayPurple = new THREE.MeshBasicMaterial({
      color: 0xe7cbef
    });

    const loadPromises = [
      new CellComponent("blob-outer.gltf"),
      new CellComponent("ribbons.glb", grayPurple),
      new CellComponent("blob-inner.glb", iridescent)
    ];

    function initInteract() {

      const bounds = boundingBoxes[1].max.z * 0.8;

      // Create the outer blob
      const waveGeom = new THREE.SphereGeometry(bounds + 2, 32, 32);
      const waveShader = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
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
          void main() {
            gl_FragColor = vec4(0.823, 0.925, 0.749, 0.1); // Set color to #d2ecbf
          }
        `,
        transparent: true,
        blending: THREE.NormalBlending,
      });
      const wavingBlob = new THREE.Mesh(waveGeom, waveShader);
      scene.add(wavingBlob);


      const numSpheresInside = 40;
      const spheres = [];

      for (let i = 0; i < numSpheresInside; i++) {
        const randomPosition = getRandomPositionWithinBounds();


        const sphereGeometry = new THREE.SphereGeometry(0.25, 6, 6); // Adjust radius and segments as needed
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

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

      // Helper function to get a random position within bounds. 0.65 prevents freezing at perim
      function getRandomPositionWithinBounds() {
        const x = (Math.random() * 2 - 1) * (bounds * 0.65);
        const y = (Math.random() * 2 - 1) * (bounds * 0.65);
        const z = (Math.random() * 2 - 1) * (bounds * 0.65);

        return new THREE.Vector3(x, y, z);
      }

      /*
       const raycaster = new THREE.Raycaster();
       const mouse = new THREE.Vector2();
       function onClick(event) {
         mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
         mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
         raycaster.setFromCamera(mouse, camera);
         const intersects = raycaster.intersectObjects(spheres, true); // Check for intersections with spheres

         if (intersects.length > 0) {
           const clickedSphere = intersects[0].object;
           console.log("Sphere clicked:", clickedSphere);
         }
       }
       cellRender.domElement.addEventListener("click", onClick);
       */


      function animate() {
        requestAnimationFrame(animate);

        // Update sphere positions
        spheres.forEach(sphere => {
          sphere.position.add(sphere.velocity);

          // If the sphere is outside the bounds, reverse its direction
          if (sphere.position.length() > bounds) {
            sphere.velocity.negate();
          }
        });

        waveShader.uniforms.time.value += 0.01; // Adjust container blob deformation speed

        controls.update();
        cellRender.render(scene, camera);

        window.addEventListener('resize', () => handleResize(cellRender, camera));

      }

      animate();
    }

    //===================================================================

    Promise.all(loadPromises).then(() => {
      initInteract();
      resolve();
    });
  });
}

function initHumanRenderer() {

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#FFF5E6');

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 40, 120);

  const humanRender = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  humanRender.setSize(window.innerWidth, window.innerHeight);
  humanRender.setPixelRatio(window.devicePixelRatio);
  document.querySelector('.human-three').appendChild(humanRender.domElement);

  const controls = new OrbitControls(camera, humanRender.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.enableZoom = false;
  controls.enableRotate = false;

  function loadLights() {

    const backlightTop = new THREE.DirectionalLight(0x849ED0, 2);
    backlightTop.target.position.set(0, 20, 0);
    backlightTop.position.set(0, 120, -60);
    scene.add(backlightTop);

    const backlightLeft = new THREE.DirectionalLight(0x849ED0, 2);
    backlightLeft.target.position.set(0, 20, 0);
    backlightLeft.position.set(-100, 0, -40);
    scene.add(backlightLeft);

    const backlightRight = new THREE.DirectionalLight(0x849ED0, 2);
    backlightRight.target.position.set(0, 20, 0);
    backlightRight.position.set(100, 0, -40);
    scene.add(backlightRight);

    const directionalFront = new THREE.DirectionalLight(0x849ED0, 3);
    directionalFront.target.position.set(0, 20, 0);
    directionalFront.position.set(0, 60, 120);
    scene.add(directionalFront);

    const directionalUpward = new THREE.DirectionalLight(0x849ED0, 3);
    directionalUpward.target.position.set(0, 50, 0);
    directionalUpward.position.set(0, 0, 40);
    scene.add(directionalUpward);

    const ambientLight = new THREE.AmbientLight(0x849ED0, 10);
    scene.add(ambientLight);

  }

  const materialMap = new THREE.TextureLoader().load("https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/assets/obj/blue.jpg"); // PATHCHANGE

  const materialBlue = new THREE.MeshStandardMaterial({
    map: materialMap,
    roughness: 1,
    metalness: 0.75,
    side: THREE.DoubleSide
  });

  const materialBlueLogo = new THREE.MeshStandardMaterial({
    map: materialMap,
    roughness: 1,
    metalness: 0.75,
    side: THREE.DoubleSide,
    transparent: true
  });

  const greenLogo = new THREE.MeshBasicMaterial({
    color: 0xd2ecbf,
    side: THREE.DoubleSide,
    transparent: true
  });

  let mixer, action;

  let logoObject = null;
  let modelObject = null;

  function modelInit() {
    const loader = new GLTFLoader();
    let modelHeight;
    const modelHeights = [];

    // PATHCHANGE
    loader.load("https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/assets/obj/model.glb", function (gltf) {

      modelObject = gltf.scene;
      modelObject.traverse(function (child) {
        if (child.isMesh) {
          const bbox = new THREE.Box3().setFromObject(child);
          const height = bbox.max.y - bbox.min.y;
          modelHeights.push(height);
          child.material = materialBlue;
        }
      });

      modelObject.scale.set(80, 80, 80);
      modelHeight = Math.max(...modelHeights);

      function responsiveAdjust() {

        let distance, modelX, modelY;
        if (window.innerWidth <= 320) {
          distance = 240;
          modelX = 20;
          modelY = -modelHeight * 80;
        } else if (window.innerWidth <= 768) {
          distance = 200;
          modelX = 30;
          modelY = -modelHeight * 80;
        } else if (window.innerWidth <= 996) {
          distance = 180;
          modelX = 25;
          modelY = -modelHeight * 80;
        } else {
          distance = 110;
          modelX = 30;
          modelY = -modelHeight * 70;
        }

        modelObject.position.set(modelX, modelY, 0);
        modelObject.rotation.y = -Math.PI / 6;

        camera.fov = 45;
        camera.position.set(0, modelHeight * 0.5, distance);
        camera.lookAt(modelObject.position);
        camera.updateProjectionMatrix();

        handleResize(humanRender, camera);

      }

      responsiveAdjust();
      window.addEventListener('resize', responsiveAdjust);

      scene.add(modelObject);

      mixer = new THREE.AnimationMixer(modelObject);
      action = mixer.clipAction(gltf.animations[0]);
      action.play();

      //=================================================================

      function logoInit() {
        const loader = new GLTFLoader();
        // loader.load("assets/obj/logo.glb", function (logo) { // PATHCHANGE!
        loader.load("https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/assets/obj/logo.glb", function (logo) {

          logoObject = logo.scene;

          // Traverse the objects in the model
          logoObject.traverse(function (child) {
            if (child.isMesh) {
              if (child.name === "PHALLUS") {
                child.material = materialBlueLogo;
              }
              else if (child.name === "BALL") {
                child.material = greenLogo;

                const bbox = new THREE.Box3().setFromObject(child);
                const height = bbox.max.y - bbox.min.y;
                const tenPercentHeight = height * 0.12;

                // Store the original position and the 10% height
                child.userData.originalPosition = child.position.y;
                child.userData.tenPercentHeight = tenPercentHeight;


              }
            }
          });

          // Create a bounding box for the model
          const modelBounds = new THREE.Box3().setFromObject(modelObject);
          const boundingBox = new THREE.Box3().setFromObject(logoObject);
          const logoSize = boundingBox.getSize(new THREE.Vector3());
          const scale = 12 / Math.max(logoSize.x, logoSize.y, logoSize.z);
          logoObject.scale.set(scale, scale, scale);

          logoObject.position.set(modelBounds.min.x, modelBounds.max.y, (modelBounds.min.z + modelBounds.max.z) / 2);

          scene.add(logoObject);

        });

      }

      logoInit();

      loadLights();

    });
  }

  modelInit();

  const human = document.querySelector('.human');
  function humanOffsetMaxWidth() {
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if (screenWidth > 1650) {
      const marginLeft = window.getComputedStyle(human).marginLeft;
      const marginLeftValue = parseInt(marginLeft, 10);

      const innerCanvas = human.querySelector('.human-three canvas');
      innerCanvas.style.marginLeft = -marginLeftValue + 'px';
    }
  }

  humanOffsetMaxWidth();
  window.addEventListener('resize', humanOffsetMaxWidth);


  function humanScroll() {
    const humanRect = human.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const transitionSpacerHeight = document.querySelector('.transition-spacer').offsetHeight;

    // Define the start and end of the animation range
    const animationStart = transitionSpacerHeight + viewportHeight; // Start earlier by subtracting the height of '.transition-spacer'
    const animationEnd = humanRect.height - viewportHeight;

    let scrollProgress = 0;

    if (humanRect.top <= animationStart && humanRect.bottom >= viewportHeight) {
      scrollProgress = Math.min(1, Math.max(0, Math.abs(humanRect.top - animationStart) / (animationEnd + transitionSpacerHeight)));

      // opacity of logo
      if (logoObject) {
        if (scrollProgress >= 0.8) {
          const opacityProgress = Math.min(1, (scrollProgress - 0.8) / 0.2);
          logoObject.traverse(function (child) {
            if (child.isMesh) {
              child.material.opacity = opacityProgress;
            }
          });
        } else {
          logoObject.traverse(function (child) {
            if (child.isMesh) {
              child.material.opacity = 0;
            }
          });
        }
      }

    } else if (humanRect.top > animationStart) {
      scrollProgress = 0;
    } else {
      scrollProgress = 1;
    }

    // Set the animation time based on the scroll progress
    const animationTime = scrollProgress * 4; // arbitrary multiplier... seems to work
    mixer.setTime(animationTime);

  }

  human.addEventListener('scroll', humanScroll);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (mixer) {
      mixer.update(0.01); // Update mixer in the animation loop
      humanScroll(); // Update animation based on scroll position
    }

    if (logoObject) {
      logoObject.traverse(function (child) {
        if (child.isMesh && child.name === "BALL") {
          // Calculate the new position
          const newPosition = child.userData.originalPosition + Math.sin(Date.now() * 0.001) * child.userData.tenPercentHeight;

          // Update the position
          child.position.y = newPosition;
        }
      });
    }

    humanRender.render(scene, camera);

  }

  animate();

}

function handleResize(render, camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  render.setSize(window.innerWidth, window.innerHeight);
}

document.addEventListener('DOMContentLoaded', async function () {
  await Promise.all([initCellRenderer(), initHumanRenderer()]);
  scaleTransformRenderer();
});