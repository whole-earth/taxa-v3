const splash = document.querySelector('.splash');
const dive = document.querySelector('.dive');
const human = document.querySelector('.human');

let isScrolling = false;

window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {

            if (isElementFullyVisible(splash)) {
                console.log('Splash is taking up the full height of the viewport.');
            }
            if (isElementFullyVisible(dive)) {
                console.log('Dive is taking up the full height of the viewport.');
            }
            if (isElementFullyVisible(human)) {
                console.log('Human is taking up the full height of the viewport.');
            }
            isScrolling = false;
        });
        isScrolling = true;
    }
});

function isElementFullyVisible(element) {
    const rect = element.getBoundingClientRect();
    const elementTopRelativeToDocument = rect.top + window.scrollY;
    const elementBottomRelativeToDocument = rect.bottom + window.scrollY;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;

    return scrollY >= elementTopRelativeToDocument &&
        scrollY < elementBottomRelativeToDocument - viewportHeight;
}
