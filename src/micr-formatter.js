/**
 * MICR E-13B special symbol characters.
 *
 * Most MICR fonts map special symbols to these ASCII characters:
 *   Transit (⑆) → 'A'   — brackets routing number
 *   Amount  (⑇) → 'B'   — brackets amount (bank use only)
 *   On-Us   (⑈) → 'C'   — delimits account/check number
 *   Dash    (⑉) → 'D'   — separator within fields
 *
 * For screen display (non-MICR font), we use Unicode symbols.
 */

export const MICR_SYMBOLS = {
  transit: { font: 'A', display: '⑆' },
  amount:  { font: 'B', display: '⑇' },
  onUs:    { font: 'C', display: '⑈' },
  dash:    { font: 'D', display: '⑉' },
};

/**
 * Format a MICR line for a personal check.
 *
 * Standard personal check format (left to right):
 *   ⑆RRRRRRRRR⑆  AAAAAAAAAA⑈  CCCC
 *
 * Where:
 *   R = Routing number (9 digits)
 *   A = Account number (variable length)
 *   C = Check number (zero-padded to 4 digits)
 *
 * @param {string} routingNumber - 9-digit ABA routing number
 * @param {string} accountNumber - Account number (digits only)
 * @param {string} checkNumber   - Check number (digits only)
 * @param {'font'|'display'} mode - 'font' for MICR font chars, 'display' for Unicode symbols
 * @returns {string} Formatted MICR line
 */
export function formatMicrLine(routingNumber, accountNumber, checkNumber, mode = 'display') {
  const sym = (name) => MICR_SYMBOLS[name][mode];
  const padCheck = checkNumber.padStart(4, '0');

  return `${sym('transit')}${routingNumber}${sym('transit')}  ${accountNumber}${sym('onUs')}  ${padCheck}`;
}

/**
 * Format the MICR line for display in the check preview (using Unicode symbols).
 */
export function formatMicrDisplay(routingNumber, accountNumber, checkNumber) {
  return formatMicrLine(routingNumber, accountNumber, checkNumber, 'display');
}

/**
 * Format the MICR line for rendering with a MICR E-13B font.
 */
export function formatMicrFont(routingNumber, accountNumber, checkNumber) {
  return formatMicrLine(routingNumber, accountNumber, checkNumber, 'font');
}
