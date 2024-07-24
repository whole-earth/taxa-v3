import * as THREE from "three";
import { OrbitControls } from "three/OrbitControls";

import { GLTFLoader } from "three/GLTFLoader";
import { DRACOLoader } from 'three/DracoLoader';
import { threeSceneResize } from './anim.js';
import * as dat from 'https://cdn.jsdelivr.net/gh/whole-earth/taxa@master/node_modules/dat.gui/build/dat.gui.module.js';

export function initProductRenderer() {
    console.log('package three.js renderer')

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);

    const productRender = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    productRender.setSize(window.innerWidth, window.innerHeight);
    productRender.setPixelRatio(window.devicePixelRatio);
    document.querySelector('.product-three').appendChild(productRender.domElement);

    const controls = new OrbitControls(camera, productRender.domElement);
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

}
