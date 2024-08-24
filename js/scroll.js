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
const productEndFOV = 100;

const dotsGreen = '#71ff00';
const dotsOrange = '#ff8e00';
const dotsYellow = '#f1ff00';
const fadeOutDuration = 60;
const fadeInDuration = 280;

// ============================

const productStartScale = 6;
const productEndScale = 4;
const cellStartScale = 1;
const cellEndScale = 0.05;

// ============================

function scrollLogic(controls, camera, cellObject, spheres, wavingBlob, dotBounds, product) {
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
                dotTweenOpacity(spheres, 1, 0, wavingBlob, false, fadeOutDuration);
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
                    activateText__ZoomChild(zoomFirst);

                    if (comingFrom == 'splash') {
                        dotTweenOpacity(spheres, 0, 1, wavingBlob, true, fadeInDuration);
                    } else if (comingFrom == 'zoomAreaSecond') {
                        dotTweenOpacity(spheres, 1, 0, wavingBlob, false, fadeOutDuration);
                        setTimeout(() => {
                            dotUpdateColors(spheres, dotsGreen);
                            dotRandomizePositions(spheres, dotBounds);
                            dotTweenOpacity(spheres, 0, 1, wavingBlob, true, fadeInDuration);
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
                    dotTweenOpacity(spheres, 1, 0, wavingBlob, false, fadeOutDuration);

                    setTimeout(() => {
                        dotUpdateColors(spheres, dotsOrange);
                        dotRandomizePositions(spheres, dotBounds);
                        dotTweenOpacity(spheres, 0, 1, wavingBlob, true, fadeInDuration);
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
                        dotTweenOpacity(spheres, 1, 0, wavingBlob, false, fadeOutDuration);
                        setTimeout(() => {
                            dotUpdateColors(spheres, dotsYellow);
                            dotRandomizePositions(spheres, dotBounds);
                            dotTweenOpacity(spheres, 0, 1, wavingBlob, true, fadeInDuration);
                        }, fadeOutDuration);
                    } else if (comingFrom == 'zoomOutArea') {
                        dotTweenOpacity(spheres, 0, 1, wavingBlob, true, fadeInDuration);
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
                dotTweenOpacity(spheres, 1, 0, wavingBlob, false, fadeOutDuration);
            } else if (comingFrom == 'productArea') {
                controls.autoRotate = true;

                product.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = 0;
                        child.material.needsUpdate = true;
                    }
                });
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

        if (!productAlready) {
            controls.autoRotate = false;
            controls.enableRotate = false;
            controls.autoRotateSpeed = 0;
            activateText(productArea);
            splashAlready = false;
            zoomAlready = false;
            zoomOutAlready = false;
            productAlready = true;
            comingFrom = 'productArea';
        }

        productProgress = scrollProgress__Last(productArea);
        camera.fov = smoothLerp(productStartFOV, productEndFOV, productProgress);

        if (product && product.children) {

            //cell scale
            const cellScale = smoothLerp(cellStartScale, cellEndScale, productProgress);
            cellObject.scale.set(cellScale, cellScale, cellScale);

            // cell opacity
            cellObject.children.forEach(child => {
                child.traverse(innerChild => {
                    if (innerChild.material) {
                        innerChild.material.opacity = 1 - productProgress;
                        innerChild.material.needsUpdate = true;
                    }
                });
            });

            // product opacity
            product.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = productProgress;
                    child.material.needsUpdate = true;
                }
            });

            // product scale
            const productScale = smoothLerp(productStartScale, productEndScale, productProgress);
            product.scale.set(productScale, productScale, productScale);

            // product transform
            if (0 < productProgress && productProgress <= 0.4) {
                product.rotation.x = Math.PI / 2;
            } else if (0.4 < productProgress && productProgress <= 0.8) {
                const rotationProgress = (productProgress - 0.4) / 0.4;
                const startRotation = Math.PI / 2;
                const endRotation = 0;
                product.rotation.x = smoothLerp(startRotation, endRotation, rotationProgress);
                product.rotation.z = 0;
            } else if (0.8 < productProgress && productProgress <= 1) {

                product.rotation.x = 0;
                const rotationProgress = (productProgress - 0.8) / 0.2;
                const startRotation = 0;
                const endRotation = -Math.PI / 5;
                product.rotation.z = smoothLerp(startRotation, endRotation, rotationProgress);
            }
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

export function animatePage(controls, camera, cellObject, spheres, wavingBlob, dotBounds, product, scrollTimeout) {
    let scrollY = window.scrollY;
    let scrollDiff = scrollY - lastScrollY;
    const multiplier = Math.floor(scrollDiff / 20);
    controls.autoRotateSpeed = 1.0 + (multiplier * 10);

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        controls.autoRotateSpeed = 0.2;
    }, 100);

    throttle(() => scrollLogic(controls, camera, cellObject, spheres, wavingBlob, dotBounds, product), 30)();
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

function dotTweenOpacity(spheres, initialOpacity, targetOpacity, wavingBlob, scale = false, duration = 300) {
    tweenGroup.removeAll();
    spheres.forEach(sphere => {
        const currentState = { opacity: initialOpacity };
        const targetState = { opacity: targetOpacity };

        const sphereTween = new Tween(currentState)
            .to(targetState, duration)
            .easing(Easing.Quadratic.InOut)
            .onUpdate(() => {
                sphere.material.opacity = currentState.opacity;
                sphere.material.needsUpdate = true;
            })
            .onComplete(() => {
                tweenGroup.remove(sphereTween);
            });

        tweenGroup.add(sphereTween);
        sphereTween.start();
    });

    if (scale) {
        const initialScale = { scale: 0.8 };
        const targetScale = { scale: 1.0 };

        const scaleTween = new Tween(initialScale)
            .to(targetScale, (duration * 1.2))
            .easing(Easing.Quadratic.InOut)
            .onUpdate(() => {
                wavingBlob.scale.set(initialScale.scale, initialScale.scale, initialScale.scale);
            })
            .onComplete(() => {
                tweenGroup.remove(scaleTween);
            });

        tweenGroup.add(scaleTween);
        scaleTween.start();
    }
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