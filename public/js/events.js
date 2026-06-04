(function () {
  'use strict';

  // ── Filter tabs ────────────────────────────────────────────
  var filterBtns     = document.querySelectorAll('.filter-tabs__btn');
  var upcomingScroll = document.getElementById('upcomingScroll');
  var upcomingCards  = upcomingScroll
    ? upcomingScroll.querySelectorAll('.event-card')
    : [];

  function applyFilter(filter) {
    var visibleCount = 0;

    upcomingCards.forEach(function (card) {
      var match = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('event-card--hidden', !match);
      if (match) visibleCount++;
    });

    var section  = upcomingScroll ? upcomingScroll.closest('.events-section') : null;
    var emptyMsg = section ? section.querySelector('.events-section__empty') : null;

    if (section) {
      if (visibleCount === 0 && !emptyMsg) {
        var msg = document.createElement('p');
        msg.className = 'events-section__empty';
        msg.textContent = 'No events found for this category.';
        section.appendChild(msg);
      } else if (visibleCount > 0 && emptyMsg) {
        emptyMsg.remove();
      }
    }

    if (upcomingScroll) {
      upcomingScroll.scrollLeft = 0;
      upcomingScroll.dispatchEvent(new Event('scroll'));
    }
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) {
        b.classList.remove('filter-tabs__btn--active');
        b.setAttribute('aria-selected', 'false');
      });
      this.classList.add('filter-tabs__btn--active');
      this.setAttribute('aria-selected', 'true');
      applyFilter(this.dataset.filter);
    });
  });

  // ── Controls row (← progress bar →) below each scroll section
  document.querySelectorAll('.events-section').forEach(function (section) {
    var scrollEl = section.querySelector('.events-scroll');
    if (!scrollEl) return;

    var isPast   = section.classList.contains('events-section--past');
    var cardStep = isPast ? 280 : 380;

    // Left arrow
    var btnPrev = document.createElement('button');
    btnPrev.className = 'events-nav__btn events-nav__btn--prev';
    btnPrev.setAttribute('aria-label', 'Previous');
    btnPrev.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<polyline points="15 18 9 12 15 6"/>' +
      '</svg>';

    // Right arrow
    var btnNext = document.createElement('button');
    btnNext.className = 'events-nav__btn events-nav__btn--next';
    btnNext.setAttribute('aria-label', 'Next');
    btnNext.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<polyline points="9 18 15 12 9 6"/>' +
      '</svg>';

    // Progress bar
    var progressTrack = document.createElement('div');
    progressTrack.className = 'events-progress';
    var progressFill = document.createElement('div');
    progressFill.className = 'events-progress__fill';
    progressTrack.appendChild(progressFill);

    // Controls row: ← [progress bar] →
    var controls = document.createElement('div');
    controls.className = 'events-controls';
    controls.appendChild(btnPrev);
    controls.appendChild(progressTrack);
    controls.appendChild(btnNext);
    scrollEl.insertAdjacentElement('afterend', controls);

    function updateUI() {
      var max     = scrollEl.scrollWidth - scrollEl.clientWidth;
      var pct     = max > 0 ? scrollEl.scrollLeft / max : 0;
      var atStart = scrollEl.scrollLeft <= 1;
      var atEnd   = max <= 0 || scrollEl.scrollLeft >= max - 1;

      progressFill.style.width = (pct * 100) + '%';
      // visibility keeps layout stable; display:none would shift the bar sideways
      btnPrev.style.visibility = atStart ? 'hidden' : 'visible';
      btnNext.style.visibility = atEnd   ? 'hidden' : 'visible';
    }

    scrollEl.addEventListener('scroll', updateUI);

    btnPrev.addEventListener('click', function () {
      scrollEl.scrollBy({ left: -cardStep, behavior: 'smooth' });
    });
    btnNext.addEventListener('click', function () {
      scrollEl.scrollBy({ left: cardStep, behavior: 'smooth' });
    });

    updateUI();
  });

})();
