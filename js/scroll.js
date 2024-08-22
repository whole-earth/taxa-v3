import * as THREE from 'three';
import { Tween, Easing } from 'tween';
import { lastScrollY, setLastScrollY, tweenGroup } from './anim.js';

const splashStartFOV = window.innerWidth < 768 ? 90 : 60;
const splashEndFOV = splashStartFOV * 0.50;
const zoomStartFOV = splashEndFOV;
const zoomEndFOV = splashEndFOV * 1.15;
const zoomOutStartFOV = zoomEndFOV;
const zoomOutEndFOV = splashStartFOV;
//const productStartFOV = zoomOutEndFOV;
//const productEndFOV = 150;

const dotsGreen = '#71ff00';
const dotsRed = '#ff8e00';
const dotsYellow = '#f1ff00';

function scrollLogic(controls, camera, spheres) {

    splashBool = isVisibleBetweenTopAndBottom(splashArea);
    zoomBool = isVisibleBetweenTopAndBottom(zoomArea);
    zoomOutBool = isVisibleBetweenTopAndBottom(zoomOutArea);
    productBool = isVisibleBetweenTopAndBottom(productArea);

    if (splashBool) {
        splashProgress = scrollProgress(splashArea);
        camera.fov = smoothLerp(splashStartFOV, splashEndFOV, splashProgress);

        if (!splashAlready) {
            activateText(splashArea);
            if (comingFrom == 'zoomAreaFirst') {
                tweenDots(spheres, dotsGreen, dotsGreen, 1, 0);
            }
            splashAlready = true;
            zoomAlready = false;
            zoomOutAlready = false;
            productAlready = false;
            zoomFirstAlready = false;
            zoomSecondAlready = false;
            zoomThirdAlready = false;
            comingFrom = 'splash';
        }
    }
    else if (zoomBool) {
        zoomProgress = scrollProgress(zoomArea);
        camera.fov = smoothLerp(zoomStartFOV, zoomEndFOV, zoomProgress);

        if (!zoomAlready) {
            activateText(zoomArea);
            splashAlready = false;
            zoomAlready = true;
            zoomOutAlready = false;
            productAlready = false;
        }

        if (zoomFirst && zoomSecond && zoomThird) {
            if (zoomProgress >= 0 && zoomProgress < 1 / 3) {
                if (!zoomFirstAlready) {
                    activateZoomChildText(zoomFirst);

                    if (comingFrom == 'splash') {
                        tweenDots(spheres, dotsGreen, dotsGreen, 0, 1);
                    } else if (comingFrom == 'zoomAreaSecond') {
                        tweenDots(spheres, dotsRed, dotsGreen);
                    }

                    zoomFirstAlready = true;
                    zoomSecondAlready = false;
                    zoomThirdAlready = false;
                    comingFrom = 'zoomAreaFirst';
                }
            }
            else if (zoomProgress >= 1 / 3 && zoomProgress < 2 / 3) {
                if (!zoomSecondAlready) {
                    activateZoomChildText(zoomSecond);

                    if (comingFrom == 'zoomAreaFirst') {
                        tweenDots(spheres, dotsGreen, dotsRed);
                    } else if (comingFrom == 'zoomAreaThird') {
                        tweenDots(spheres, dotsYellow, dotsRed);
                    }

                    zoomFirstAlready = false;
                    zoomSecondAlready = true;
                    zoomThirdAlready = false;
                    comingFrom = 'zoomAreaSecond';
                }
            }
            else if (zoomProgress >= 2 / 3 && zoomProgress <= 1) {
                if (!zoomThirdAlready) {
                    activateZoomChildText(zoomThird);
                    controls.autoRotate = true;

                    if (comingFrom == 'zoomAreaSecond') {
                        tweenDots(spheres, dotsRed, dotsYellow);
                    } else if (comingFrom == 'zoomOutArea') {
                        tweenDots(spheres, dotsYellow, dotsYellow, 0, 1);
                    }

                    zoomFirstAlready = false;
                    zoomSecondAlready = false;
                    zoomThirdAlready = true;
                    comingFrom = 'zoomAreaThird';
                }
            }
        }
    }
    else if (zoomOutBool) {
        zoomOutProgress = scrollProgress(zoomOutArea);
        camera.fov = smoothLerp(zoomOutStartFOV, zoomOutEndFOV, zoomOutProgress);

        if (!zoomOutAlready) {
            activateText(zoomOutArea);

            if (comingFrom == 'zoomAreaThird') {
                tweenDots(spheres, dotsYellow, dotsYellow, 1, 0);
            }

            splashAlready = false;
            zoomAlready = false;
            zoomOutAlready = true;
            productAlready = false;
            zoomFirstAlready = false;
            zoomSecondAlready = false;
            zoomThirdAlready = false;
            comingFrom = 'zoomOutArea';
        }

    }
    else if (productBool) {
        productProgress = scrollProgress__Last(productArea);
        console.log(productProgress)
        
        // fov logic
        // scale logic

        if (!productAlready) {
            controls.autoRotate = false;
            controls.enableRotate = false;
            activateText(productArea);
            splashAlready = false;
            zoomAlready = false;
            zoomOutAlready = false;
            productAlready = true;
            comingFrom = 'productArea';
        }

    }
}

