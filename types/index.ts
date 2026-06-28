export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  type: 'hotel' | 'tour' | 'package';
  location: string;
  city: string;
  price_per_night: number;
  images: string[];
  amenities: string[];
  rating: number;
  review_count: number;
  max_guests: number;
  is_active: boolean;
  latitude: number;
  longitude: number;
  created_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  listing_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_id: string | null;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  created_at: string;
  listing?: Listing; // Joined data
};

export type Review = {
  id: string;
  user_id: string;
  listing_id: string;
  booking_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profile?: Profile; // Joined data
};
