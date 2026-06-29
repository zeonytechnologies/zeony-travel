import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Car } from '../types';

export function useCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchCars = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAllCars(data as Car[]);
      setCars(data as Car[]);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const search = useCallback((query: string) => {
    let filtered = allCars;
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(car => 
        car.name.toLowerCase().includes(lowerQuery) ||
        car.brand.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (typeFilter) {
      filtered = filtered.filter(car => car.status === typeFilter);
    }

    setCars(filtered);
  }, [allCars, typeFilter]);

  const filterByStatus = useCallback((status: string) => {
    setTypeFilter(status);
    let filtered = allCars;
    
    if (status) {
      filtered = filtered.filter(car => car.status === status);
    }
    
    setCars(filtered);
  }, [allCars]);

  return {
    cars,
    loading,
    search,
    filterByStatus,
    refresh: fetchCars,
    typeFilter
  };
}
