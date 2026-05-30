import { formatMicrDisplay, formatMicrFont } from './micr-formatter.js';
import { amountToWords } from './amount-words.js';
import { jsPDF } from 'jspdf';
import { gnuMicrBase64 } from './gnumicr-font.js';

/**
 * Update the live check preview DOM with current form data.
 */
export function updateCheckPreview(data) {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  };

  setText('preview-name', data.nameAddress?.split('\n')[0] || 'Your Name');
  setText('preview-address', data.nameAddress?.split('\n').slice(1).join(', ') || 'Your Address');
  setText('preview-check-number', data.checkNumber ? data.checkNumber.padStart(4, '0') : '0001');
  setText('preview-date', data.date || '__________');
  setText('preview-payee', data.payee || '________________________________________');

  const amountFormatted = data.amount ? parseFloat(data.amount).toFixed(2) : '****.**';
  setText('preview-amount-box', amountFormatted);

  const wordsLine = data.amount ? amountToWords(data.amount) : '________________________________';
  setText('preview-amount-words', wordsLine);

  setText('preview-memo', data.memo || '');

  // Font
  const screenFontMap = {
    inter: "'Inter', sans-serif",
    playfair: "'Playfair Display', serif",
    baskerville: "'Libre Baskerville', serif",
    merriweather: "'Merriweather', serif",
  };
  const checkEl = document.getElementById('check-preview');
  if (checkEl) checkEl.style.fontFamily = screenFontMap[data.font] || screenFontMap.inter;

  // Tile container visibility — hide when no logo so name/address aligns left
  const tileContainer = document.querySelector('.check-design-tile');
  if (tileContainer) tileContainer.style.display = data.designTileUrl ? 'flex' : 'none';

  // MICR line
  const routing = data.routingNumber || '000000000';
  const account = data.accountNumber || '000000000';
  const checkNum = data.checkNumber || '0001';
  setText('preview-micr', formatMicrDisplay(routing, account, checkNum));

  // Design tile
  const tileImg = document.getElementById('preview-design-tile');
  if (tileImg) {
    if (data.designTileUrl) {
      tileImg.src = data.designTileUrl;
      tileImg.style.display = 'block';
    } else {
      tileImg.style.display = 'none';
    }
  }
}

/**
 * Generate a print-ready PDF of the check.
 * Uses jsPDF with exact check dimensions (6" × 2.75").
 */
export function generateCheckPDF(data) {
  const W = 6;    // inches
  const H = 2.75; // inches

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [H, W],
  });

  doc.addFileToVFS('GnuMICR.ttf', gnuMicrBase64);
  doc.addFont('GnuMICR.ttf', 'GnuMICR', 'normal');

  // Map UI font selection to jsPDF built-in font names (Inter has no PDF embed, falls back to helvetica)
  const pdfFont = data.font === 'inter' ? 'helvetica' : 'times';

  // Colors
  const lineColor = [60, 60, 60];
  const textColor = [30, 30, 30];
  const lightText = [100, 100, 100];

  doc.setTextColor(...textColor);

  // --- Design tile (top-left) ---
  if (data.designTileUrl) {
    try {
      doc.addImage(data.designTileUrl, 'PNG', 0.2, 0.15, 0.85, 0.65);
    } catch (e) {
      console.warn('Could not embed design tile in PDF:', e);
    }
  }

  // --- Account holder name & address (top-left, beside tile if present) ---
  const nameX = data.designTileUrl ? 1.2 : 0.2;
  doc.setFontSize(9);
  doc.setFont(pdfFont, 'bold');
  const nameLines = (data.nameAddress || '').split('\n');
  doc.text(nameLines[0] || '', nameX, 0.35);
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(7.5);
  nameLines.slice(1).forEach((line, i) => {
    doc.text(line, nameX, 0.5 + i * 0.15);
  });

  // --- Check number (top-right) ---
  doc.setFontSize(9);
  doc.setFont(pdfFont, 'bold');
  doc.text(data.checkNumber?.padStart(4, '0') || '0001', W - 0.35, 0.35, { align: 'right' });

  // --- Date ---
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...lightText);
  doc.text('DATE', 4.2, 0.55);
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.text(data.date || '', 4.55, 0.55);
  doc.setDrawColor(...lineColor);
  doc.setLineWidth(0.005);
  doc.line(4.5, 0.58, 5.65, 0.58);

  // --- Pay to the order of ---
  doc.setFontSize(7);
  doc.setTextColor(...lightText);
  doc.text('PAY TO THE', 0.25, 0.85);
  doc.text('ORDER OF', 0.25, 0.97);
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.text(data.payee || '', 0.9, 0.97);
  doc.line(0.85, 1.0, 4.8, 1.0);

  // --- Amount box ---
  doc.setDrawColor(...lineColor);
  doc.setLineWidth(0.008);
  doc.rect(5.0, 0.78, 0.75, 0.28);
  doc.setFontSize(11);
  doc.setFont(pdfFont, 'bold');
  const amtText = data.amount ? '$' + parseFloat(data.amount).toFixed(2) : '';
  doc.text(amtText, 5.375, 0.96, { align: 'center' });

  // --- Written amount line ---
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(8.5);
  const wordsText = data.amount ? amountToWords(data.amount) : '';
  doc.text(wordsText, 0.25, 1.25);
  doc.line(0.25, 1.28, 5.2, 1.28);
  doc.setFontSize(7);
  doc.setTextColor(...lightText);
  doc.text('DOLLARS', 5.25, 1.27);

  // --- Memo line ---
  doc.setTextColor(...lightText);
  doc.setFontSize(7);
  doc.text('MEMO', 0.25, 1.85);
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.text(data.memo || '', 0.65, 1.85);
  doc.setDrawColor(...lineColor);
  doc.line(0.6, 1.88, 2.8, 1.88);

  // --- Signature line ---
  doc.line(3.5, 1.88, 5.65, 1.88);
  doc.setFontSize(5.5);
  doc.setTextColor(...lightText);
  doc.text('AUTHORIZED SIGNATURE', 4.575, 1.96, { align: 'center' });

  // --- MICR line ---
  doc.setFont('GnuMICR', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  const micrLine = formatMicrFont(
    data.routingNumber || '000000000',
    data.accountNumber || '000000000',
    data.checkNumber || '0001',
  );
  const micrY = H - 0.1875; // 3/16" from bottom edge
  doc.text(micrLine, 0.5, micrY);

  // --- Clear band boundary (very faint dashed line for alignment) ---
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.003);
  doc.setLineDashPattern([0.05, 0.05], 0);
  doc.line(0, H - 0.625, W, H - 0.625);
  doc.setLineDashPattern([], 0);

  return doc;
}

/**
 * Trigger PDF download.
 */
export function downloadCheckPDF(data) {
  const doc = generateCheckPDF(data);
  const checkNum = (data.checkNumber || '0001').padStart(4, '0');
  doc.save(`check-${checkNum}.pdf`);
}
