/** Scroll-snap slider controls, replacing Webflow's w-slider runtime. */
export function initSlider(doc: Document = document): void {
  for (const root of doc.querySelectorAll<HTMLElement>('[data-slider]')) {
    if (root.dataset.sliderBound) continue;
    root.dataset.sliderBound = 'true';

    const track = root.querySelector<HTMLElement>('[data-slider-track]');
    if (!track) continue;

    const step = (direction: 1 | -1) =>
      track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });

    root.querySelector<HTMLElement>('[data-slider-next]')?.addEventListener('click', () => step(1));
    root.querySelector<HTMLElement>('[data-slider-prev]')?.addEventListener('click', () => step(-1));
  }
}
