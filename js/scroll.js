import * as THREE from 'three';
import { Tween, Easing } from 'tween';
import { lastScrollY, setLastScrollY, ribbonTweenGroup, dotTweenGroup } from './anim.js';

const splashStartFOV = window.innerWidth < 768 ? 90 : 60;
const splashEndFOV = splashStartFOV * 0.55;
const zoomStartFOV = splashEndFOV;
const zoomEndFOV = splashEndFOV * 1.1;
const zoomOutStartFOV = zoomEndFOV;
const zoomOutEndFOV = splashStartFOV;
const pitchStartFOV = zoomOutEndFOV;
const pitchEndFOV = pitchStartFOV * 1.2;
const productStartFOV = pitchEndFOV;
const productEndFOV = productStartFOV;

const dotsGreen = new THREE.Color('#71ff00');
const dotsOrange = new THREE.Color('#ff8e00');
const dotsYellow = new THREE.Color('#f1ff00');
const fadeInDuration = 500;
const fadeOutDuration = 180;

// ============================

const productStartScale = 7;
const productEndScale = 5;

// ============================

function scrollLogic(controls, camera, cellObject, ribbons, spheres, wavingBlob, dotBounds, product) {
    splashBool = isVisibleBetweenTopAndBottom(splashArea);
    zoomBool = isVisibleBetweenTopAndBottom(zoomArea);
    zoomOutBool = isVisibleBetweenTopAndBottom(zoomOutArea);
    pitchBool = isVisibleBetweenTopAndBottom(pitchArea);
    productBool = isVisibleBetweenTopAndBottom(productArea);

    if (splashBool) {
        splashProgress = scrollProgress(splashArea);
        camera.fov = smoothLerp(splashStartFOV, splashEndFOV, splashProgress);

        if (!splashAlready) {
            activateText(splashArea);
            if (comingFrom == 'zoomAreaFirst') {
                dotTweenOpacity(spheres, 1, 0, wavingBlob, fadeOutDuration);
                ribbonTweenOpacity(ribbons, 0, 1);
            }
            splashAlready = true;
            zoomAlready = false;
            zoomOutAlready = false;
            pitchAlready = false;
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
            ribbonTweenOpacity(ribbons, 1, 0);
            splashAlready = false;
            zoomAlready = true;
            zoomOutAlready = false;
            pitchAlready = false;
            productAlready = false;
        }

        if (zoomFirst && zoomSecond && zoomThird) {
            if (zoomProgress >= 0 && zoomProgress < 1 / 3) {
                if (!zoomFirstAlready) {
                    activateText__ZoomChild(zoomFirst);

                    if (comingFrom == 'splash') {
                        dotTweenOpacity(spheres, 0, 1, wavingBlob, fadeInDuration);
                    } else if (comingFrom == 'zoomAreaSecond') {
                        dotTweenOpacity(spheres, 1, 0, wavingBlob, fadeOutDuration);
                        setTimeout(() => {
                            dotUpdateColors(spheres, dotsGreen);
                            dotRandomizePositions(spheres, dotBounds);
                            dotTweenOpacity(spheres, 0, 1, wavingBlob, fadeInDuration);
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
                    dotTweenOpacity(spheres, 1, 0, wavingBlob, fadeOutDuration);

                    if (comingFrom == 'zoomAreaFirst') {
                    } else if (comingFrom == 'zoomAreaThird') {
                    }

                    setTimeout(() => {
                        dotUpdateColors(spheres, dotsOrange);
                        dotRandomizePositions(spheres, dotBounds);
                        dotTweenOpacity(spheres, 0, 1, wavingBlob, fadeInDuration);
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
                        dotTweenOpacity(spheres, 1, 0, wavingBlob, fadeOutDuration);
                        setTimeout(() => {
                            dotUpdateColors(spheres, dotsYellow);
                            dotRandomizePositions(spheres, dotBounds);
                            dotTweenOpacity(spheres, 0, 1, wavingBlob, fadeInDuration);
                        }, fadeOutDuration);
                    } else if (comingFrom == 'zoomOutArea') {
                        dotTweenOpacity(spheres, 0, 1, wavingBlob, fadeInDuration);
                        ribbonTweenOpacity(ribbons, 1, 0);
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

            textChildren.forEach(child => {
                if (child.classList.contains('active')) {
                    child.classList.remove('active');
                }
            });

            if (comingFrom == 'zoomAreaThird') {
                dotTweenOpacity(spheres, 1, 0, wavingBlob, fadeOutDuration);
                ribbonTweenOpacity(ribbons, 0, 1);
            }

            splashAlready = false;
            zoomAlready = false;
            zoomOutAlready = true;
            pitchAlready = false;
            productAlready = false;
            zoomFirstAlready = false;
            zoomSecondAlready = false;
            zoomThirdAlready = false;
            comingFrom = 'zoomOutArea';
        }

    }
    else if (pitchBool) {
        pitchProgress = scrollProgress(pitchArea);
        camera.fov = smoothLerp(pitchStartFOV, pitchEndFOV, pitchProgress);

        if (!pitchAlready) {
            activateText(pitchArea, false);

            if (comingFrom == 'productArea') {
                controls.autoRotate = true;
                controls.enableRotate = true;
                controls.autoRotateSpeed = 0.2;

                if (product) {
                    product.children.forEach(child => {
                        if (child.material) {
                            child.material.opacity = 0;
                            child.material.needsUpdate = true;
                        }
                    });
                }
            }

            splashAlready = false;
            zoomAlready = false;
            zoomOutAlready = false;
            pitchAlready = true;
            productAlready = false;
            comingFrom = 'pitchArea';

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
            pitchAlready = false;
            productAlready = true;
            comingFrom = 'productArea';
        }

        productProgress = scrollProgress__Last(productArea);

        if (product && product.children) {

            productProgress__0_40 = productProgress <= 0.4 ? productProgress / 0.4 : 1;

            camera.fov = smoothLerp(productStartFOV, productEndFOV, productProgress__0_40);

            const cellScale = smoothLerp(1, 0.1, productProgress__0_40);
            cellObject.scale.set(cellScale, cellScale, cellScale);

            cellObject.children.forEach(child => {
                child.traverse(innerChild => {
                    if (innerChild.material) {
                        innerChild.material.opacity = 1 - productProgress__0_40;
                        innerChild.material.needsUpdate = true;
                    }
                });
            });

            // product scale
            const productScale = smoothLerp(productStartScale, productEndScale, productProgress);
            product.scale.set(productScale, productScale, productScale);

            // product transform
            if (0 < productProgress && productProgress <= 0.25) {
                product.rotation.x = Math.PI / 2;

            } else if (0.25 < productProgress && productProgress <= 0.8) {
                const rotationProgress = (productProgress - 0.25) / 0.55;
                const startRotation = Math.PI / 2;
                const endRotation = 0;
                product.rotation.x = smoothLerp(startRotation, endRotation, rotationProgress);
                product.rotation.z = 0;
                product.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = rotationProgress;
                        child.material.needsUpdate = true;
                    }
                });

            } else if (0.8 < productProgress && productProgress <= 1) {
                product.rotation.x = 0;
                const rotationProgress = (productProgress - 0.8) / 0.2;
                const startRotation = 0;
                const endRotation = -Math.PI / 5;
                product.rotation.z = smoothLerp(startRotation, endRotation, rotationProgress);
            }
        } else (console.log('product loading'))
    }
}

// =====================================================================================

const splashArea = document.querySelector('.splash');
const zoomArea = document.querySelector('.zoom');
const zoomOutArea = document.querySelector('.zoom-out');
const pitchArea = document.querySelector('.pitch');
const productArea = document.querySelector('.product');

const textChildren = document.querySelectorAll('.child');
const zoomFirst = document.querySelector('#zoomFirst');
const zoomSecond = document.querySelector('#zoomSecond');
const zoomThird = document.querySelector('#zoomThird');
const zoomElements = [zoomFirst, zoomSecond, zoomThird];

let splashBool, zoomBool, zoomOutBool, pitchBool, productBool;
let splashProgress, zoomProgress, zoomOutProgress, pitchProgress, productProgress, productProgress__0_40;

let comingFrom = "splash";
let activeTextTimeout;

let splashAlready = false;
let zoomAlready = false;
let zoomOutAlready = false;
let pitchAlready = false;
let productAlready = false;

let zoomFirstAlready = false;
let zoomSecondAlready = false;
let zoomThirdAlready = false;

export function animatePage(controls, camera, cellObject, ribbons, spheres, wavingBlob, dotBounds, product, scrollTimeout) {
    let scrollY = window.scrollY;
    let scrollDiff = scrollY - lastScrollY;
    const multiplier = Math.floor(scrollDiff / 20);
    controls.autoRotateSpeed = 1.0 + (multiplier * 10);

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        controls.autoRotateSpeed = 0.2;
    }, 100);

    throttle(() => scrollLogic(controls, camera, cellObject, ribbons, spheres, wavingBlob, dotBounds, product), 60)();
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

function activateText(parentElement, timeout = true) {
    let activeText = parentElement.querySelector('.child');

    if (activeText) {
        if (!activeText.classList.contains('active')) {
            textChildren.forEach(child => {
                if (child !== activeText && child.classList.contains('active')) {
                    child.classList.remove('active');
                }
            });

            if (activeText && !activeText.classList.contains('active')) {
                if (activeTextTimeout) {
                    clearTimeout(activeTextTimeout);
                }

                if (timeout) {
                    activeTextTimeout = setTimeout(() => {
                        activeText.classList.add('active');
                    }, 400);
                } else {
                    activeText.classList.add('active');
                }
            }
        }
    }
}

function ribbonTweenOpacity(ribbons, initOpacity, targetOpacity, duration = (fadeInDuration * 1.4)) {
    ribbonTweenGroup.removeAll();
    if (ribbons && ribbons.children) {
        ribbons.children.forEach(mesh => {
            if (mesh.material) {
                const currentState = { opacity: initOpacity };
                const targetState = { opacity: targetOpacity };

                const ribbonTween = new Tween(currentState)
                    .to(targetState, duration)
                    .easing(Easing.Quadratic.InOut)
                    .onUpdate(() => {
                        mesh.material.opacity = currentState.opacity;
                        mesh.material.needsUpdate = true;
                    })
                    .onComplete(() => {
                        ribbonTweenGroup.remove(ribbonTween);
                    });

                ribbonTweenGroup.add(ribbonTween);
                ribbonTween.start();
            }
        });
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

function dotTweenOpacity(spheres, initialOpacity, targetOpacity, wavingBlob, duration = 300) {
    dotTweenGroup.removeAll();
    spheres.forEach(sphere => {
        const currentState = { opacity: initialOpacity };
        const targetState = { opacity: targetOpacity };

        const sphereTween = new Tween(currentState)
            .to(targetState, duration) // prolonged duration
            .easing(Easing.Quadratic.InOut)
            .onUpdate(() => {
                sphere.material.opacity = currentState.opacity;
                sphere.material.needsUpdate = true;
            })
            .onComplete(() => {
                dotTweenGroup.remove(sphereTween);
            });

        dotTweenGroup.add(sphereTween);
        sphereTween.start();
    });

    if (initialOpacity === 0 && targetOpacity === 1) {
        const initialScale = { scale: 0.96 };
        const targetScale = { scale: 1.0 };

        const scaleTween = new Tween(initialScale)
            .to(targetScale, (duration))
            .easing(Easing.Quadratic.InOut)
            .onUpdate(() => {
                wavingBlob.scale.set(initialScale.scale, initialScale.scale, initialScale.scale);
            })
            .onComplete(() => {
                dotTweenGroup.remove(scaleTween);
            });

        dotTweenGroup.add(scaleTween);
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

const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

const smoothLerp = isMobile
    ? (start, end, progress) => start + (end - start) * progress
    : (start, end, progress) => start + (end - start) * smoothstep(progress);

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