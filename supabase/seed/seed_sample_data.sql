-- Seed sample data with Zimbabwean names
-- Insert sample customers with Zimbabwean names and phone numbers

INSERT INTO public.customers (branch_id, first_name, last_name, email, phone_number, customer_type, physical_address, created_by)
VALUES
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Tendai', 'Mwanaka', 'tendai.mwanaka@example.com', '+263771234567', 'individual', '45 Samora Machel Ave, Harare', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Nokuthula', 'Dube', 'nokuthula.dube@example.com', '+263787654321', 'individual', '12 First Street, Bulawayo', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Blessing', 'Chakunda', 'blessing.chakunda@example.com', '+263712345678', 'business', '78 Josiah Tongogara, Harare', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Chipo', 'Zinyemba', 'chipo.zinyemba@example.com', '+263773456789', 'individual', '23 Leopold Takawira, Harare', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Tafadzwa', 'Murwisi', 'tafadzwa.murwisi@example.com', '+263789123456', 'individual', '56 Baker Avenue, Bulawayo', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Zainab', 'Masango', 'zainab.masango@example.com', '+263771122334', 'business', '34 Richmond Road, Harare', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Kumbirai', 'Mandaza', 'kumbirai.mandaza@example.com', '+263712223445', 'individual', '89 Nelson Mandela Avenue, Harare', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Rutendo', 'Chisango', 'rutendo.chisango@example.com', '+263774445566', 'individual', '12 Rezende Street, Bulawayo', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Dumisani', 'Ndlovu', 'dumisani.ndlovu@example.com', '+263787776666', 'business', '45 Fifth Avenue, Harare', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Thandiwe', 'Khumalo', 'thandiwe.khumalo@example.com', '+263771888999', 'individual', '67 Speke Avenue, Harare', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Prosper', 'Gwenzi', 'prosper.gwenzi@example.com', '+263789999888', 'individual', '23 Enterprise Road, Harare', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Memory', 'Gumbo', 'memory.gumbo@example.com', '+263712334455', 'business', '11 Market Street, Bulawayo', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Siphiwe', 'Mhlongo', 'siphiwe.mhlongo@example.com', '+263773334455', 'individual', '78 Mahatma Gandhi, Harare', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Takudzwa', 'Nyoni', 'takudzwa.nyoni@example.com', '+263787445566', 'individual', '56 Borrowdale, Harare', (SELECT id FROM profiles LIMIT 1)),
((SELECT id FROM branches WHERE name = 'Headquarters' LIMIT 1), 'Chipo', 'Muchenje', 'chipo.muchenje@example.com', '+263771556677', 'business', '34 Mount Pleasant, Harare', (SELECT id FROM profiles LIMIT 1))
ON CONFLICT DO NOTHING;
