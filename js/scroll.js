import { lastScrollY, setLastScrollY } from './anim.js';
import TinyTween from 'tiny-tween';

const splashArea = document.querySelector('.splash');
const zoomArea = document.querySelector('.zoom');
const zoomOutArea = document.querySelector('.zoom-out');
const productArea = document.querySelector('.product');
const textChildren = document.querySelectorAll('.child');
const zoomFirst = document.querySelector('#zoomFirst');
const zoomSecond = document.querySelector('#zoomSecond');
const zoomThird = document.querySelector('#zoomThird');
const zoomElements = [zoomFirst, zoomSecond, zoomThird];

const splashStartFOV = window.innerWidth < 768 ? 90 : 60;
const splashEndFOV = splashStartFOV * 0.50;
const zoomStartFOV = splashEndFOV;
const zoomEndFOV = splashEndFOV * 1.15;
const zoomOutStartFOV = zoomEndFOV;
const zoomOutEndFOV = 160;

const dotsGreen = '#92cb86';
const dotsRed = '#ff0000';
const dotsBlack = '#000000';
const dotsBlue = '#0000ff';

let splashBool, zoomBool, zoomOutBool, productBool;
let splashProgress, zoomProgress, zoomOutProgress, productProgress;
let zoomChildTextLogged = false; // remove in prod

export function animatePage(controls, camera, spheres, scrollTimeout) {
    let scrollY = window.scrollY;
    let scrollDiff = scrollY - lastScrollY;
    const multiplier = Math.floor(scrollDiff / 20);
    controls.autoRotateSpeed = 1.0 + (multiplier * 10);

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        controls.autoRotateSpeed = 0.2;
    }, 100);

    throttle(() => scrollLogic(camera, spheres), 30)();
    camera.updateProjectionMatrix();
    setLastScrollY(scrollY);
};

function scrollLogic(camera, spheres) {

    splashBool = isVisibleBetweenTopAndBottom(splashArea);
    zoomBool = isVisibleBetweenTopAndBottom(zoomArea);
    zoomOutBool = isVisibleBetweenTopAndBottom(zoomOutArea);
    productBool = isVisibleBetweenTopAndBottom(productArea);

    if (splashBool) {
        splashProgress = scrollProgress(splashArea);
        // console.log(`Splash ${splashProgress}`)
        camera.fov = smoothLerp(splashStartFOV, splashEndFOV, splashProgress);
        activateText(splashArea);
    }
    else if (zoomBool) {
        zoomProgress = scrollProgress(zoomArea);
        // console.log(`Zoom ${zoomProgress}`)
        camera.fov = smoothLerp(zoomStartFOV, zoomEndFOV, zoomProgress);
        activateText(zoomArea);
        if (zoomFirst && zoomSecond && zoomThird) {
            activateZoomChildText(zoomFirst);
            updateSphereProperties(spheres, null, null, 0, 1.0);
        }
        else if (zoomProgress >= 1 / 3 && zoomProgress < 2 / 3) {
            activateZoomChildText(zoomSecond);
            updateSphereProperties(spheres, dotsGreen, dotsRed, 1.0, 1.0);
        }
        else if (zoomProgress >= 2 / 3 && zoomProgress <= 1) {
            activateZoomChildText(zoomThird);
            updateSphereProperties(spheres, dotsRed, dotsBlack, 1.0, 1.0);
        }
        else {
            if (!zoomChildTextLogged) {
                console.log("Alert posted: no zoom children detected.")
                zoomChildTextLogged = true;
            }
        }
    }
    else if (zoomOutBool) {
        zoomOutProgress = scrollProgress(zoomOutArea);
        // console.log(`Zoom ${zoomProgress}`)
        camera.fov = smoothLerp(zoomOutStartFOV, zoomOutEndFOV, zoomOutProgress);

        activateText(zoomOutArea);

        updateSphereProperties(spheres, null, null, 1.0, 0);

    }
    else if (productBool) {
        productProgress = scrollProgress(productArea);
        console.log(`Product ${productProgress}`)

        activateText(productArea);
    }
}

// =====================================================================================
// =================================== HELPERS =========================================
// =====================================================================================


function isVisibleBetweenTopAndBottom(element) {
    const rect = element.getBoundingClientRect();
    return rect.top <= 0 && rect.bottom > 0;
}

function scrollProgress(element) {
    const rect = element.getBoundingClientRect();
    const scrollableDistance = rect.height;
    const scrolledDistance = Math.max(0, -rect.top);
    const progress = Math.max(0, Math.min(1, scrolledDistance / scrollableDistance));
    return parseFloat(progress).toFixed(4); // here we truncate!
}

function activateText(parentElement) {
    let activeText = parentElement.querySelector('.child');

    if (!activeText.classList.contains('active')) {
        textChildren.forEach(child => {
            if (child !== activeText && child.classList.contains('active')) {
                child.classList.remove('active');
            }
        });

        if (activeText && !activeText.classList.contains('active')) {
            activeText.classList.add('active');
        }
    }
}

function activateZoomChildText(activeElement) {
    zoomElements.forEach(element => {
        if (element === activeElement) {
            element.classList.add("active");
        } else {
            element.classList.remove("active");
        }
    });
}

function updateSphereProperties(spheres, prevColor, targetColor, currentOpacity, targetOpacity) {
    spheres.forEach(sphere => {
        if (prevColor && targetColor) {
            const prevColorObj = new THREE.Color(prevColor); // Assuming you're using THREE.js for colors
            const targetColorObj = new THREE.Color(targetColor);

            const tween = new TinyTween({
                from: { r: prevColorObj.r, g: prevColorObj.g, b: prevColorObj.b, opacity: currentOpacity },
                to: { r: targetColorObj.r, g: targetColorObj.g, b: targetColorObj.b, opacity: targetOpacity },
                duration: 300,
                easing: 'easeInOutQuad',
                step: (state) => {
                    sphere.material.color.setRGB(state.r, state.g, state.b);
                    sphere.material.opacity = state.opacity;
                    sphere.material.transparent = true;
                    sphere.material.needsUpdate = true;
                }
            });
            tween.start();
        } else {
            if (currentOpacity !== targetOpacity) {
                const tween = new TinyTween({
                    from: { opacity: currentOpacity },
                    to: { opacity: targetOpacity },
                    duration: 300,
                    easing: 'easeInOutQuad',
                    step: (state) => {
                        sphere.material.opacity = state.opacity;
                        sphere.material.transparent = true;
                        sphere.material.needsUpdate = true;
                    }
                });
                tween.start();
            }
        }
    });
}

function smoothLerp(start, end, progress) {
    return start + (end - start) * smoothstep(progress);
}

function smoothstep(x) {
    return x * x * (3 - 2 * x);
}

function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}