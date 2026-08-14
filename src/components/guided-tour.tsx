import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { isTourDone, markTourDone, type TourStep } from '@/lib/tours';

interface GuidedTourProps {
  tourId: string;
  userId?: string;
  steps: TourStep[];
  autoStartPath: string;
}

export function GuidedTour({ tourId, userId, steps, autoStartPath }: GuidedTourProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [box, setBox] = useState<DOMRect | null>(null);
  const active = searchParams.get('tour') === tourId;
  const index = Math.min(steps.length - 1, Math.max(0, Number(searchParams.get('paso') || '1') - 1));
  const step = steps[index];

  const write = (tour: string | null, paso?: number) => {
    const next = new URLSearchParams(searchParams);
    if (tour) {
      next.set('tour', tour);
      next.set('paso', String((paso ?? 0) + 1));
    } else {
      next.delete('tour');
      next.delete('paso');
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!userId || isTourDone(tourId, userId)) return;
    if (location.pathname !== autoStartPath) return;
    if (searchParams.get('tour')) return;
    write(tourId, 0);
  }, [userId, tourId, location.pathname, autoStartPath]);

  useEffect(() => {
    if (!active || !step) return;
    if (location.pathname !== step.path) {
      navigate(`${step.path}?tour=${tourId}&paso=${index + 1}`);
    }
  }, [active, step, location.pathname, tourId, index, navigate]);

  const measure = () => {
    if (!active || !step) return;
    const el = document.querySelector(step.selector);
    setBox(el?.getBoundingClientRect() ?? null);
  };

  useLayoutEffect(() => {
    measure();
  }, [active, index, location.pathname, location.search]);

  useEffect(() => {
    if (!active) return;
    const on = () => measure();
    window.addEventListener('resize', on);
    window.addEventListener('scroll', on, true);
    const t = window.setTimeout(measure, 80);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('scroll', on, true);
      window.clearTimeout(t);
    };
  }, [active, index, location.pathname]);

  useEffect(() => {
    if (!active || !box) return;
    const el = document.querySelector(step?.selector);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [active, index]);

  if (!active || !step) return null;

  const finish = () => {
    if (userId) markTourDone(tourId, userId);
    write(null);
  };

  const go = (nextIndex: number) => {
    const next = steps[nextIndex];
    if (!next) {
      finish();
      return;
    }
    if (next.path !== location.pathname) {
      navigate(`${next.path}?tour=${tourId}&paso=${nextIndex + 1}`);
      return;
    }
    write(tourId, nextIndex);
  };

  const pad = 8;
  const highlight = box
    ? {
        top: Math.max(8, box.top - pad),
        left: Math.max(8, box.left - pad),
        width: box.width + pad * 2,
        height: box.height + pad * 2,
      }
    : null;

  const bubbleWidth = Math.min(360, window.innerWidth - 24);
  let bubbleTop = highlight ? highlight.top + highlight.height + 12 : window.innerHeight / 2 - 80;
  let bubbleLeft = highlight ? highlight.left : (window.innerWidth - bubbleWidth) / 2;
  if (highlight && bubbleTop + 220 > window.innerHeight) {
    bubbleTop = Math.max(12, highlight.top - 210);
  }
  bubbleLeft = Math.min(Math.max(12, bubbleLeft), window.innerWidth - bubbleWidth - 12);

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0" />
      {highlight ? (
        <div
          className="pointer-events-none absolute rounded-[18px]"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: '0 0 0 9999px rgba(58, 50, 44, 0.5)',
            outline: '4px solid var(--clay)',
            outlineOffset: '2px',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(58,50,44,0.45)]" />
      )}
      <div
        role="dialog"
        aria-labelledby="tour-title"
        className="absolute z-[81] rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]"
        style={{ top: bubbleTop, left: bubbleLeft, width: bubbleWidth }}
      >
        <p className="text-xs text-[var(--sage)]">
          {index + 1} de {steps.length}
        </p>
        <h2 id="tour-title" className="font-display mt-1 text-xl">
          {step.title}
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{step.body}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button type="button" className="text-sm text-[var(--ink-soft)] underline" onClick={finish}>
            Saltar
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={index === 0} onClick={() => go(index - 1)}>
              Atrás
            </Button>
            <Button onClick={() => go(index + 1)}>{index === steps.length - 1 ? 'Listo' : 'Siguiente'}</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TourReplay({ tourId, label }: { tourId: string; label: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <button
      type="button"
      className="text-sm text-[var(--sage)] underline"
      onClick={() => {
        const next = new URLSearchParams(searchParams);
        next.set('tour', tourId);
        next.set('paso', '1');
        setSearchParams(next);
      }}
    >
      {label}
    </button>
  );
}
