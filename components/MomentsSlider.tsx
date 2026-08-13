'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

type Moment = {
  image: string;
  caption: string;
};

export function MomentsSlider({ moments }: { moments: Moment[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    // scrollLeft is negative in RTL browsers (Chrome/Firefox), so normalize.
    const scrolled = Math.abs(el.scrollLeft);
    setCanScrollPrev(scrolled < maxScroll - 4);
    setCanScrollNext(scrolled > 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const scrollByCard = (dir: 'prev' | 'next') => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const step = (card?.offsetWidth ?? 220) + 16;
    // In dir="rtl", "next" (forward, toward the right visually) means scrolling
    // toward more-negative scrollLeft in Chrome/Firefox — i.e. a negative delta.
    const delta = dir === 'next' ? -step : step;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="relative mt-10 sm:mt-12">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-paper to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-paper to-transparent sm:w-16" />

      <div
        ref={trackRef}
        className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-2 sm:gap-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {moments.map((m, i) => (
          <Reveal
            key={m.image}
            delay={i * 90}
            className="group shrink-0 snap-start"
          >
            <figure
              data-card
              className="relative aspect-square w-[42vw] overflow-hidden rounded-2xl border border-border shadow-sm sm:w-[220px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.image}
                alt={m.caption}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t from-brand-dark/90 to-transparent p-2 text-[11px] font-medium text-white transition-transform duration-300 group-hover:translate-y-0 sm:text-xs">
                {m.caption}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      {/* controls */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollByCard('prev')}
          disabled={!canScrollPrev}
          aria-label="الصور السابقة"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard('next')}
          disabled={!canScrollNext}
          aria-label="الصور التالية"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
      </div>
    </div>
  );
}
