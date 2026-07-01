export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  price: number;
  cost: number;
  profit: number;
  colorName?: string;
  colorHex?: string;
  createdAt: string;
}

export const CATEGORIES = [
  'Racket',
  'Shuttlecock',
  'Shoes',
  'String',
  'Grip / Overgrip',
  'Bag',
  'Apparel',
  'Accessories',
];

export const UNITS = ['piece', 'pair', 'pack', 'set', 'roll', 'tube', 'box'];
