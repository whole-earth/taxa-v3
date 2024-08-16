import { lastScrollY, setLastScrollY } from './anim.js';

const splashArea = document.querySelector('.splash');
const zoomArea = document.querySelector('.zoom');
const zoomOutArea = document.querySelector('.zoom-out');
const productArea = document.querySelector('.product');
const textChildren = document.querySelectorAll('.child');
const zoomFirst = document.querySelector('#zoomFirst');
const zoomSecond = document.querySelector('#zoomSecond');
const zoomThird = document.querySelector('#zoomThird');

const splashStartFOV = window.innerWidth < 768 ? 90 : 60;
const splashEndFOV = splashStartFOV * 0.50;
const zoomStartFOV = splashEndFOV;
const zoomEndFOV = splashEndFOV * 1.15;
const zoomOutStartFOV = zoomEndFOV;
const zoomOutEndFOV = 160;

const dotsRed = 0xff0000;
const dotsBlack = 0x000000;
const dotsBlue = 0x0000ff;

let splashBool, zoomBool, zoomOutBool, productBool;
let splashProgress, zoomProgress, zoomOutProgress, productProgress;
let zoomChildTextLogged = false; // remove for prod

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

        // if not already set?? avoid resetting too much
        updateSphereProperties(spheres, "orange", 0);

    }
    else if (zoomBool) {
        zoomProgress = scrollProgress(zoomArea);
        // console.log(`Zoom ${zoomProgress}`)
        camera.fov = smoothLerp(zoomStartFOV, zoomEndFOV, zoomProgress);

        activateText(zoomArea);

        updateSphereProperties(spheres, dotsBlack, 1);

        if (zoomFirst && zoomSecond && zoomThird) {
            if (zoomProgress >= 0 && zoomProgress < 1 / 3) {
                updateSphereProperties(spheres, dotsRed, 1);
                zoomFirst.classList.add("active");
                if (zoomSecond.classList.contains("active")) {
                    zoomSecond.classList.remove("active");
                }
                if (zoomThird.classList.contains("active")) {
                    zoomThird.classList.remove("active");
                }
            }
            else if (zoomProgress >= 1 / 3 && zoomProgress < 2 / 3) {
                zoomSecond.classList.add("active");
                updateSphereProperties(spheres, dotsBlack, 1);
                if (zoomFirst.classList.contains("active")) {
                    zoomFirst.classList.remove("active");
                }
                if (zoomThird.classList.contains("active")) {
                    zoomThird.classList.remove("active");
                }
            }
            else if (zoomProgress >= 2 / 3 && zoomProgress <= 1) {
                zoomThird.classList.add("active");
                updateSphereProperties(spheres, dotsBlue, 1);
                if (zoomFirst.classList.contains("active")) {
                    zoomFirst.classList.remove("active");
                }
                if (zoomSecond.classList.contains("active")) {
                    zoomSecond.classList.remove("active");
                }
            }
        }
        else {
            if (!zoomChildTextLogged) {
                //alert("No zoom child text found");
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

        updateSphereProperties(spheres, "orange", 0);

    }
    else if (productBool) {
        productProgress = scrollProgress(productArea);
        // console.log(`Product ${productProgress}`)

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

function updateSphereProperties(spheres, color, opacity) {
    spheres.forEach(sphere => {
        sphere.material.color.set(color);
        sphere.material.opacity = opacity;
        sphere.material.transparent = true;
        sphere.material.needsUpdate = true;
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