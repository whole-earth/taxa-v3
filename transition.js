export function scaleTransformRenderer() {
    const cellThree = document.querySelector('.cell-three');
    const humanThree = document.querySelector('.human-three');
    const transitionSpacer = document.querySelector('.transition-spacer');

    const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];

        if (entry.isIntersecting) {
            window.addEventListener('scroll', onScroll);
        } else {
            window.removeEventListener('scroll', onScroll);
            if (window.scrollY < transitionSpacer.offsetTop) {
                cellThree.style.transform = 'scale(1)';
            }
        }
    });
    observer.observe(transitionSpacer);

    function onScroll() {
        requestAnimationFrame(transitionScroll);
    }

    function transitionScroll() {
        let progression = (window.scrollY + window.innerHeight - transitionSpacer.offsetTop) / (window.innerHeight + transitionSpacer.offsetHeight);
        progression = Math.max(0, Math.min(1, progression));

        console.log(progression);

        /*======================================================================*/

        // POSITIONING
        if (progression < 1) {
            humanThree.style.position = 'fixed';
        } else if ((window.scrollY + window.innerHeight) < (transitionSpacer.offsetTop + window.innerHeight)) {
            humanThree.style.position = 'sticky';
        }

        /*======================================================================*/

        // HUMAN opacity: 0 until progress=0.1, then linear towards progress=1
        const targetOpacity = progression < 0.1 ? 0 : (progression - 0.1) / 0.9;
        humanThree.style.opacity = Math.min(1, targetOpacity);

        // CELL opacity: 1 until progress=0.3, then linear towards 0 until progress=0.7
        if (progression < 0.3) {
            cellThree.style.opacity = 1;
        } else if (progression > 0.7) {
            cellThree.style.opacity = 0;
        } else {
            cellThree.style.opacity = 1 - ((progression - 0.3) / 0.4);
        }

        /*======================================================================*/

        // SCALE: cell
        const cellScale = 1 - 0.9 * progression;
        cellThree.style.transform = `scale(${Math.max(0.1, cellScale)})`;

        // SCALE: human
        const humanScaleVal = 8 - 7 * progression;

        // TRANSLATE: human
        let humanOffsetX, humanOffsetY;
        if (window.innerWidth < 768) {
            humanOffsetX = progression < 0.6 ? -25 : (25 * (progression - 0.6) / 0.4 - 25);
            humanOffsetY = progression < 0.6 ? -20 : (20 * (progression - 0.6) / 0.4 - 20);
        } else if (window.innerWidth < 996) {
            humanOffsetX = progression < 0.6 ? -16 : (16 * (progression - 0.6) / 0.4 - 16);
            humanOffsetY = progression < 0.6 ? -20 : (20 * (progression - 0.6) / 0.4 - 20);
        } else {
            humanOffsetX = progression < 0.6 ? -15 : (15 * (progression - 0.6) / 0.4 - 15);
            humanOffsetY = progression < 0.6 ? -12 : (12 * (progression - 0.6) / 0.4 - 12);
        }

        humanThree.style.transform = `scale(${Math.max(1, humanScaleVal)}) translate3d(${humanOffsetX}vw, ${humanOffsetY}%, 0)`;
    }

    // Set initial styles
    cellThree.style.transform = 'scale(1)';
    humanThree.style.transform = 'scale(1) translate3d(0, 0, 0)';
    humanThree.style.position = 'fixed';
    humanThree.style.opacity = '0';
}
