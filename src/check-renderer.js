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
  setText('preview-address', data.nameAddress?.split('\n').slice(1).join('\n') || 'Your Address');
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

// Check dimensions (inches) — ANSI X9.100-160 personal check.
const CHECK_W = 6;
const CHECK_H = 2.75;

// Colors
const lineColor = [60, 60, 60];
const textColor = [30, 30, 30];
const lightText = [100, 100, 100];

/**
 * Generate a print-ready PDF: front check + endorsement back,
 * stacked and centered on a US Letter (8.5" × 11") portrait sheet.
 * Each check is exactly 6" × 2.75"; crop ticks mark where to cut.
 */
export function generateCheckPDF(data) {
  const pageW = 8.5;
  const pageH = 11;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });

  doc.addFileToVFS('GnuMICR.ttf', gnuMicrBase64);
  doc.addFont('GnuMICR.ttf', 'GnuMICR', 'normal');

  // Map UI font selection to jsPDF built-in font names (Inter has no PDF embed, falls back to helvetica)
  const pdfFont = data.font === 'inter' ? 'helvetica' : 'times';

  // Center the front/back pair on the sheet with a gap between them.
  const gap = 2.5;
  const ox = (pageW - CHECK_W) / 2;
  const topY = (pageH - (CHECK_H * 2 + gap)) / 2;
  const frontY = topY;
  const backY = topY + CHECK_H + gap;

  drawFrontCheck(doc, data, ox, frontY, pdfFont);
  drawCheckBorder(doc, ox, frontY);

  drawBackCheck(doc, ox, backY, pdfFont);
  drawCheckBorder(doc, ox, backY);

  return doc;
}

/**
 * Draw the front of the check at offset (ox, oy) on the page.
 */
function drawFrontCheck(doc, data, ox, oy, pdfFont) {
  const W = CHECK_W;
  const H = CHECK_H;

  doc.setTextColor(...textColor);

  // --- Design tile (top-left) ---
  if (data.designTileUrl) {
    try {
      doc.addImage(data.designTileUrl, 'PNG', ox + 0.2, oy + 0.15, 0.65, 0.65);
    } catch (e) {
      console.warn('Could not embed design tile in PDF:', e);
    }
  }

  // --- Account holder name & address (top-left, beside tile if present) ---
  const nameX = ox + (data.designTileUrl ? 1.0 : 0.2);
  doc.setFontSize(9);
  doc.setFont(pdfFont, 'bold');
  const nameLines = (data.nameAddress || '').split('\n');
  doc.text(nameLines[0] || '', nameX, oy + 0.35);
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(7.5);
  nameLines.slice(1).forEach((line, i) => {
    doc.text(line, nameX, oy + 0.5 + i * 0.15);
  });

  // --- Check number (top-right) ---
  doc.setFontSize(9);
  doc.setFont(pdfFont, 'bold');
  doc.text(data.checkNumber?.padStart(4, '0') || '0001', ox + W - 0.35, oy + 0.35, { align: 'right' });

  // --- Date ---
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...lightText);
  doc.text('DATE', ox + 4.2, oy + 0.55);
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.text(data.date || '', ox + 4.55, oy + 0.55);
  doc.setDrawColor(...lineColor);
  doc.setLineWidth(0.005);
  doc.line(ox + 4.5, oy + 0.58, ox + 5.65, oy + 0.58);

  // --- Pay to the order of ---
  doc.setFontSize(7);
  doc.setTextColor(...lightText);
  doc.text('PAY TO THE', ox + 0.25, oy + 0.85);
  doc.text('ORDER OF', ox + 0.25, oy + 0.97);
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.text(data.payee || '', ox + 0.9, oy + 0.97);
  doc.line(ox + 0.85, oy + 1.0, ox + 4.8, oy + 1.0);

  // --- Amount box ---
  doc.setDrawColor(...lineColor);
  doc.setLineWidth(0.008);
  doc.rect(ox + 5.0, oy + 0.78, 0.75, 0.28);
  doc.setFontSize(11);
  doc.setFont(pdfFont, 'bold');
  const amtText = data.amount ? '$' + parseFloat(data.amount).toFixed(2) : '';
  doc.text(amtText, ox + 5.375, oy + 0.96, { align: 'center' });

  // --- Written amount line ---
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(8.5);
  const wordsText = data.amount ? amountToWords(data.amount) : '';
  doc.text(wordsText, ox + 0.25, oy + 1.25);
  doc.line(ox + 0.25, oy + 1.28, ox + 5.2, oy + 1.28);
  doc.setFontSize(7);
  doc.setTextColor(...lightText);
  doc.text('DOLLARS', ox + 5.25, oy + 1.27);

  // --- Memo line ---
  doc.setTextColor(...lightText);
  doc.setFontSize(7);
  doc.text('MEMO', ox + 0.25, oy + 1.85);
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.text(data.memo || '', ox + 0.65, oy + 1.85);
  doc.setDrawColor(...lineColor);
  doc.line(ox + 0.6, oy + 1.88, ox + 2.8, oy + 1.88);

  // --- Signature line ---
  doc.line(ox + 3.5, oy + 1.88, ox + 5.65, oy + 1.88);
  doc.setFontSize(5.5);
  doc.setTextColor(...lightText);
  doc.text('AUTHORIZED SIGNATURE', ox + 4.575, oy + 1.96, { align: 'center' });

  // --- MICR line ---
  doc.setFont('GnuMICR', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  const micrLine = formatMicrFont(
    data.routingNumber || '000000000',
    data.accountNumber || '000000000',
    data.checkNumber || '0001',
  );
  doc.text(micrLine, ox + 0.5, oy + H - 0.1875); // 3/16" from bottom edge

  // --- Clear band boundary (very faint dashed line for alignment) ---
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.003);
  doc.setLineDashPattern([0.05, 0.05], 0);
  doc.line(ox, oy + H - 0.625, ox + W, oy + H - 0.625);
  doc.setLineDashPattern([], 0);
}

