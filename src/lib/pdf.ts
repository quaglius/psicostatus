import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { FIELD_TYPE } from '@/lib/labels';
import type { FieldType } from '@shared/types';
import type { FieldReport } from '@shared/report';

const C = {
  paper: '#f4efe6',
  surface: '#fff9f1',
  ink: '#3a322c',
  soft: '#7a7068',
  line: '#e4d9cc',
  sage: '#6e8b74',
  sageSoft: '#dde6dc',
  clay: '#c4785a',
  claySoft: '#f0d9cf',
  warn: '#a6844c',
  empty: '#e8dfd4',
};

const PIE = [C.sage, C.clay, C.warn, '#8aa3c7', '#b48bb0', '#7a9e8a'];

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function typeLabel(type: string) {
  return type in FIELD_TYPE ? FIELD_TYPE[type as FieldType].label : type;
}

function barsVertical(points: Array<{ label: string; value: number }>) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return `<div style="display:flex;align-items:flex-end;height:120px;gap:8px;">${points
    .map((p) => {
      const h = Math.max(p.value ? 6 : 0, Math.round((p.value / max) * 100));
      return `<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;">
        <div style="width:100%;height:${h}%;background:${C.sage};border-radius:6px 6px 0 0;"></div>
        <div style="margin-top:6px;font-size:10px;color:${C.soft};text-align:center;line-height:1.2;">${esc(p.label)}</div>
      </div>`;
    })
    .join('')}</div>`;
}

function barsHorizontal(points: Array<{ label: string; value: number }>) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((s, p) => s + p.value, 0) || 1;
  return points
    .map((p) => {
      const w = Math.round((p.value / max) * 100);
      const pct = Math.round((p.value / total) * 100);
      return `<div style="margin:0 0 10px;">
        <div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;margin-bottom:4px;">
          <span>${esc(p.label)}</span>
          <span style="color:${C.soft};">${p.value} · ${pct}%</span>
        </div>
        <div style="height:8px;background:${C.empty};border-radius:99px;overflow:hidden;">
          <div style="width:${w}%;height:100%;background:${C.sage};border-radius:99px;"></div>
        </div>
      </div>`;
    })
    .join('');
}

function lineChart(points: Array<{ label: string; value: number }>) {
  if (points.length < 2) return '';
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 640;
  const h = 88;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const dots = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 8) - 4;
      return `<circle cx="${x}" cy="${y}" r="4" fill="${C.sage}" />`;
    })
    .join('');
  return `<div style="margin-top:12px;">
    <p style="font-family:Georgia,serif;font-size:16px;margin:0 0 4px;">Evolución</p>
    <p style="font-size:12px;color:${C.soft};margin:0 0 8px;">Cada punto es una carga en el tiempo.</p>
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="88" xmlns="http://www.w3.org/2000/svg">
      <polyline fill="none" stroke="${C.clay}" stroke-width="3" points="${pts.join(' ')}" />
      ${dots}
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:${C.soft};">
      <span>${esc(points[0]?.label ?? '')}</span>
      <span>${esc(points[points.length - 1]?.label ?? '')}</span>
    </div>
  </div>`;
}

function pieChart(title: string, slices: Array<{ label: string; value: number }>) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (!total) return '';
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const circles = slices
    .map((slice, i) => {
      const len = (slice.value / total) * c;
      const el = `<circle cx="56" cy="56" r="${r}" fill="none" stroke="${PIE[i % PIE.length]}" stroke-width="16" stroke-dasharray="${len} ${c}" stroke-dashoffset="${-offset}" transform="rotate(-90 56 56)" />`;
      offset += len;
      return el;
    })
    .join('');
  const legend = slices
    .map(
      (s, i) =>
        `<div style="display:flex;align-items:center;gap:8px;margin:0 0 4px;font-size:13px;">
          <span style="width:10px;height:10px;border-radius:99px;background:${PIE[i % PIE.length]};display:inline-block;"></span>
          ${esc(s.label)}: ${s.value}
        </div>`,
    )
    .join('');
  return `<div style="margin-top:12px;">
    <p style="font-family:Georgia,serif;font-size:16px;margin:0 0 4px;">${esc(title)}</p>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:16px;">
      <svg width="112" height="112" viewBox="0 0 112 112" xmlns="http://www.w3.org/2000/svg">${circles}</svg>
      <div>${legend}</div>
    </div>
  </div>`;
}

