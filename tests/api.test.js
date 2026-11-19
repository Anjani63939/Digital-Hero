import assert from 'node:assert/strict';
import { test } from 'node:test';
import handler from '../api/index.js';
import { createArtworkPdf, createArtworkPng, createProductionArchive, createVariableDataArchive } from '../server/production-files.js';

async function request(method, url, body) {
  const response = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.payload = value;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  await handler({ method, url, headers: {}, body }, response);
  return response;
}

test('pricing applies the 100-unit discount and GST to the discounted subtotal', async () => {
  const response = await request('POST', '/api/pricing', {
    productId: 'die-cut-labels',
    width: 10,
    height: 10,
    quantity: 100,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.subtotal, 24);
  assert.equal(response.payload.discount, 2.4);
  assert.equal(response.payload.tax, 3.89);
  assert.equal(response.payload.total, 25.49);
  assert.equal(response.payload.discountRate, 0.1);
});

test('pricing rejects an invalid product and quantities outside the supported range', async () => {
  const invalidProduct = await request('POST', '/api/pricing', {
    productId: 'not-a-product',
    width: 10,
    height: 10,
    quantity: 100,
  });
  const invalidQuantity = await request('POST', '/api/pricing', {
    productId: 'die-cut-labels',
    width: 10,
    height: 10,
    quantity: 10001,
  });
  const fractionalQuantity = await request('POST', '/api/pricing', {
    productId: 'die-cut-labels',
    width: 10,
    height: 10,
    quantity: 1.5,
  });
  const invalidMaterial = await request('POST', '/api/pricing', {
    productId: 'die-cut-labels',
    width: 10,
    height: 10,
    quantity: 100,
    material: 'unlisted material',
  });

  assert.equal(invalidProduct.statusCode, 400);
  assert.match(invalidProduct.payload.error, /valid product/i);
  assert.equal(invalidQuantity.statusCode, 400);
  assert.match(invalidQuantity.payload.error, /quantity/i);
  assert.equal(fractionalQuantity.statusCode, 400);
  assert.equal(invalidMaterial.statusCode, 400);
  assert.match(invalidMaterial.payload.error, /material/i);
});

test('pricing applies the higher quantity break at 1,000 pieces', async () => {
  const response = await request('POST', '/api/pricing', {
    productId: 'die-cut-labels',
    width: 10,
    height: 10,
    quantity: 1000,
    material: 'Matte vinyl',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.discountRate, 0.2);
  assert.equal(response.payload.discount, 48);
  assert.equal(response.payload.total, 226.56);
});

test('health endpoint clearly reports whether persistent integrations are configured', async () => {
  const response = await request('GET', '/api');

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.ok, true);
  assert.equal(response.payload.databaseConfigured, false);
  assert.equal(response.payload.divisions.length, 6);
});

test('Vercel path rewrites still reach the requested Node API route', async () => {
  const response = await request('GET', '/api?route=products');

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.products.length, 6);
});

test('production output contains a valid vector PDF and 300-DPI PNG for the configured print area', async () => {
  const order = {
    order_number: 'DH-TEST-01',
    product_id: 'race-numbers',
    product_name: 'Race numbers',
    configuration: { width: 10, height: 15 },
    artwork: { text: '<Proof & print>', color: '#315849' },
  };
  const [pdf, png, archive] = await Promise.all([
    createArtworkPdf(order),
    Promise.resolve(createArtworkPng(order)),
    createProductionArchive(order),
  ]);

  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(archive.subarray(0, 4).toString('hex'), '504b0304');
  assert.ok(archive.includes(Buffer.from('DH-TEST-01_production.pdf')));
  assert.ok(archive.includes(Buffer.from('DH-TEST-01_production_300dpi.png')));
});

test('variable-data output creates one PDF file per CSV row', async () => {
  const order = {
    order_number: 'DH-TEST-02',
    product_name: 'Race numbers',
    configuration: { width: 10, height: 15 },
    artwork: { color: '#e95535' },
  };
  const archive = await createVariableDataArchive(order, [{ number: '101' }, { number: '102' }]);

  assert.equal(archive.subarray(0, 4).toString('hex'), '504b0304');
  assert.ok(archive.includes(Buffer.from('DH-TEST-02_row_001.pdf')));
  assert.ok(archive.includes(Buffer.from('DH-TEST-02_row_002.pdf')));
});
