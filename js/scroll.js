import * as THREE from 'three';
import { Tween, Easing } from 'tween';
import { lastScrollY, setLastScrollY, ribbonTweenGroup, dotTweenGroup, blobTweenGroup } from './anim.js';

const splashStartFOV = window.innerWidth < 768 ? 90 : 60;
const splashEndFOV = splashStartFOV * 0.55;
const zoomStartFOV = splashEndFOV;
const zoomEndFOV = splashEndFOV * 1.1;
const zoomOutStartFOV = zoomEndFOV;
const zoomOutEndFOV = splashStartFOV;
const pitchStartFOV = zoomOutEndFOV;
const pitchEndFOV = pitchStartFOV * 1.05;
const productStartFOV = pitchEndFOV;
const productEndFOV = productStartFOV;

const green = new THREE.Color('#92cb86');
const orange = new THREE.Color('#ff8e00');
const yellow = new THREE.Color('#f1ff00');

const fadeInDuration = 500;
const fadeOutDuration = 180;

// ============================

function scrollLogic(controls, camera, cellObject, blobInner, ribbons, spheres, wavingBlob, dotBounds, product) {
    splashBool = isVisibleBetweenTopAndBottom(splashArea);
    zoomBool = isVisibleBetweenTopAndBottom(zoomArea);
    zoomOutBool = isVisibleBetweenTopAndBottom(zoomOutArea);
    pitchBool = isVisibleBetweenTopAndBottom(pitchArea);
    productBool = isVisibleBetweenTopAndBottom(productArea);

    if (splashBool) {
        splashProgress = scrollProgress(splashArea);
        camera.fov = smoothLerp(splashStartFOV, splashEndFOV, splashProgress);

        if (!splashCurrent) {

            activateText(splashArea);

            if (comingFrom == 'zoomAreaFirst') {
                dotTweenOpacity(spheres, 1, 0, wavingBlob, fadeOutDuration);
                ribbonTweenOpacity(ribbons, 0, 1);
                cellSheenTween(blobInner);
            }

            comingFrom = 'splash';
            splashCurrent = true;
            zoomCurrent = false;
            zoomFirstCurrent = false;
        }
    }

    else if (zoomBool) {

        if (!zoomCurrent) {
            activateText(zoomArea);
            splashCurrent = false;
            zoomCurrent = true;
            zoomOutCurrent = false;
            restoreDotScale(wavingBlob); // added 9.23 21:16
        }

        zoomProgress = scrollProgress(zoomArea);
        camera.fov = smoothLerp(zoomStartFOV, zoomEndFOV, zoomProgress);

        if (zoomFirst && zoomSecond && zoomThird) {
            if (zoomProgress >= 0 && zoomProgress < 1 / 3) {
                if (!zoomFirstCurrent) {
                    activateText__ZoomChild(zoomFirst);
                    cellSheenTween(blobInner, orange);

                    if (comingFrom == 'splash') {
                        ribbonTweenOpacity(ribbons, 1, 0);
                        dotTweenOpacity(spheres, 0, 1, wavingBlob, fadeInDuration);
                    } else if (comingFrom == 'zoomAreaSecond') {

                        dotTweenOpacity(spheres, 1, 0, wavingBlob, fadeOutDuration);

                        setTimeout(() => {
                            if (zoomFirstCurrent) {
                                dotUpdateColors(spheres, orange);
                                dotRandomizePositions(spheres, dotBounds);
                                dotTweenOpacity(spheres, 0, 1, wavingBlob, fadeInDuration);
                            }
                        }, fadeOutDuration);

                    }

                    comingFrom = 'zoomAreaFirst';
                    zoomFirstCurrent = true;
                    zoomSecondCurrent = false;
                }
            }
            else if (zoomProgress >= 1 / 3 && zoomProgress < 2 / 3) {
                if (!zoomSecondCurrent) {

                    activateText__ZoomChild(zoomSecond);
                    dotTweenOpacity(spheres, 1, 0, wavingBlob, fadeOutDuration);

                    setTimeout(() => {
                        if (zoomSecondCurrent) {
                            dotUpdateColors(spheres, yellow);
                            dotRandomizePositions(spheres, dotBounds);
                            dotTweenOpacity(spheres, 0, 1, wavingBlob, fadeInDuration);
                            cellSheenTween(blobInner, yellow);
                        }
                    }, fadeOutDuration);
                }

                zoomFirstCurrent = false;
                zoomSecondCurrent = true;
                zoomThirdCurrent = false;
                comingFrom = 'zoomAreaSecond';
            }
            else if (zoomProgress >= 2 / 3 && zoomProgress <= 1) {
                if (!zoomThirdCurrent) {
                    activateText__ZoomChild(zoomThird);

                    if (comingFrom == 'zoomAreaSecond') {
                        dotTweenOpacity(spheres, 1, 0, wavingBlob, fadeOutDuration);
                        setTimeout(() => {
                            if (zoomThirdCurrent) {
                                dotUpdateColors(spheres, green);
                                dotRandomizePositions(spheres, dotBounds);
                                dotTweenOpacity(spheres, 0, 1, wavingBlob, fadeInDuration);
                                cellSheenTween(blobInner, green);
                            }
                        }, fadeOutDuration);
                    } else if (comingFrom == 'zoomOutArea') {
                        dotTweenOpacity(spheres, 0, 1, wavingBlob, fadeInDuration);
                        cellSheenTween(blobInner, green);
                    }

                    zoomSecondCurrent = false;
                    zoomThirdCurrent = true;
                    comingFrom = 'zoomAreaThird';
                }
            }
        }
    }
    else if (zoomOutBool) {
        zoomOutProgress = scrollProgress(zoomOutArea);
        camera.fov = smoothLerp(zoomOutStartFOV, zoomOutEndFOV, zoomOutProgress);

        if (!zoomOutCurrent) {

            textChildren.forEach(child => {
                if (child.classList.contains('active')) {
                    child.classList.remove('active');
                }
            });

            zoomCurrent = false;
            zoomThirdCurrent = false;
            zoomOutCurrent = true;
            pitchCurrent = false;
            comingFrom = 'zoomOutArea';
        }

    }
    else if (pitchBool) {
        pitchProgress = scrollProgress(pitchArea);
        camera.fov = smoothLerp(pitchStartFOV, pitchEndFOV, pitchProgress);

        if (!pitchCurrent) {
            activateText(pitchArea);

            if (comingFrom == 'productArea') {
                controls.autoRotate = true;
                controls.enableRotate = true;
                controls.autoRotateSpeed = 0.2;
                restoreDotScale(wavingBlob);

                if (product) {
                    product.children.forEach(child => {
                        if (child.material) {
                            child.material.opacity = 0;
                            child.material.needsUpdate = true;
                        }
                    });
                }
            } else if (comingFrom == 'zoomOutArea') {
                dotsTweenExplosion(wavingBlob, 400, 100);
            }

            zoomOutCurrent = false;
            pitchCurrent = true;
            productCurrent = false;
            comingFrom = 'pitchArea';

        }
    }
    else if (productBool) {

        if (!productCurrent) {
            controls.autoRotate = false;
            controls.enableRotate = false;
            controls.autoRotateSpeed = 0;
            pitchCurrent = false;
            productCurrent = true;
            productTextActivated = false;
            comingFrom = 'productArea';

            if (comingFrom == 'pitchArea') {
                restoreDotScale(wavingBlob);
                
                // also, increment thru spheres and set opacity to 0
                blobTweenGroup.removeAll();
                dotTweenGroup.removeAll();
                spheres.forEach(sphere => {
                    sphere.material.opacity = 0;
                    sphere.material.needsUpdate = true;
                });

            }
        }

        productProgress = scrollProgress__Last(productArea);

        if (product && product.children) {

            productProgress__0_40 = productProgress <= 0.4 ? productProgress / 0.4 : 1;

            camera.fov = smoothLerp(productStartFOV, productEndFOV, productProgress__0_40);

            const cellScale = smoothLerp(1, 0.1, productProgress__0_40);
            cellObject.scale.set(cellScale, cellScale, cellScale);

            cellObject.children.forEach(child => {
                if (child.name == 'ribbons.glb') {
                    child.traverse(innerChild => {
                        if (innerChild.material) {
                            innerChild.material.opacity = 0;
                            innerChild.material.needsUpdate = true;
                        }
                    });

                } else {
                    child.traverse(innerChild => {
                        if (innerChild.material) {
                            innerChild.material.opacity = 1 - productProgress__0_40;
                            innerChild.material.needsUpdate = true;
                        }
                    });
                }
            });

            // product scale
            const productScale = smoothLerp(7, 3, productProgress);
            product.scale.set(productScale, productScale, productScale);

            // product transform
            if (0 < productProgress && productProgress <= 0.25) {
                product.rotation.x = Math.PI / 2;

                if (productTextActivated) {
                    productArea.querySelectorAll('.child').forEach(child => {
                        if (child.classList.contains('active')) {
                            child.classList.remove('active');
                        }
                    });
                    productTextActivated = false;
                }

            } else if (0.25 < productProgress && productProgress <= 0.8) {

                if (!productTextActivated) {
                    activateText(productArea);
                    productTextActivated = true;
                }

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
        } else (console.log('Render Incomplete: Still awaiting product render!'))
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

let splashCurrent = false;
let zoomCurrent = false;
let zoomOutCurrent = false;
let pitchCurrent = false;
let productCurrent = false;
let productTextActivated = false;

let zoomFirstCurrent = false;
let zoomSecondCurrent = false;
let zoomThirdCurrent = false;

export function animatePage(controls, camera, cellObject, blobInner, ribbons, spheres, wavingBlob, dotBounds, product, scrollTimeout) {
    let scrollY = window.scrollY;
    let scrollDiff = scrollY - lastScrollY;
    const multiplier = Math.floor(scrollDiff / 20);
    controls.autoRotateSpeed = 1.0 + (multiplier * 10);

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        controls.autoRotateSpeed = 0.2;
    }, 100);

    throttle(() => scrollLogic(controls, camera, cellObject, blobInner, ribbons, spheres, wavingBlob, dotBounds, product), 40)();
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

function cellSheenTween(group, color = null) {
    blobTweenGroup.removeAll();
    group.traverse(child => {
        if (child.isMesh && child.material) {
            const initialColor = new THREE.Color(child.material.sheenColor);
            const targetColor = color ? new THREE.Color(color) : new THREE.Color(child.material.color); // if no color param, set sheenColor = color

            const blobTween = new Tween({ r: initialColor.r, g: initialColor.g, b: initialColor.b })
                .to({ r: targetColor.r, g: targetColor.g, b: targetColor.b }, 400)
                .easing(Easing.Quadratic.InOut)
                .onUpdate(({ r, g, b }) => {
                    child.material.sheenColor.setRGB(r, g, b);
                    child.material.needsUpdate = true;
                })
                .onComplete(() => {
                    blobTweenGroup.remove(blobTween);
                });

            blobTweenGroup.add(blobTween);
            blobTween.start();
        }
    });
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
            .to(targetState, duration)
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

//================================================================

function dotsTweenExplosion__Prev(spheres, wavingBlob, duration) {
    blobTweenGroup.removeAll();
    const initial = { scale: 1, opacity: 1 };
    const target = { scale: 1.5, opacity: 0 };

    const scaleTween = new Tween(initial)
        .to({ scale: target.scale }, duration)
        .easing(Easing.Quadratic.InOut)
        .onUpdate(() => {
            wavingBlob.scale.set(initial.scale, initial.scale, initial.scale);
        })
        .onComplete(() => {
            blobTweenGroup.remove(scaleTween);
        });

    blobTweenGroup.add(scaleTween);
    scaleTween.start();

    // after certain time, start the opacity fade-out of the dots
    setTimeout(() => {
        dotTweenGroup.removeAll();

        spheres.forEach(sphere => {
            const currentState = { opacity: initial.opacity };
            const targetState = { opacity: target.opacity };

            const sphereTween = new Tween(currentState)
                .to(targetState, duration * 0.4) // adjust as needed, but such that OPACITY and SCALE concurrently
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

    }, duration * 0.6);
}

function dotsTweenExplosion(wavingBlob, duration, delayBeforeFire) {
    blobTweenGroup.removeAll();
    dotTweenGroup.removeAll();

    const dotGroups = wavingBlob.children.filter(group => group.isGroup);

    dotGroups.forEach((group, index) => {
        const initialScale = { scale: 1 };
        const targetScale = { scale: 1.8 };
        const initialOpacity = { opacity: 1 };
        const targetOpacity = { opacity: 0 };

        setTimeout(() => {
            // Step 1: Scale Animation - Full duration
            const scaleTween = new Tween(initialScale)
                .to(targetScale, duration) // Full duration for scaling
                .easing(Easing.Quadratic.InOut)
                .onUpdate(() => {
                    group.scale.set(initialScale.scale, initialScale.scale, initialScale.scale);
                })
                .onComplete(() => {
                    blobTweenGroup.remove(scaleTween);
                });

            blobTweenGroup.add(scaleTween);
            scaleTween.start();

            // Step 2: Opacity Animation - Start after 75% of the duration, overlap with last 25%
            setTimeout(() => {
                group.children.forEach(sphere => {
                    const sphereTween = new Tween(initialOpacity)
                        .to(targetOpacity, duration * 0.3) // Final 30%
                        .easing(Easing.Quadratic.InOut)
                        .onUpdate(() => {
                            sphere.material.opacity = initialOpacity.opacity;
                            sphere.material.needsUpdate = true;
                        })
                        .onComplete(() => {
                            dotTweenGroup.remove(sphereTween);
                        });

                    dotTweenGroup.add(sphereTween);
                    sphereTween.start();
                });
            }, duration * 0.7); // Start opacity fade after 70% of the scale animation

        }, index * delayBeforeFire); // Stagger each group's animation by delayBeforeFire
    });

    // Cleanup: Remove all tweens after the last group's animation is complete
    setTimeout(() => {
        blobTweenGroup.removeAll();
        dotTweenGroup.removeAll();
    }, (dotGroups.length - 1) * delayBeforeFire + duration); // Total time for the last group to finish
}


function restoreDotScale(wavingBlob) {
    wavingBlob.scale.set(1, 1, 1);

    wavingBlob.children.forEach(group => {
        if (group.isGroup) {
            group.scale.set(1, 1, 1);
        }
    });

    console.log("All scales reset to (1,1,1) for wavingBlob and its dot groups");
}

//================================================================


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