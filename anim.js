import * as THREE from "three";
import { GLTFLoader } from "three/GLTFLoader";
import { DRACOLoader } from 'three/DracoLoader';
import { OrbitControls } from "three/OrbitControls";
import { RGBELoader } from "three/RGBELoader";
import { PMREMGenerator } from "three";
import { scaleTransformRenderer } from './transition.js';
import { textFadeInit } from './text.js';

function initCellRenderer() {
  return new Promise((resolve) => {

    let boundingBoxes = [];
    let loadedObjects = [];

    class CellComponent {
      constructor(gltf, shader = null) {
        return new Promise((resolve) => {
          this.scene = scene;
          this.position = new THREE.Vector3(0, 0, 0);

          // this.basePath = '/assets/obj/'; // PATHCHANGE
          this.basePath = 'https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/assets/obj/';
          this.loader = new GLTFLoader();
          const dracoLoader = new DRACOLoader()

          dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')
          this.loader.setDRACOLoader(dracoLoader)

          this.loadObject(gltf, shader, resolve);

          this.boundingBox = new THREE.Box3();
          boundingBoxes.push(this.boundingBox);

        });
      }

      loadObject(gltf, shader, resolve) {
        const fullPath = this.basePath + gltf;
        this.loader.load(fullPath, (gltf) => {
          this.object = gltf.scene;
          this.object.position.copy(this.position);
          this.scene.add(this.object);
          this.centerObject(this.object);
          if (shader) { this.applyCustomShader(shader); }

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

    const splashStartFOV = window.innerWidth < 768 ? 90 : 65; // 80 for mobile

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
    const splashEndFOV = splashStartFOV * 0.90; // 1.1x increase
    const diveStartFOV = splashEndFOV;
    const diveEndFOV = window.innerWidth < 768 ? 40 : 26; // 50 for mobile
    const zoomOutStartFOV = diveEndFOV;
    const zoomOutEndFOV = 160;

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
    const diveHeight = diveAreaRect.height;
    const splashHeight = splashAreaRect.height;

    let splashOffsetHeight = 0;
    const announcementElement = document.querySelector('.announcement');
    if (announcementElement) {
      splashOffsetHeight += announcementElement.getBoundingClientRect().height;
      announcementElement.getBoundingClientRect().height
    }
    const navElement = document.querySelector('.nav');
    if (navElement) {
      splashOffsetHeight += navElement.getBoundingClientRect().height;
    }

    function smoothLerp(start, end, progress) {
      return start + (end - start) * smoothstep(progress);
    }

    function smoothstep(x) {
      return x * x * (3 - 2 * x);
    }

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
      scrollTimeout = setTimeout(function () {
        controls.autoRotateSpeed = 0.5;
      }, 100);

      if (scrollY > zoomOutAreaRect.bottom) {
        lastScrollY = scrollY;
        return;
      }

      if (splashBool) {
        const rotation = rotationDegree / splashHeight;
        camera.position.y = rotation * 0.10;
        const splashProgress = Math.max(0, (scrollY - splashAreaRect.top) / (splashAreaRect.bottom - innerHeight - splashOffsetHeight));
        camera.fov = smoothLerp(splashStartFOV, splashEndFOV, splashProgress);
      } else if (diveBool) {
        controls.autoRotate = !(diveHeight * 0.75 + splashHeight < scrollY);
        const diveProgress = Math.max(0, Math.min(1, (scrollY + innerHeight - diveAreaRect.top) / (diveAreaRect.bottom - diveAreaRect.top)));
        camera.fov = smoothLerp(diveStartFOV, diveEndFOV, diveProgress);
      } else if (zoomOutBool) {
        controls.autoRotate = true;
        const zoomOutProgress = Math.max(0, (scrollY - zoomOutAreaRect.top) / (zoomOutAreaRect.bottom - zoomOutAreaRect.top));
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


        const sphereGeometry = new THREE.SphereGeometry(0.25, 6, 6);
        const color = i % 2 === 0 ? 0x333333 : 0x92cb86; // 5.16 TOWO COLORS
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: color });
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
  //controls.enableRotate = false;

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

  const bottleBlue = new THREE.MeshStandardMaterial({
    map: materialMap,
    roughness: 1,
    metalness: 0.75,
    side: THREE.DoubleSide,
    transparent: true
  });

  const bottleGreen = new THREE.MeshBasicMaterial({
    color: 0xd2ecbf,
    side: THREE.DoubleSide,
    transparent: true
  });

  let mixer, action;

  let figureObject = null;

  function figureInit() {

    // first, add background
    // Load the image as a texture
    const texture = new THREE.TextureLoader().load("assets/obj/shelf-wip2.png"); // PATHCHANGE TO GH

    const planeGeometry = new THREE.PlaneGeometry(150, 100); // Width, Height
    const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
    const imagePlane = new THREE.Mesh(planeGeometry, planeMaterial);

    // Set the position of the plane to be behind other elements
    imagePlane.position.z = -40;

    // Add the image plane to the scene
    scene.add(imagePlane);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    let figureHeight;
    const figureHeights = [];

    // PATHCHANGE
    // loader.load("assets/obj/figure.glb", function (gltf) {
    loader.load("https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/assets/obj/figure.glb", function (gltf) {

      figureObject = gltf.scene;
      figureObject.traverse(function (child) {
        // console.log(child.name)
        if (child.isMesh) {
          const bbox = new THREE.Box3().setFromObject(child);
          const height = bbox.max.y - bbox.min.y;
          figureHeights.push(height);
          child.material = materialBlue;

          if (child.name === "Head_and_shouldersbaked") {
            child.material = bottleGreen;
          }
        }
      });

      figureObject.scale.set(80, 80, 80);
      figureHeight = Math.max(...figureHeights);

      function responsiveAdjust() {

        let distance, figureX, figureY;
        if (window.innerWidth <= 320) {
          distance = 240;
          figureX = 20;
          figureY = -figureHeight * 80;
        } else if (window.innerWidth <= 768) {
          distance = 200;
          figureX = 30;
          figureY = -figureHeight * 80;
        } else if (window.innerWidth <= 996) {
          distance = 180;
          figureX = 25;
          figureY = -figureHeight * 80;
        } else {
          distance = 110;
          figureX = 30;
          figureY = -figureHeight * 70;
        }

        figureObject.position.set(figureX, figureY, 0);
        figureObject.rotation.y = -Math.PI / 6;

        camera.fov = 45;
        camera.position.set(0, figureHeight * 0.5, distance); // HM
        camera.lookAt(figureObject.position);
        camera.updateProjectionMatrix();

        handleResize(humanRender, camera);

      }

      responsiveAdjust();
      window.addEventListener('resize', responsiveAdjust);

      scene.add(figureObject);

      mixer = new THREE.AnimationMixer(figureObject);
      action = mixer.clipAction(gltf.animations[0]);
      action.play();

      loadLights();

    });
  }

  figureInit();

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
    const transitionSpacer = document.querySelector('.transition-spacer');
    const transitionSpacerHeight = transitionSpacer.offsetHeight;

    // Define the start and end of the animation range
    const animationStart = transitionSpacerHeight + viewportHeight; // Start earlier by subtracting the height of '.transition-spacer'
    const animationEnd = humanRect.height - viewportHeight;

    let scrollProgress = 0;

    if (humanRect.top <= animationStart && humanRect.bottom >= viewportHeight) {
      scrollProgress = Math.min(1, Math.max(0, Math.abs(humanRect.top - animationStart) / (animationEnd + transitionSpacerHeight)));

      if (figureObject) {
        if (scrollProgress >= 0.2) {
          let opacityProgress = (scrollProgress - 0.2) / 0.4; // Linearly progress opacity from 0 to 1 between scrollProgress 0.2 and 0.6
          figureObject.traverse(function (child) {
            if (child.isMesh && child.name == "Head_and_shouldersbaked") {
              child.material.opacity = opacityProgress;
            }
          });
        } else {
          figureObject.traverse(function (child) {
            if (child.isMesh && child.name === "Head_and_shouldersbaked") {
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
    const animationTime = scrollProgress * 5; // arbitrary multiplier... seems to work
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
  textFadeInit();
});