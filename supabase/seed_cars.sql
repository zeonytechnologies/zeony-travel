-- 1. Insert a demo admin user and a regular user
-- Note: password_hash is generated for 'password123' using CryptoJS.SHA256 (e6c3da5b206634d7f3f3586d747ffdbc362259eb4a4d65017edb86419ee8ee49)
INSERT INTO public.car_users (id, email, password_hash, full_name, role)
VALUES 
('d1a3c7f9-813a-4a2e-8c3b-252f9b1e9c20', 'admin@zeony.com', 'e6c3da5b206634d7f3f3586d747ffdbc362259eb4a4d65017edb86419ee8ee49', 'Zeony Admin', 'admin'),
('f9a2b8e7-3c5d-4f1b-9a8c-7b6a5d4e3f2c', 'user@zeony.com', 'e6c3da5b206634d7f3f3586d747ffdbc362259eb4a4d65017edb86419ee8ee49', 'John Doe', 'user')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert 15 Cars
INSERT INTO public.cars (name, brand, description, per_day_cost, extra_km_cost, images, features, status)
VALUES
('Swift Dzire', 'Maruti Suzuki', 'Comfortable 5-seater sedan, perfect for city rides and short highway trips.', 1800, 10, ARRAY['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80'], ARRAY['AC', '5 Seats', 'Manual', 'Petrol'], 'available'),

('Innova Crysta', 'Toyota', 'Spacious 7-seater MUV, ideal for family trips and long journeys.', 3500, 15, ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'], ARRAY['AC', '7 Seats', 'Automatic', 'Diesel'], 'available'),

('Creta', 'Hyundai', 'Premium compact SUV with modern features and smooth handling.', 2500, 12, ARRAY['https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80'], ARRAY['AC', '5 Seats', 'Automatic', 'Petrol'], 'available'),

('Fortuner', 'Toyota', 'Luxury SUV built for tough terrains and grand appearances.', 5500, 20, ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'], ARRAY['AC', '7 Seats', 'Automatic', 'Diesel', '4x4'], 'available'),

('Thar', 'Mahindra', 'Iconic off-roader for the ultimate adventure experience.', 4000, 18, ARRAY['https://images.unsplash.com/photo-1628187848417-646df4d2d473?w=800&q=80'], ARRAY['AC', '4 Seats', 'Manual', 'Diesel', '4x4'], 'available'),

('Baleno', 'Maruti Suzuki', 'Premium hatchback, easy to drive with great mileage.', 1500, 9, ARRAY['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80'], ARRAY['AC', '5 Seats', 'Manual', 'Petrol'], 'available'),

('XUV 700', 'Mahindra', 'Feature-rich SUV with advanced safety tech and comfort.', 4500, 16, ARRAY['https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80'], ARRAY['AC', '7 Seats', 'Automatic', 'Diesel', 'Sunroof'], 'rented'),

('Venue', 'Hyundai', 'Compact SUV suitable for zipping through traffic and weekend getaways.', 2000, 10, ARRAY['https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80'], ARRAY['AC', '5 Seats', 'Manual', 'Petrol'], 'available'),

('Seltos', 'Kia', 'Stylish SUV with premium interiors and excellent performance.', 2600, 12, ARRAY['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80'], ARRAY['AC', '5 Seats', 'Automatic', 'Diesel'], 'available'),

('Scorpio N', 'Mahindra', 'Big daddy of SUVs, commands presence and power.', 4200, 16, ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'], ARRAY['AC', '7 Seats', 'Automatic', 'Diesel'], 'available'),

('Ertiga', 'Maruti Suzuki', 'Economical 7-seater, perfect for large groups on a budget.', 2200, 11, ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'], ARRAY['AC', '7 Seats', 'Manual', 'CNG'], 'available'),

('Harrier', 'Tata', 'Bold and beautiful SUV offering a plush ride quality.', 3200, 14, ARRAY['https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80'], ARRAY['AC', '5 Seats', 'Automatic', 'Diesel'], 'available'),

('i20', 'Hyundai', 'Sporty premium hatchback loaded with features.', 1700, 9, ARRAY['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80'], ARRAY['AC', '5 Seats', 'Manual', 'Petrol'], 'available'),

('City', 'Honda', 'Executive sedan known for its refined engine and comfort.', 2800, 12, ARRAY['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80'], ARRAY['AC', '5 Seats', 'Automatic', 'Petrol'], 'maintenance'),

('Verna', 'Hyundai', 'Futuristic sedan with powerful dynamics and sleek design.', 2900, 12, ARRAY['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80'], ARRAY['AC', '5 Seats', 'Automatic', 'Petrol', 'Ventilated Seats'], 'available');
