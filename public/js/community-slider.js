// Progressive enhancement: turn multi-image community galleries into a
// swipeable slider with prev/next arrows. Single-image galleries are left
// exactly as-is. No external libraries; original markup is untouched on load
// so the page still works if this script does not run.
(function () {
    function initGallery(gallery) {
        var images = gallery.querySelectorAll('img');
        if (images.length < 2) return; // one image: leave exactly as it is now

        gallery.classList.add('community-entry-gallery--slider');

        var track = document.createElement('div');
        track.className = 'community-slider-track';
        // Move the existing <img> elements into the track (same nodes, same CSS).
        while (gallery.firstChild) {
            track.appendChild(gallery.firstChild);
        }
        gallery.appendChild(track);

        var index = 0;
        var count = images.length;

        function show(i) {
            index = (i + count) % count;
            track.style.transform = 'translateX(-' + (index * 100) + '%)';
        }

        var prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'community-slider-arrow community-slider-prev';
        prev.setAttribute('aria-label', 'Previous image');
        prev.innerHTML = '&#8249;';

        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'community-slider-arrow community-slider-next';
        next.setAttribute('aria-label', 'Next image');
        next.innerHTML = '&#8250;';

        prev.addEventListener('click', function () { show(index - 1); });
        next.addEventListener('click', function () { show(index + 1); });

        gallery.appendChild(prev);
        gallery.appendChild(next);

        // Touch/swipe support for mobile.
        var startX = null;
        gallery.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
        }, { passive: true });
        gallery.addEventListener('touchend', function (e) {
            if (startX === null) return;
            var dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 40) {
                show(dx < 0 ? index + 1 : index - 1);
            }
            startX = null;
        });

        show(0);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var galleries = document.querySelectorAll('.community-entry-gallery');
        galleries.forEach(initGallery);
    });
})();
