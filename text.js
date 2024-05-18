export function textIntersectionFade() {

    document.addEventListener('scroll', () => {
        textScrollTop();
        textOpacityObserver();
    });

    function textScrollTop() {
        const scrollThreshold = window.innerHeight * 0.2;
        const firstChild = document.querySelectorAll('.child')[0];

        if (window.scrollY <= scrollThreshold) {
            if (firstChild) {
                // class "scrollTop" defined in WF
                firstChild.classList.add('scrollTop');
            }
        }
        else {
            if (firstChild) {
                firstChild.classList.remove('scrollTop');
            }
        }
    }

    function textOpacityObserver() {
        const childElms = document.querySelectorAll('.child');

        const handleIntersection = (entries) => {
            entries.forEach((entry) => {
                const isVisible = entry.intersectionRatio >= 1;
                entry.target.style.opacity = isVisible ? '1' : '0';
            });
        };

        const observer = new IntersectionObserver(handleIntersection, {
            threshold: 1
        });

        childElms.forEach((childElm) => {
            observer.observe(childElm);
        });
    }
}