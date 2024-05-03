const cellThree = document.querySelector('.cell-three');
const humanThree = document.querySelector('.human-three');

const transitionSpacer = document.querySelector('.transition-spacer');
const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];

    if (entry.isIntersecting) {
        window.addEventListener('scroll', transitionScroll);
    }
    else {
        window.removeEventListener('scroll', transitionScroll);
    }
});
observer.observe(transitionSpacer);

function transitionScroll() {

    let progression = (window.scrollY + window.innerHeight - transitionSpacer.offsetTop) / (window.innerHeight + transitionSpacer.offsetHeight);
    progression = Math.max(0, Math.min(1, progression));

    // OPACITIES
    // humanThree.style.opacity = Math.min(1, Math.max(0, (progression - 0.4) / 0.6)); // for 40%
    humanThree.style.opacity = progression < 0.25 ? 0 : Math.min(1, (progression - 0.25) / 0.75);
    cellThree.style.opacity = progression < 0.6 ? Math.max(0, 1 - (progression / 0.6)) : 0;

    // SCALE: cell
    const cellScale = 1 - 0.9 * progression;
    cellThree.style.transform = `scale(${Math.max(0.1, Math.min(1, cellScale))})`;

    // POSITIONING
    if (progression < 1) {
        humanThree.style.position = 'fixed';
    } else if ((window.scrollY + window.innerHeight) < (transitionSpacer.offsetTop + window.innerHeight)) {
        humanThree.style.position = 'sticky';
    } else {
        console.log('Transform complete')
    }

/*======================================================================*/



















    // SCALE: human
    const humanScaleVal = 8 - 7 * progression;

    // OFFSET: human
    let humanOffsetVal;
    if (window.innerWidth < 996) {
        humanOffsetVal = progression < 0.6 ? -20 : (progression <= 1 ? 20 * (progression - 0.6) / 0.4 - 20 : 0);
    } else {
        humanOffsetVal = progression < 0.6 ? -10 : (progression <= 1 ? 10 * (progression - 0.6) / 0.4 - 10 : 0);
    }

    // TRANSFORM: human sets both scale & translate3d (offset)
    humanThree.style.transform = `scale(${Math.max(1, Math.min(8, humanScaleVal))}) translate3d(${humanOffsetVal}vw, 0, 0)`;
}