// =====================================================================================

const splashArea = document.querySelector('.splash');
const zoomArea = document.querySelector('.zoom');
const zoomOutArea = document.querySelector('.zoom-out');
const productArea = document.querySelector('.product');

const textChildren = document.querySelectorAll('.child');
const zoomFirst = document.querySelector('#zoomFirst');
const zoomSecond = document.querySelector('#zoomSecond');
const zoomThird = document.querySelector('#zoomThird');
const zoomElements = [zoomFirst, zoomSecond, zoomThird];

let splashBool, zoomBool, zoomOutBool, productBool;
let splashProgress, zoomProgress, zoomOutProgress, productProgress;

let comingFrom = "splash";

let splashAlready = false;
let zoomAlready = false;
let zoomOutAlready = false;
let productAlready = false;

let zoomFirstAlready = false;
let zoomSecondAlready = false;
let zoomThirdAlready = false;

export function animatePage(controls, camera, spheres, scrollTimeout) {
    let scrollY = window.scrollY;
    let scrollDiff = scrollY - lastScrollY;
    const multiplier = Math.floor(scrollDiff / 20);
    controls.autoRotateSpeed = 1.0 + (multiplier * 10);

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        controls.autoRotateSpeed = 0.2;
    }, 100);

    throttle(() => scrollLogic(controls, camera, spheres), 30)();
    camera.updateProjectionMatrix();
    setLastScrollY(scrollY);
};

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

function scrollProgress__Last(element) {
    const rect = element.getBoundingClientRect();
    const scrollableDistance = rect.height - window.innerHeight;
    const scrolledDistance = Math.max(0, -rect.top);
    const progress = Math.max(0, Math.min(1, scrolledDistance / scrollableDistance));
    return parseFloat(progress).toFixed(4);
}

function activateText(parentElement) {

    let activeText = parentElement.querySelector('.child');

    if (activeText) {
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
}

function activateZoomChildText(activeElement) {
    if (activeElement) {
        zoomElements.forEach(element => {
            if (element === activeElement) {
                element.classList.add("active");
            } else {
                element.classList.remove("active");
            }
        });
    }
}

function tweenDots(spheres, initialColor, targetColor, initialOpacity = null, targetOpacity = null) {

    // reset array each time its called
    tweenGroup.removeAll();

    spheres.forEach(sphere => {
        const prevColorObj = new THREE.Color(initialColor);
        const targetColorObj = new THREE.Color(targetColor);

        const currentState = {
            r: prevColorObj.r,
            g: prevColorObj.g,
            b: prevColorObj.b,
            ...(initialOpacity !== null && { opacity: initialOpacity })
        };

        const targetState = {
            r: targetColorObj.r,
            g: targetColorObj.g,
            b: targetColorObj.b,
            ...(targetOpacity !== null && { opacity: targetOpacity })
        };

        const tween = new Tween(currentState)
            .to(targetState, 400)
            .easing(Easing.Quadratic.InOut)
            .onUpdate(() => {
                sphere.material.color.setRGB(currentState.r, currentState.g, currentState.b);
                if (initialOpacity !== null && targetOpacity !== null) {
                    sphere.material.opacity = currentState.opacity;
                }
                sphere.material.needsUpdate = true;
            })
            .onComplete(() => {
                tweenGroup.remove(tween);
            })
        tweenGroup.add(tween);
        tween.start();
    });
}

// to use, must first add accessor to ribbons variable from /anim.js
function tweenRibbons(ribbons, initialOpacity, targetOpacity) {
    const currentState = { opacity: initialOpacity };
    const targetState = { opacity: targetOpacity };

    const tween = new Tween(currentState)
        .to(targetState, 400) // 0.4 seconds
        .easing(Easing.Quadratic.InOut)
        .onUpdate(() => {
            ribbons.material.opacity = currentState.opacity;
            ribbons.material.needsUpdate = true;
        })
        .onComplete(() => {
            tweenGroup.remove(tween);
        });

    tweenGroup.add(tween);
    tween.start();
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