import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function downloadNodeAsPdf(node: HTMLElement, filename: string) {
  const canvas = await html2canvas(node, {
    backgroundColor: '#fff9f1',
    scale: 2,
    useCORS: true,
    logging: false,
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
    ctx.fillStyle = '#fff9f1';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    if (page > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, pageW, sliceH / pxPerMm);
    y += sliceH;
    page += 1;
  }

  pdf.save(filename);
}
