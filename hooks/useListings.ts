import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Listing } from '../types';

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('listings').select('*').eq('is_active', true);

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const search = (query: string) => {
    setSearchQuery(query);
  };

  const filterByType = (type: string) => {
    setTypeFilter(type);
  };

  const refresh = () => {
    fetchListings();
  };

  return { listings, loading, search, filterByType, refresh, typeFilter };
}
