const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

const SCALES = ['', 'Thousand', 'Million', 'Billion'];

/**
 * Convert a 3-digit group (0–999) to words.
 */
function threeDigitsToWords(n) {
  if (n === 0) return '';
  let result = '';
  if (n >= 100) {
    result += ONES[Math.floor(n / 100)] + ' Hundred';
    n %= 100;
    if (n > 0) result += ' ';
  }
  if (n >= 20) {
    result += TENS[Math.floor(n / 10)];
    const unit = n % 10;
    if (unit > 0) result += '-' + ONES[unit];
  } else if (n > 0) {
    result += ONES[n];
  }
  return result;
}

/**
 * Convert a dollar amount string to its check legal-line representation.
 * Example: "1234.56" → "One Thousand Two Hundred Thirty-Four and 56/100"
 * Example: "0.99"    → "Zero and 99/100"
 * Example: "100"     → "One Hundred and 00/100"
 */
export function amountToWords(amountStr) {
  const parts = amountStr.split('.');
  let dollars = parseInt(parts[0], 10) || 0;
  let cents = parts[1] ? parts[1].padEnd(2, '0').slice(0, 2) : '00';

  if (dollars === 0) return `Zero and ${cents}/100`;

  const groups = [];
  let scaleIndex = 0;
  while (dollars > 0) {
    const group = dollars % 1000;
    if (group > 0) {
      const words = threeDigitsToWords(group);
      const scale = SCALES[scaleIndex];
      groups.unshift(scale ? `${words} ${scale}` : words);
    }
    dollars = Math.floor(dollars / 1000);
    scaleIndex++;
  }

  return `${groups.join(' ')} and ${cents}/100`;
}
