/**
 * ABA routing number checksum validation.
 * Formula: (3(d1+d4+d7) + 7(d2+d5+d8) + (d3+d6+d9)) mod 10 === 0
 */
export function validateRoutingNumber(routing) {
  if (!/^\d{9}$/.test(routing)) return { valid: false, error: 'Routing number must be exactly 9 digits' };
  const d = routing.split('').map(Number);
  const checksum = (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10;
  if (checksum !== 0) return { valid: false, error: 'Invalid routing number (checksum failed)' };
  return { valid: true, error: null };
}

/**
 * Account number validation — 6 to 17 digits.
 */
export function validateAccountNumber(account) {
  if (!/^\d{6,17}$/.test(account)) return { valid: false, error: 'Account number must be 6–17 digits' };
  return { valid: true, error: null };
}

/**
 * Check number validation — 1 to 6 digits.
 */
export function validateCheckNumber(checkNum) {
  if (!/^\d{1,6}$/.test(checkNum)) return { valid: false, error: 'Check number must be 1–6 digits' };
  return { valid: true, error: null };
}

/**
 * Amount validation — positive number under $1B with up to 2 decimal places.
 */
export function validateAmount(amount) {
  if (!/^\d+(\.\d{0,2})?$/.test(amount)) return { valid: false, error: 'Enter a valid dollar amount (e.g. 1234.56)' };
  const num = parseFloat(amount);
  if (num <= 0) return { valid: false, error: 'Amount must be greater than zero' };
  if (num >= 1000000000) return { valid: false, error: 'Amount is too large' };
  return { valid: true, error: null };
}

/**
 * Payee name validation — non-empty.
 */
export function validatePayee(payee) {
  if (!payee || !payee.trim()) return { valid: false, error: 'Payee name is required' };
  return { valid: true, error: null };
}

/**
 * Validate all check fields. Returns { valid, errors: { fieldName: errorMsg } }
 */
export function validateAllFields(data) {
  const errors = {};
  const routingResult = validateRoutingNumber(data.routingNumber || '');
  if (!routingResult.valid) errors.routingNumber = routingResult.error;

  const accountResult = validateAccountNumber(data.accountNumber || '');
  if (!accountResult.valid) errors.accountNumber = accountResult.error;

  const checkNumResult = validateCheckNumber(data.checkNumber || '');
  if (!checkNumResult.valid) errors.checkNumber = checkNumResult.error;

  const amountResult = validateAmount(data.amount || '');
  if (!amountResult.valid) errors.amount = amountResult.error;

  const payeeResult = validatePayee(data.payee || '');
  if (!payeeResult.valid) errors.payee = payeeResult.error;

  if (!data.date) errors.date = 'Date is required';

  return { valid: Object.keys(errors).length === 0, errors };
}
