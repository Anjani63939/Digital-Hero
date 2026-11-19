import { ZipArchive } from 'archiver';
import PDFDocument from 'pdfkit';
import { Resvg } from '@resvg/resvg-js';

function artworkText(order, rowText) {
  return String(rowText ?? order.artwork?.text ?? order.product_name ?? 'Digital Heroes').slice(0, 100);
}

function printColor(order) {
  return /^#[\da-f]{6}$/i.test(order.artwork?.color ?? '') ? order.artwork.color : '#e95535';
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  })[character]);
}

export async function createArtworkPdf(order, rowText) {
  const width = Number(order.configuration?.width) || 10;
  const height = Number(order.configuration?.height) || 10;
  const bleed = 8.50394;
  const printableWidth = width * 28.3465 - 12;
  const printableHeight = height * 28.3465 - 12;
  const text = artworkText(order, rowText);
  const fontSize = Math.max(5, Math.min(28, printableWidth / Math.max(6, text.length * 0.62), printableHeight * 0.6));
  const doc = new PDFDocument({
    autoFirstPage: false,
    compress: true,
    info: { Title: `${order.order_number} production artwork` },
  });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const completed = new Promise((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
  });
  doc.addPage({ size: [width * 28.3465 + bleed * 2, height * 28.3465 + bleed * 2], margin: 0 });
  doc.rect(bleed, bleed, width * 28.3465, height * 28.3465).lineWidth(0.5).stroke('#d7d4ca');
  doc.fillColor(printColor(order)).fontSize(fontSize).text(text, bleed + 6, bleed + 6, {
    width: printableWidth,
    height: printableHeight,
    align: 'center',
    valign: 'center',
    ellipsis: true,
  });
  doc.end();
  await completed;
  return Buffer.concat(chunks);
}

export function createArtworkPng(order, rowText) {
  const width = Number(order.configuration?.width) || 10;
  const height = Number(order.configuration?.height) || 10;
  const text = escapeXml(artworkText(order, rowText));
  const safeWidth = width * 10 - 6;
  const safeHeight = height * 10 - 6;
  const fontSize = Math.max(2, Math.min(20, safeWidth / Math.max(6, text.length * 0.62), safeHeight * 0.6));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width + 6}cm" height="${height + 6}cm" viewBox="0 0 ${width * 10 + 6} ${height * 10 + 6}"><rect width="100%" height="100%" fill="white"/><rect x="3" y="3" width="${width * 10}" height="${height * 10}" fill="none" stroke="#d7d4ca" stroke-width=".2"/><text x="${width * 5 + 3}" y="${height * 5 + 3}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="${fontSize}" fill="${printColor(order)}">${text}</text><text x="3" y="${height * 10 + 5.2}" font-family="Arial,sans-serif" font-size="1.5" fill="#555">${escapeXml(order.order_number)}</text></svg>`;
  return new Resvg(svg, { fitTo: { mode: 'width', value: Math.round((width + 0.6) / 2.54 * 300) } }).render().asPng();
}

function createZip(files) {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 6 } });
    const chunks = [];
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', reject);
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    for (const file of files) archive.append(file.content, { name: file.name });
    archive.finalize().catch(reject);
  });
}

export async function createProductionArchive(order) {
  const [pdf, png] = await Promise.all([
    createArtworkPdf(order),
    Promise.resolve(createArtworkPng(order)),
  ]);
  return createZip([
    { name: `${order.order_number}_production.pdf`, content: pdf },
    { name: `${order.order_number}_production_300dpi.png`, content: png },
  ]);
}

export async function createVariableDataArchive(order, rows) {
  const files = [];
  for (const [index, row] of rows.entries()) {
    const value = row.text ?? row.name ?? row.number ?? Object.values(row)[0];
    files.push({
      name: `${order.order_number}_row_${String(index + 1).padStart(3, '0')}.pdf`,
      content: await createArtworkPdf(order, value),
    });
  }
  return createZip(files);
}
