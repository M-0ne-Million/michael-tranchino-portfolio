import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function goTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}

// Scroll position -> tour progress (0 = hero, 1 = first district, ...), shared with the 3D camera.
export function initTour() {
  const stops = [...document.querySelectorAll('.stop')];
  const tour = { stops, progTarget: 0, active: -1, listeners: [], onActive(fn) { this.listeners.push(fn); } };

  const rail = document.querySelector('.rail');
  const railBtns = stops.map(sec => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span>${sec.dataset.name}</span><i></i>`;
    b.setAttribute('aria-label', sec.dataset.name);
    b.addEventListener('click', () => goTo(sec.id));
    rail.appendChild(b);
    return b;
  });
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    goTo(a.getAttribute('href').slice(1));
  }));

  let tops = [];
  const measure = () => { tops = stops.map(s => s.offsetTop); };
  ScrollTrigger.addEventListener('refresh', measure);
  measure();
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: s => {
      const y = s.scroll();
      let i = 0;
      while (i < tops.length - 2 && y >= tops[i + 1]) i++;
      tour.progTarget = Math.min(tops.length - 1, i + Math.max(0, Math.min(1, (y - tops[i]) / (tops[i + 1] - tops[i]))));
      const a = Math.round(tour.progTarget);
      if (a !== tour.active) {
        tour.active = a;
        railBtns.forEach((b, k) => b.classList.toggle('on', k === a));
        tour.listeners.forEach(fn => fn(stops[a].id));
      }
    },
  });

  stops.slice(1).forEach(sec => {
    gsap.from(sec.querySelector('.panel'), {
      autoAlpha: 0, y: 48, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: sec, start: 'top 62%', toggleActions: 'play none none reverse' },
    });
  });

  document.querySelectorAll('.hero h1 .line').forEach(line => {
    line.setAttribute('aria-label', line.textContent);
    line.innerHTML = [...line.textContent].map(c => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
  });
  return tour;
}

export function refreshTour() {
  ScrollTrigger.refresh();
}

export function revealHero() {
  document.getElementById('loader').classList.add('done');
  if (reduce) return;
  gsap.from('.hero .ch', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .035, delay: 1.1 });
  gsap.from('.hero .kana', { autoAlpha: 0, y: -24, duration: 1.6, ease: 'expo.out', delay: 1.5 });
  gsap.from('.hero .sub, .hero .ctas, .top, .rail', { autoAlpha: 0, y: 18, duration: 1, ease: 'expo.out', stagger: .08, delay: 1.7 });
}