function reportCard(r: FieldReport) {
  const count = `${r.answerCount} ${r.answerCount === 1 ? 'respuesta' : 'respuestas'}`;
  let body = '';

  if (r.fieldType === 'yes_no') {
    body += `<div style="display:flex;gap:12px;margin:12px 0;">
      <div style="flex:1;background:${C.sageSoft};border-radius:12px;padding:10px 12px;">
        <div style="font-family:Georgia,serif;font-size:28px;">${r.yesCount ?? 0}</div>
        <div style="font-size:13px;color:${C.soft};">Sí</div>
      </div>
      <div style="flex:1;background:${C.claySoft};border-radius:12px;padding:10px 12px;">
        <div style="font-family:Georgia,serif;font-size:28px;">${r.noCount ?? 0}</div>
        <div style="font-size:13px;color:${C.soft};">No</div>
      </div>
    </div>`;
    body += pieChart('Cómo se reparte', r.slices);
  }

  if (r.fieldType === 'select' && r.slices.length) {
    body += `<p style="font-family:Georgia,serif;font-size:16px;margin:12px 0 8px;">Opciones elegidas</p>`;
    body += barsHorizontal([...r.slices].sort((a, b) => b.value - a.value));
  }

  if (r.fieldType === 'faces') {
    body += pieChart('Cómo se distribuyen las caritas', r.slices);
    if (r.slices.length > 1) {
      body += `<p style="font-family:Georgia,serif;font-size:16px;margin:12px 0 8px;">Cantidad por cara</p>`;
      body += barsHorizontal(r.slices);
    }
  }

  if (r.numeric) {
    body += `<div style="display:flex;gap:8px;text-align:center;margin:12px 0;">
      <div style="flex:1;"><div style="font-family:Georgia,serif;font-size:22px;">${r.numeric.avg}</div><div style="font-size:11px;color:${C.soft};">Promedio</div></div>
      <div style="flex:1;"><div style="font-family:Georgia,serif;font-size:22px;">${r.numeric.min}</div><div style="font-size:11px;color:${C.soft};">Mínimo</div></div>
      <div style="flex:1;"><div style="font-family:Georgia,serif;font-size:22px;">${r.numeric.max}</div><div style="font-size:11px;color:${C.soft};">Máximo</div></div>
    </div>`;
  }

  if ((r.fieldType === 'scale' || r.fieldType === 'number') && r.slices.length) {
    body += `<p style="font-family:Georgia,serif;font-size:16px;margin:12px 0 8px;">${
      r.fieldType === 'scale' ? 'Por rangos de puntuación' : 'Cómo se agrupan los números'
    }</p>`;
    body += barsVertical(r.slices);
  }

  if (r.series.length > 1) {
    body += lineChart(
      r.series.map((s) => ({
        label: s.date.slice(5).replace('-', '/'),
        value: s.value,
      })),
    );
  }

  return `<div style="background:${C.surface};border:1px solid ${C.line};border-radius:18px;padding:18px;margin:0 0 16px;">
    <p style="margin:0;font-size:15px;font-weight:700;">${esc(r.fieldLabel)}</p>
    <p style="margin:4px 0 0;font-size:12px;color:${C.soft};">${esc(typeLabel(r.fieldType))} · ${count}</p>
    ${body}
  </div>`;
}

export async function downloadPatientStatusPdf(opts: {
  filename: string;
  patientName: string;
  periodLabel: string;
  templateName?: string | null;
  reports: FieldReport[];
}) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:720px;background:#fff9f1;z-index:-1;pointer-events:none;';
  host.innerHTML = `<div style="width:720px;box-sizing:border-box;padding:24px;background:${C.paper};color:${C.ink};font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.45;">
    <div style="background:${C.surface};border:1px solid ${C.line};border-radius:18px;padding:16px 18px;margin:0 0 16px;">
      <p style="margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${C.sage};">SHANTI</p>
      <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:600;">${esc(opts.patientName)}</p>
      <p style="margin:4px 0 0;font-size:13px;color:${C.soft};">${esc(opts.periodLabel)}${
        opts.templateName ? ` · ${esc(opts.templateName)}` : ''
      }</p>
    </div>
    ${opts.reports.map(reportCard).join('')}
    <p style="margin:8px 0 0;font-size:11px;color:${C.soft};">Complemento de seguimiento. No es historia clínica ni diagnóstico.</p>
  </div>`;
  document.body.appendChild(host);

  try {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const canvas = await html2canvas(host.firstElementChild as HTMLElement, {
      backgroundColor: C.paper,
      scale: 2,
      useCORS: true,
      logging: false,
      width: 720,
      windowWidth: 720,
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const margin = 10;
    const pageW = pdf.internal.pageSize.getWidth() - margin * 2;
    const pageH = pdf.internal.pageSize.getHeight() - margin * 2;
    const pxPerMm = canvas.width / pageW;
    const pageHeightPx = Math.floor(pageH * pxPerMm);

    let y = 0;
    let page = 0;
    while (y < canvas.height) {
      const sliceH = Math.min(pageHeightPx, canvas.height - y);
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext('2d');
      if (!ctx) break;
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (page > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, pageW, sliceH / pxPerMm);
      y += sliceH;
      page += 1;
    }

    pdf.save(opts.filename);
  } finally {
    host.remove();
  }
}
