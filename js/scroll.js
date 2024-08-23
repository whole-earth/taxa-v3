import * as THREE from 'three';
import { Tween, Easing } from 'tween';
import { lastScrollY, setLastScrollY, tweenGroup } from './anim.js';

const splashStartFOV = window.innerWidth < 768 ? 90 : 60;
const splashEndFOV = splashStartFOV * 0.50;
const zoomStartFOV = splashEndFOV;
const zoomEndFOV = splashEndFOV * 1.15;
const zoomOutStartFOV = zoomEndFOV;
const zoomOutEndFOV = splashStartFOV;
const productStartFOV = zoomOutEndFOV;
const productEndFOV = 150;

const dotsGreen = '#71ff00';
const dotsOrange = '#ff8e00';
const dotsYellow = '#f1ff00';
const fadeOutDuration = 60;
const fadeInDuration = 280;

function scrollLogic(controls, camera, spheres, dotBounds, product) {
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
                dotTweenOpacity(spheres, 1, 0);
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
        console.log(zoomProgress)

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
                    activateText__ZoomChild(zoomFirst);

                    if (comingFrom == 'splash') {
                        dotTweenOpacity(spheres, 0, 1, fadeInDuration);
                    } else if (comingFrom == 'zoomAreaSecond') {
                        dotTweenOpacity(spheres, 1, 0, fadeOutDuration);
                        setTimeout(() => {
                            dotUpdateColors(spheres, dotsGreen);
                            dotRandomizePositions(spheres, dotBounds);
                            dotTweenOpacity(spheres, 0, 1, fadeInDuration);
                        }, fadeOutDuration);
                    }

                    zoomFirstAlready = true;
                    zoomSecondAlready = false;
                    zoomThirdAlready = false;
                    comingFrom = 'zoomAreaFirst';
                }
            }
            else if (zoomProgress >= 1 / 3 && zoomProgress < 2 / 3) {
                if (!zoomSecondAlready) {

                    activateText__ZoomChild(zoomSecond);
                    dotTweenOpacity(spheres, 1, 0, fadeOutDuration);

                    setTimeout(() => {
                        dotUpdateColors(spheres, dotsOrange);
                        dotRandomizePositions(spheres, dotBounds);
                        dotTweenOpacity(spheres, 0, 1, fadeInDuration);
                    }, fadeOutDuration);

                    zoomFirstAlready = false;
                    zoomSecondAlready = true;
                    zoomThirdAlready = false;
                    comingFrom = 'zoomAreaSecond';
                }
            }
            else if (zoomProgress >= 2 / 3 && zoomProgress <= 1) {
                if (!zoomThirdAlready) {
                    activateText__ZoomChild(zoomThird);

                    if (comingFrom == 'zoomAreaSecond') {
                        dotTweenOpacity(spheres, 1, 0, fadeOutDuration);
                        setTimeout(() => {
                            dotUpdateColors(spheres, dotsYellow);
                            dotRandomizePositions(spheres, dotBounds);
                            dotTweenOpacity(spheres, 0, 1, fadeInDuration);
                        }, fadeOutDuration);
                    } else if (comingFrom == 'zoomOutArea') {
                        dotTweenOpacity(spheres, 0, 1, fadeInDuration);
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
                dotTweenOpacity(spheres, 1, 0, 240); // final fadeout
            } else if (comingFrom == 'productArea') {
                controls.autoRotate = true;
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
        // console.log(productProgress)

        camera.fov = smoothLerp(productStartFOV, productEndFOV, productProgress);

        // and the scale() of product must be > inverse of fov
        // make product accessible

        if (!productAlready) {
            controls.autoRotate = false;
            controls.enableRotate = false;

            if (product) {
                // set opacity to 1
            }
            // console.log(product)

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

export function animatePage(controls, camera, spheres, dotBounds, product, scrollTimeout) {
    let scrollY = window.scrollY;
    let scrollDiff = scrollY - lastScrollY;
    const multiplier = Math.floor(scrollDiff / 20);
    controls.autoRotateSpeed = 1.0 + (multiplier * 10);

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        controls.autoRotateSpeed = 0.2;
    }, 100);

    throttle(() => scrollLogic(controls, camera, spheres, dotBounds, product), 30)();
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

function activateText__ZoomChild(activeElement) {
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

// to use, must first add accessor to ribbons variable from /anim.js
function ribbonTweenOpacity(ribbons, initialOpacity, targetOpacity) {
    const currentState = { opacity: initialOpacity };
    const targetState = { opacity: targetOpacity };

    const tween = new Tween(currentState)
        .to(targetState, 300) // 0.4 seconds
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

function dotTweenOpacity(spheres, initialOpacity, targetOpacity, duration = 300) {
    tweenGroup.removeAll();

    spheres.forEach(sphere => {
        const currentState = { opacity: initialOpacity };
        const targetState = { opacity: targetOpacity };
        const tween = new Tween(currentState)
            .to(targetState, duration)
            .easing(Easing.Quadratic.InOut)
            .onUpdate(() => {
                sphere.material.opacity = currentState.opacity;
                sphere.material.needsUpdate = true;
            })
            .onComplete(() => {
                tweenGroup.remove(tween);
            });

        tweenGroup.add(tween);
        tween.start();
    });
}

function dotUpdateColors(spheres, color) {
    spheres.forEach(sphere => {
        sphere.material.color = new THREE.Color(color);
        sphere.material.needsUpdate = true;
    });
}

function dotRandomizePositions(spheres, dotBounds) {
    spheres.forEach(sphere => {
        const randomPosition = getRandomPositionWithinBounds(dotBounds);
        sphere.position.copy(randomPosition);
        const randomDirection = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        sphere.velocity = randomDirection.multiplyScalar(0.014);
        sphere.position.needsUpdate = true;
        sphere.velocity.needsUpdate = true;
    });

    function getRandomPositionWithinBounds(bounds) {
        const x = (Math.random() * 2 - 1) * (bounds * 0.65);
        const y = (Math.random() * 2 - 1) * (bounds * 0.65);
        const z = (Math.random() * 2 - 1) * (bounds * 0.65);
        return new THREE.Vector3(x, y, z);
    }
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