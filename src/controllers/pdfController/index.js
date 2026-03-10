const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { loadSettings } = require('@/middlewares/settings');
const { useMoney, useDate } = require('@/settings');

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const SUPPORTED_MODELS = ['invoice', 'offer', 'quote', 'payment'];

/**
 * Generate a professional PDF using PDFKit (pure Node.js, no PhantomJS required).
 */
exports.generatePdf = async (
  modelName,
  info = { filename: 'pdf_file', format: 'A4', targetLocation: '' },
  result,
  callback
) => {
  const { targetLocation } = info;

  // Ensure the target directory exists
  const dir = path.dirname(targetLocation);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Remove stale file
  if (fs.existsSync(targetLocation)) {
    fs.unlinkSync(targetLocation);
  }

  const modelLower = modelName.toLowerCase();
  if (!SUPPORTED_MODELS.includes(modelLower)) {
    throw new Error(`No PDF template found for model: ${modelName}`);
  }

  // Load app settings for currency / date format
  const settings = await loadSettings();
  const { moneyFormatter } = useMoney({
    settings: {
      currency_symbol:   settings['currency_symbol']   || '$',
      currency_position: settings['currency_position'] || 'before',
      decimal_sep:       settings['decimal_sep']       || '.',
      thousand_sep:      settings['thousand_sep']      || ',',
      cent_precision:    settings['cent_precision']    ?? 2,
      zero_format:       settings['zero_format']       ?? false,
    },
  });
  const { dateFormat } = useDate({
    settings: { idurar_app_date_format: settings['idurar_app_date_format'] || 'DD/MM/YYYY' },
  });

  const companyName  = settings['company_name']    || 'Coffee With Corporates';
  const companyEmail = settings['company_email']   || settings['idurar_app_company_email'] || '';
  const companyPhone = settings['company_phone']   || '';
  const companyAddr  = settings['company_address'] || '';

  // ── Build PDF with PDFKit ───────────────────────────────────────────────────
  let PDFDocument;
  try {
    PDFDocument = require('pdfkit');
  } catch (e) {
    // pdfkit not installed — write a simple text placeholder so download doesn't 500
    fs.writeFileSync(
      targetLocation,
      `PDF generation unavailable.\nRun: npm install pdfkit\n\nDocument: ${modelName} #${result.number || result._id}`,
      'utf-8'
    );
    if (callback) await callback();
    return;
  }

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(targetLocation);
    doc.pipe(stream);
    stream.on('finish', resolve);
    stream.on('error', reject);

    // ── COLOURS & HELPERS ──────────────────────────────────────────────────────
    const BROWN  = '#6F4E37';
    const GOLD   = '#C9853A';
    const DARK   = '#1a1a1a';
    const GREY   = '#666666';
    const LGREY  = '#f5f0eb';
    const WHITE  = '#ffffff';
    const W      = doc.page.width  - 100; // usable width
    const fmt    = (n) => moneyFormatter({ amount: n || 0 });
    const fmtDate = (d) => d ? moment(d).format(dateFormat) : '—';

    // ── HEADER BAND ────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 120).fill(BROWN);

    // Company name
    doc.fontSize(22).fillColor(WHITE).font('Helvetica-Bold')
       .text(companyName, 50, 32, { width: W * 0.6 });

    // Company meta (right side)
    const metaLines = [companyEmail, companyPhone, companyAddr].filter(Boolean);
    doc.fontSize(8).font('Helvetica').fillColor('rgba(255,255,255,0.75)');
    metaLines.forEach((line, i) => doc.text(line, 50, 62 + i * 12, { width: W * 0.6 }));

    // Document type badge (top-right)
    const label = modelLower.toUpperCase();
    doc.fontSize(18).font('Helvetica-Bold').fillColor(GOLD)
       .text(label, 50, 40, { width: W, align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor(WHITE)
       .text(`#${result.number || '—'}`, 50, 65, { width: W, align: 'right' });

    // ── META ROW (date / due / status) ────────────────────────────────────────
    let y = 140;
    const metaBoxes = [
      { label: 'Date',   value: fmtDate(result.date) },
      { label: modelLower === 'invoice' ? 'Due Date' : 'Expiry', value: fmtDate(result.expiredDate || result.dueDate) },
      { label: 'Status', value: (result.status || result.paymentStatus || '—').toUpperCase() },
      { label: 'Currency', value: result.currency || 'USD' },
    ];
    const bw = W / metaBoxes.length;
    metaBoxes.forEach((b, i) => {
      const bx = 50 + i * bw;
      doc.rect(bx, y, bw - 8, 48).fill(LGREY);
      doc.fontSize(8).font('Helvetica').fillColor(GREY).text(b.label, bx + 8, y + 6, { width: bw - 16 });
      doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK).text(b.value, bx + 8, y + 20, { width: bw - 16 });
    });

    // ── CLIENT / BILL-TO ──────────────────────────────────────────────────────
    y += 68;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(GOLD).text('BILL TO', 50, y);
    y += 14;
    const clientName = result.client?.name || result.client || '—';
    doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK).text(clientName, 50, y);
    y += 16;
    const clientFields = [
      result.client?.email,
      result.client?.phone,
      result.client?.address,
    ].filter(Boolean);
    doc.fontSize(9).font('Helvetica').fillColor(GREY);
    clientFields.forEach((f) => { doc.text(f, 50, y); y += 12; });

    // ── ITEMS TABLE ───────────────────────────────────────────────────────────
    y += 16;
    // Table header
    doc.rect(50, y, W, 24).fill(BROWN);
    const cols = [
      { label: 'Item / Description', x: 58,     w: W * 0.42 },
      { label: 'Qty',                x: 58 + W * 0.43, w: W * 0.10, align: 'right' },
      { label: 'Unit Price',         x: 58 + W * 0.54, w: W * 0.20, align: 'right' },
      { label: 'Total',              x: 58 + W * 0.75, w: W * 0.20, align: 'right' },
    ];
    doc.fontSize(9).font('Helvetica-Bold').fillColor(WHITE);
    cols.forEach((c) => doc.text(c.label, c.x, y + 7, { width: c.w, align: c.align || 'left' }));
    y += 24;

    // Table rows
    const items = result.items || [];
    items.forEach((item, idx) => {
      const rowBg = idx % 2 === 0 ? WHITE : LGREY;
      doc.rect(50, y, W, 28).fill(rowBg);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
         .text(item.itemName || item.name || '—', cols[0].x, y + 5, { width: cols[0].w });
      if (item.description) {
        doc.fontSize(7.5).font('Helvetica').fillColor(GREY)
           .text(item.description, cols[0].x, y + 16, { width: cols[0].w });
      }
      doc.fontSize(9).font('Helvetica').fillColor(DARK)
         .text(String(item.quantity || 1), cols[1].x, y + 9, { width: cols[1].w, align: 'right' })
         .text(fmt(item.price),            cols[2].x, y + 9, { width: cols[2].w, align: 'right' })
         .text(fmt(item.total),            cols[3].x, y + 9, { width: cols[3].w, align: 'right' });
      y += 28;
    });

    // ── TOTALS ────────────────────────────────────────────────────────────────
    y += 10;
    const totalsX = 50 + W * 0.55;
    const totalsW = W * 0.45;

    const totals = [
      { label: 'Subtotal',          value: fmt(result.subTotal) },
      result.discount ? { label: 'Discount', value: `- ${fmt(result.discount)}` } : null,
      result.taxRate  ? { label: `Tax (${result.taxRate}%)`, value: fmt(result.taxTotal) } : null,
    ].filter(Boolean);

    totals.forEach((row) => {
      doc.fontSize(9).font('Helvetica').fillColor(GREY)
         .text(row.label, totalsX, y, { width: totalsW * 0.5 });
      doc.font('Helvetica').fillColor(DARK)
         .text(row.value, totalsX, y, { width: totalsW, align: 'right' });
      y += 16;
    });

    // Grand total highlight
    y += 4;
    doc.rect(totalsX - 8, y - 4, totalsW + 8, 30).fill(BROWN);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(WHITE)
       .text('TOTAL', totalsX, y + 6, { width: totalsW * 0.5 })
       .text(fmt(result.total), totalsX, y + 6, { width: totalsW, align: 'right' });
    y += 36;

    // ── NOTES ─────────────────────────────────────────────────────────────────
    if (result.notes) {
      y += 10;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(GOLD).text('NOTES', 50, y);
      y += 14;
      doc.fontSize(9).font('Helvetica').fillColor(GREY).text(result.notes, 50, y, { width: W });
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const pageH = doc.page.height;
    doc.rect(0, pageH - 50, doc.page.width, 50).fill(BROWN);
    doc.fontSize(8).font('Helvetica').fillColor(WHITE)
       .text(`${companyName}  ·  Thank you for your business!`, 50, pageH - 30, {
         width: W, align: 'center',
       });

    doc.end();
  });

  if (callback) await callback();
};
