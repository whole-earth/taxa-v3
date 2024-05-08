export function scaleTransformRenderer() {

    const cellThree = document.querySelector('.cell-three');
    const humanThree = document.querySelector('.human-three');

    const transitionSpacer = document.querySelector('.transition-spacer');
    const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];

        if (entry.isIntersecting) {
            window.addEventListener('scroll', transitionScroll);
        }
        else {
            cellThree.style.transform = "scale(1)";
            window.removeEventListener('scroll', transitionScroll);
        }
    });
    observer.observe(transitionSpacer);

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
        } else {
            console.log('Transform complete')
        }

        /*======================================================================*/

        // HUMAN opacity: 0 until progress=0.2, then linear towards progress=1
        humanThree.style.opacity = progression < 0.2 ? 0 : Math.min(1, (progression - 0.2) / 0.8);

        // CELL opacity: 1 until progress=0.3, then linear towards 0 until progress=0.7
        cellThree.style.opacity = progression < 0.3 ? 1 : (progression > 0.7 ? 0 : 1 - ((progression - 0.3) / 0.4));

        /*======================================================================*/

        // SCALE: cell
        const cellScale = 1 - 0.9 * progression;
        cellThree.style.transform = `scale(${Math.max(0.1, Math.min(1, cellScale))})`;

        // SCALE: human
        const humanScaleVal = 8 - 7 * progression;

        // TRANSLATE: human
        let humanOffsetX;
        let humanOffsetY;
        if (window.innerWidth < 996) {
            // mobile
            humanOffsetX = progression < 0.6 ? -16 : (progression <= 1 ? 16 * (progression - 0.6) / 0.4 - 16 : 0);
            humanOffsetY = progression < 0.6 ? -20 : (progression <= 1 ? 20 * (progression - 0.6) / 0.4 - 20 : 0);
        } else {
            // desktop
            humanOffsetX = progression < 0.6 ? -15 : (progression <= 1 ? 15 * (progression - 0.6) / 0.4 - 15 : 0);
            humanOffsetY = progression < 0.6 ? -12 : (progression <= 1 ? 12 * (progression - 0.6) / 0.4 - 12 : 0);
        }

        // TRANSLATE: human sets both scale & translate3d (offset)
        humanThree.style.transform = `scale(${Math.max(1, Math.min(8, humanScaleVal))}) translate3d(${humanOffsetX}vw, ${humanOffsetY}%, 0)`;
    }

}