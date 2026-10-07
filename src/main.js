import './style.css';
import { initI18n } from './i18n.js';
import { initTour, refreshTour, revealHero } from './tour.js';

initI18n(refreshTour);
const tour = initTour();

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// The 3D city is a separate chunk: text and navigation work even before (or without) it.
if (hasWebGL()) {
  import('./city/index.js')
    .then(m => m.startCity(tour, revealHero))
    .catch(err => {
      console.error(err);
      document.body.classList.add('no-gl');
      revealHero();
    });
} else {
  document.body.classList.add('no-gl');
  revealHero();
}
