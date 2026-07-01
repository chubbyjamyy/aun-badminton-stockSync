-- ============================================================
-- Seed: Sample products for each category
-- Run this in the Supabase SQL Editor after creating tables
-- ============================================================

INSERT INTO products (name, category, unit, quantity, min_stock, sell_price, unit_cost, color_name, color_hex) VALUES

-- Racket
('Yonex Astrox 88D Pro',    'Racket', 'piece', 10, 3, 4990, 3200, 'Dark Navy',  '#1a237e'),
('Victor Thruster K 9900',  'Racket', 'piece',  8, 3, 5990, 3800, 'Black Gold', '#212121'),
('Li-Ning Axforce 80',      'Racket', 'piece',  5, 2, 3990, 2600, 'Red',        '#d32f2f'),

-- Shuttlecock
('Yonex Aerosensa 50',      'Shuttlecock', 'tube', 30, 10, 390, 260, NULL, NULL),
('RSL Classic No.1',        'Shuttlecock', 'tube', 20,  8, 290, 190, NULL, NULL),
('Victor Gold',             'Shuttlecock', 'tube', 15,  5, 320, 210, NULL, NULL),

-- Shoes
('Yonex Power Cushion 65Z3','Shoes', 'pair',  6, 2, 4290, 2800, 'White Blue', '#e3f2fd'),
('Victor P9200 III',        'Shoes', 'pair',  4, 2, 3590, 2400, 'Black',      '#212121'),

-- String
('Yonex BG80',              'String', 'roll', 20, 5,  290,  180, 'White', '#ffffff'),
('Yonex Aerobite',          'String', 'roll', 15, 5,  320,  200, 'White Orange', '#ff6d00'),

-- Grip / Overgrip
('Yonex AC102EX Towel Grip','Grip / Overgrip', 'piece', 30, 10, 190, 110, 'White', '#ffffff'),
('Victor GR262 Overgrip',   'Grip / Overgrip', 'pack',  25, 10,  99,  55, 'Assorted', '#9e9e9e'),

-- Bag
('Yonex BA92029EX 9-Racket Bag', 'Bag', 'piece', 5, 2, 2990, 1900, 'Black', '#212121'),
('Victor BR9205 Backpack',       'Bag', 'piece', 4, 2, 1490, 950,  'Blue',  '#1565c0'),

-- Apparel
('Yonex Men Polo Shirt',    'Apparel', 'piece', 20, 5,  790, 450, 'Navy',  '#1a237e'),
('Victor Women T-Shirt',    'Apparel', 'piece', 15, 5,  690, 380, 'White', '#ffffff'),

-- Accessories
('Yonex AC007EX Wristband', 'Accessories', 'pair',  20, 5,  199,  99, 'White', '#ffffff'),
('Victor SP-906 Knee Brace','Accessories', 'piece', 10, 3,  590, 350, 'Black', '#212121');
