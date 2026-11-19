export const products = [
  {
    id: 'die-cut-labels',
    division: 'Labels & stickers',
    name: 'Die-cut labels',
    descriptor: 'Small details. Big brand energy.',
    basePrice: 0.24,
    materials: ['Matte vinyl', 'Gloss vinyl', 'Paper'],
    icon: '✳',
    art: 'labels',
    width: 7,
    height: 7,
  },
  {
    id: 'race-numbers',
    division: 'Race & event numbers',
    name: 'Race numbers',
    descriptor: 'Ready for the start line.',
    basePrice: 0.38,
    materials: ['Waterproof synthetic', 'Tyvek'],
    icon: '↗',
    art: 'race',
    width: 15,
    height: 21,
  },
  {
    id: 'mtb-boards',
    division: 'MTB boards',
    name: 'MTB number boards',
    descriptor: 'Made for mud, miles and more.',
    basePrice: 12.5,
    materials: ['White PVC', 'Brushed aluminium'],
    icon: '⌁',
    art: 'mtb',
    width: 24,
    height: 18,
  },
  {
    id: 'custom-stamp',
    division: 'Stamps',
    name: 'Custom stamps',
    descriptor: 'Your mark. Made memorable.',
    basePrice: 18,
    materials: ['Self-inking', 'Wood handle'],
    icon: '▧',
    art: 'stamp',
    width: 4,
    height: 4,
  },
  {
    id: 'acrylic-trophy',
    division: 'Trophies',
    name: 'Acrylic trophies',
    descriptor: 'A little shine for a big moment.',
    basePrice: 32,
    materials: ['Clear acrylic', 'Frosted acrylic'],
    icon: '✧',
    art: 'trophy',
    width: 12,
    height: 18,
  },
  {
    id: 'laser-cut-sign',
    division: 'Laser-cut work',
    name: 'Laser-cut signs',
    descriptor: 'Precision-made, just for your space.',
    basePrice: 25,
    materials: ['Birch plywood', 'Clear acrylic', 'Brushed aluminium'],
    icon: '⟋',
    art: 'laser',
    width: 20,
    height: 12,
  },
];

export function calculatePrice(product, width, height, quantity) {
  const sizeFactor = Math.max(0.65, (Number(width) * Number(height)) / 100);
  const count = Number(quantity);
  const discountRate = count >= 1000 ? 0.2 : count >= 500 ? 0.15 : count >= 100 ? 0.1 : 0;
  const subtotal = product.basePrice * sizeFactor * count;
  const discount = subtotal * discountRate;
  const net = subtotal - discount;
  const tax = net * 0.18;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round((net + tax) * 100) / 100,
    discountRate,
  };
}

export const formatMoney = (value) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
