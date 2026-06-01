import { updateCheckPreview, downloadCheckPDF } from './check-renderer.js';
import { validateAllFields, validateRoutingNumber, validateAccountNumber, validateCheckNumber, validateAmount, validatePayee } from './validation.js';

/**
 * Gather all form field values into a single data object.
 */
function getFormData() {
  return {
    routingNumber: document.getElementById('routing-number').value.trim(),
    accountNumber: document.getElementById('account-number').value.trim(),
    checkNumber: document.getElementById('check-number').value.trim(),
    payee: document.getElementById('payee').value.trim(),
    amount: document.getElementById('amount').value.trim(),
    date: document.getElementById('check-date').value,
    memo: document.getElementById('memo').value.trim(),
    nameAddress: document.getElementById('name-address').value.trim(),
    designTileUrl: window.__designTileUrl || null,
    font: document.getElementById('check-font')?.value || 'inter',
  };
}

/**
 * Show / clear inline validation feedback on a field.
 */
function setFieldError(fieldId, errorMsg) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorMsg) {
    field?.classList.add('field-error');
    if (errorEl) errorEl.textContent = errorMsg;
  } else {
    field?.classList.remove('field-error');
    if (errorEl) errorEl.textContent = '';
  }
}

/**
 * Validate a single field on blur and show feedback.
 */
const fieldValidators = {
  'routing-number': (v) => validateRoutingNumber(v),
  'account-number': (v) => validateAccountNumber(v),
  'check-number': (v) => validateCheckNumber(v),
  'amount': (v) => validateAmount(v),
  'payee': (v) => validatePayee(v),
};

function handleFieldBlur(e) {
  const id = e.target.id;
  const validator = fieldValidators[id];
  if (!validator) return;
  const result = validator(e.target.value.trim());
  setFieldError(id, result.valid ? null : result.error);
}

/**
 * Handle real-time preview updates on any input change.
 */
function handleInputChange() {
  const data = getFormData();
  updateCheckPreview(data);
}

/**
 * Handle design tile file upload.
 */
function handleDesignTileUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      // Center-crop to a square so preview and PDF render identically (no stretch)
      const SIZE = 200;
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      window.__designTileUrl = canvas.toDataURL('image/png');

      // Show thumbnail preview
      const thumb = document.getElementById('tile-thumbnail');
      if (thumb) {
        thumb.src = window.__designTileUrl;
        thumb.style.display = 'block';
      }
      document.getElementById('tile-placeholder')?.classList.add('hidden');

      handleInputChange();
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Handle download button click.
 */
function handleDownload() {
  const data = getFormData();
  const { valid, errors } = validateAllFields(data);

  // Clear previous errors
  Object.keys(fieldValidators).forEach((id) => setFieldError(id, null));

  if (!valid) {
    Object.entries(errors).forEach(([key, msg]) => {
      // Map data keys to field IDs
      const idMap = {
        routingNumber: 'routing-number',
        accountNumber: 'account-number',
        checkNumber: 'check-number',
        payee: 'payee',
        amount: 'amount',
        date: 'check-date',
      };
      setFieldError(idMap[key] || key, msg);
    });

    // Scroll to first error
    const firstError = document.querySelector('.field-error');
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstError?.focus();
    return;
  }

  downloadCheckPDF(data);
}

/**
 * Set up the default date to today.
 */
function setDefaultDate() {
  const dateInput = document.getElementById('check-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

/**
 * Initialize the app.
 */
function init() {
  setDefaultDate();

  // Attach input listeners for live preview
  const formFields = document.querySelectorAll('#check-form input, #check-form textarea, #check-form select');
  formFields.forEach((field) => {
    field.addEventListener('input', handleInputChange);
    field.addEventListener('blur', handleFieldBlur);
  });

  // Design tile upload
  const tileInput = document.getElementById('design-tile');
  tileInput?.addEventListener('change', handleDesignTileUpload);

  // Download button
  const downloadBtn = document.getElementById('download-btn');
  downloadBtn?.addEventListener('click', handleDownload);

  // Remove tile button
  const removeTileBtn = document.getElementById('remove-tile-btn');
  removeTileBtn?.addEventListener('click', () => {
    window.__designTileUrl = null;
    const tileInput = document.getElementById('design-tile');
    if (tileInput) tileInput.value = '';
    const thumb = document.getElementById('tile-thumbnail');
    if (thumb) thumb.style.display = 'none';
    document.getElementById('tile-placeholder')?.classList.remove('hidden');
    handleInputChange();
  });

  // Initial preview render
  handleInputChange();

  // Smooth entrance animation
  document.body.classList.add('loaded');
}

document.addEventListener('DOMContentLoaded', init);
