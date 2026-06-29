export type CarUser = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
};

export type Car = {
  id: string;
  name: string;
  brand: string;
  description: string;
  per_day_cost: number;
  extra_km_cost: number;
  images: string[];
  features: string[];
  status: 'available' | 'maintenance' | 'rented';
  created_at: string;
};

export type CarBooking = {
  id: string;
  user_id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  expected_kms: number;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  created_at: string;
  
  // Joined data
  car?: Car;
  user?: CarUser;
};

export type CarNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};
