import * as THREE from "three";
import { GLTFLoader } from "three/GLTFLoader";
import { DRACOLoader } from 'three/DracoLoader';
import { OrbitControls } from "three/OrbitControls";
import { threeSceneResize } from './anim.js';
import * as dat from 'https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/node_modules/dat.gui/build/dat.gui.module.js';

export function initVialRenderer() {

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);

  const humanRender = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  humanRender.setSize(window.innerWidth, window.innerHeight);
  humanRender.setPixelRatio(window.devicePixelRatio);
  document.querySelector('.human-three').appendChild(humanRender.domElement);

  const controls = new OrbitControls(camera, humanRender.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.enableZoom = false;
  // controls.enableRotate = false;

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

    const ambientLight = new THREE.AmbientLight(0x849ED0, 5);
    scene.add(ambientLight);

  }

  const materialMap = new THREE.TextureLoader().load("https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/assets/figure/blue.jpg");

  const materialBlue = new THREE.MeshStandardMaterial({
    map: materialMap,
    roughness: 1,
    metalness: 0.6,
    side: THREE.DoubleSide
  }); // MAKE SOFTER

  const bottleGreen = new THREE.MeshBasicMaterial({
    color: 0xd2ecbf,
    side: THREE.DoubleSide,
    transparent: true
  });

  let mixer, action, shelfObj;

  let figureObject = null;

  function figureInit() {

    const shelfSrc = new THREE.TextureLoader().load("https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/assets/figure/shelf.png");
    const shelfPlane = new THREE.PlaneGeometry(210, 120);
    const shelfMaterial = new THREE.MeshBasicMaterial({ map: shelfSrc, side: THREE.DoubleSide, transparent: true });
    shelfObj = new THREE.Mesh(shelfPlane, shelfMaterial);

    shelfObj.position.y = -21;
    shelfObj.position.z = -40;
    shelfObj.material.opacity = 0;

    scene.add(shelfObj);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    let figureHeight;
    const figureHeights = [];

    loader.load("https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/assets/figure/figure.glb", function (gltf) {

      figureObject = gltf.scene;
      figureObject.traverse(function (child) {
        if (child.isMesh) {
          const bbox = new THREE.Box3().setFromObject(child);
          const height = bbox.max.y - bbox.min.y;
          figureHeights.push(height);
          child.material = materialBlue;
          if (child.name === "Head_and_shoulders") {
            child.material = bottleGreen;
          }
        }
      });

      figureObject.scale.set(80, 80, 80);
      figureHeight = Math.max(...figureHeights);

      function humanResizeScale() {

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
        camera.position.set(0, figureHeight * 0.5, distance); // what actually sets the camera
        camera.lookAt(figureObject.position);
        camera.updateProjectionMatrix();

        threeSceneResize(humanRender, camera);

      }

      humanResizeScale();
      window.addEventListener('resize', humanResizeScale);

      scene.add(figureObject);

      mixer = new THREE.AnimationMixer(figureObject);
      action = mixer.clipAction(gltf.animations[0]);
      action.play();

      loadLights();

      // Add GUI for materialBlue properties
      const gui = new dat.GUI();
      const materialFolder = gui.addFolder('Material Blue');
      materialFolder.add(materialBlue, 'roughness', 0, 1);
      materialFolder.add(materialBlue, 'metalness', 0, 1);
      materialFolder.addColor(materialBlue, 'color');
      materialFolder.open();

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
        if (scrollProgress >= 0.1) {
          let opacityProgress = (scrollProgress - 0.1) / 0.2;
          figureObject.traverse(function (child) {
            if (child.isMesh && child.name == "Head_and_shoulders") {
              child.material.opacity = opacityProgress;
            }
          });
          shelfObj.material.opacity = opacityProgress;
        } else {
          figureObject.traverse(function (child) {
            if (child.isMesh && child.name === "Head_and_shoulders") {
              shelfObj.material.opacity = 0;
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
      mixer.update(0.01);
      humanScroll();
    }

    humanRender.render(scene, camera);

  }

  animate();

}