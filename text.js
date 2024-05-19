export function textFadeInit() {

    const splash = document.querySelector('.splash');
    const dive = document.querySelector('.dive');
    const human = document.querySelector('.human');

    const splashChild = splash.querySelector('.child');
    const diveChild = dive.querySelector('.child');
    const humanChild = human.querySelector('.child');

    let isScrolling = false;

    window.addEventListener('scroll', () => {

        // toggle scroll_top -> Combine with 
        checkAndToggleScrollTop();

        // toggle text visibilities
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                handleElementVisibility(splash, splashChild);
                handleElementVisibility(dive, diveChild);
                handleElementVisibility(human, humanChild);
                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    function handleElementVisibility(parent, child) {
        if (isElementFullyVisible(parent)) {
            child.style.opacity = 1;
        } else {
            child.style.opacity = 0;
        }
    }

    function isElementFullyVisible(element) {
        const rect = element.getBoundingClientRect();
        const elementTopRelativeToDocument = rect.top + window.scrollY;
        const elementBottomRelativeToDocument = rect.bottom + window.scrollY;
        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY;

        return scrollY >= elementTopRelativeToDocument &&
            scrollY < elementBottomRelativeToDocument - viewportHeight;
    }

    function checkAndToggleScrollTop() {
        if (window.scrollY < 140) {
            splashChild.classList.add('scroll_top');
        } else if (window.scrollY >= 140) {
            splashChild.classList.remove('scroll_top');
        }
    }

    //==========

    // Check if .announcement element exists
    // Define variables outside the event listener function
    const announcementElement = document.querySelector('.announcement');
    const splashChildElement = document.querySelector('.splash-child');
    let announcementHeight;
    let announcementOffsetTop;

    // Check if .announcement element exists
    if (announcementElement && splashChildElement) {
        announcementHeight = announcementElement.offsetHeight;
        announcementOffsetTop = announcementElement.offsetTop;

        // Add window scroll event listener
        window.addEventListener('scroll', textOffsetAnnouncement);
    }

    function textOffsetAnnouncement() {
        // Get current scroll position
        const scrollTop = window.scrollY;

        // Calculate the percentage of .announcement scrolled
        let percentageScrolled;

        if (scrollTop <= announcementOffsetTop) {
            percentageScrolled = 0;
        } else if (scrollTop >= announcementOffsetTop + announcementHeight) {
            percentageScrolled = 1;
        } else {
            percentageScrolled = (scrollTop - announcementOffsetTop) / announcementHeight;
        }

        // Calculate the value of top property for splash-child
        const topValue = (1 - percentageScrolled) * 8 + percentageScrolled * 5;

        // Update the top property of splash-child
        splashChildElement.style.top = topValue + 'rem';
    }
}