/*

9pm 9/04
written on plane to lisbon
SEND!!!

I tested the new version of the cell progress (where the cell stays zoomed in and instead the cells explode).

It ended up feeling much more flat — staying at the same zoom-level for 3/4 of the page makes it feel less engaging.

I can push this version to the live site, but I think we should keep looking for alternatives. In the meantime, I'm toying with keeping the original zoom-out, but adding a cell explosion at the onset of the "You can now tailor" heading. I think the camera movement does a lot for the story of the page.

*/

function dotsTweenExplosion(spheres, wavingBlob, duration){

    // first scale the opacity over time course
    blobTweenGroup.removeAll(); // this is the smae array as the innerBlob sheen... confirm this is aight
    const initialScale = { scale: 1 };
    const targetScale = { scale: 1.3 };

    const scaleTween = new Tween(initialScale)
        .to(targetScale, (duration))
        .easing(Easing.Quadratic.InOut)
        .onUpdate(() => {
            wavingBlob.scale.set(initialScale.scale, initialScale.scale, initialScale.scale);
        })
        .onComplete(() => {
            blobTweenGroup.remove(scaleTween);
        });

    blobTweenGroup.add(scaleTween); // this will need to be a different group, 
    scaleTween.start();


    // after certain time, start the opacity fade-out of the dots
    setTimeout(() => {
        dotTweenGroup.removeAll();
        const initialOpacity = 1;
        const targetOpacity = 0;

        spheres.forEach(sphere => {
            const currentState = { opacity: initialOpacity }; // need to define these variables somewhere, can I just do it within here?
            const targetState = { opacity: targetOpacity };
    
            const sphereTween = new Tween(currentState)
                .to(targetState, (duration - (duration*0.6))) // adjust as needed, but such that OPACITY and SCALE concurrently
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


// this will go in both zoomOut
function restoreDotScale(wavingBlob){
    wavingBlob.scale.set(1,1,1);
    console.log("reset the wavingBlob scale to (1,1,1)")
}