/**
 * Draw the back of the check (endorsement side), replicating a standard
 * bank endorsement back: all text rotated 90° (reads upward).
 * Layout (left→right): ENDORSE HERE + X + 3 sign lines, boundary line,
 * mobile-deposit checkbox, "DO NOT WRITE..." warning, "RESERVED..." line,
 * over a faint "ORIGINAL DOCUMENT" security watermark. No padlock box.
 */
function drawBackCheck(doc, ox, oy, pdfFont) {
  const W = CHECK_W;

  // --- Security pantograph watermark: faint tiled "ORIGINAL DOCUMENT" ---
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(223, 223, 223);
  for (let row = 0; row < 5; row++) {
    const wy = oy + 0.6 + row * 0.5;
    const stagger = (row % 2) * 0.8;
    for (let col = 0; col < 4; col++) {
      const wx = ox + 0.15 + stagger + col * 1.55;
      if (wx > ox + W - 1.0) continue;
      doc.text('ORIGINAL DOCUMENT', wx, wy, { angle: 20 });
    }
  }

  // --- "ENDORSE HERE" (vertical, reads upward) ---
  doc.setTextColor(...textColor);
  doc.setFont(pdfFont, 'bold');
  doc.setFontSize(11);
  doc.text('ENDORSE HERE', ox + 0.35, oy + 2.35, { angle: 90 });

  // "X" marking the signature start
  doc.text('X', ox + 0.78, oy + 2.5, { angle: 90 });

  // Three signature lines (vertical in the rotated frame)
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.006);
  [0.78, 1.08, 1.38].forEach((dx) => doc.line(ox + dx, oy + 0.4, ox + dx, oy + 2.45));

  // --- Boundary line ("...below this line") ---
  doc.setDrawColor(...lineColor);
  doc.setLineWidth(0.012);
  doc.line(ox + 1.7, oy + 0.3, ox + 1.7, oy + 2.5);

  // Mobile-deposit checkbox + label
  doc.setDrawColor(...textColor);
  doc.setLineWidth(0.006);
  doc.rect(ox + 1.92, oy + 2.38, 0.1, 0.1);
  doc.setFont(pdfFont, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...textColor);
  doc.text('CHECK HERE IF MOBILE DEPOSIT', ox + 2.05, oy + 2.32, { angle: 90 });

  // Bold warning (wrapped: "THIS LINE" onto a second column)
  doc.setFontSize(8);
  doc.text('DO NOT WRITE, STAMP OR SIGN BELOW', ox + 2.3, oy + 2.5, { angle: 90 });
  doc.text('THIS LINE', ox + 2.43, oy + 2.5, { angle: 90 });

  // Reserved-for-bank line (smaller)
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...lightText);
  doc.text('RESERVED FOR FINANCIAL INSTITUTION USE', ox + 2.6, oy + 2.5, { angle: 90 });

  // --- MP microprint marks ---
  doc.setFont(pdfFont, 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...textColor);
  doc.text('MP', ox + 0.15, oy + 0.5, { angle: 90 });
  doc.text('MP', ox + 1.78, oy + 0.45, { angle: 90 });
  doc.text('MP', ox + 1.78, oy + 2.55, { angle: 90 });
}

/**
 * Draw a very light border around the check rectangle (photocopy look),
 * giving a clear cut/edge line for front and back.
 */
function drawCheckBorder(doc, ox, oy) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.01);
  doc.setLineDashPattern([], 0);
  doc.rect(ox, oy, CHECK_W, CHECK_H);
}

/**
 * Trigger PDF download.
 */
export function downloadCheckPDF(data) {
  const doc = generateCheckPDF(data);
  const checkNum = (data.checkNumber || '0001').padStart(4, '0');
  doc.save(`check-${checkNum}.pdf`);
}
