import { useState } from 'react';

const STORAGE_KEY = 'riot_exchange_rate';

export const useExchangeRate = () => {
  // 1. Initialize from Storage (so you don't lose the rate on refresh)
  const [rate, setRateState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2. Manual Update Wrapper (to ensure sync with Storage)
  const setRate = (newRate: string) => {
    setRateState(newRate);
    localStorage.setItem(STORAGE_KEY, newRate);
  };

  // 3. The Real API Fetcher
  const fetchLiveRate = async () => {
    setLoading(true);
    setError('');
    
    try {
      // CoinGecko API: Get price of Tether (USDT) in NGN
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=ngn');
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      const p2pRate = data.tether?.ngn;

      if (p2pRate) {
        // Round to whole number (e.g., 1745.8 -> 1746)
        const cleanRate = Math.round(p2pRate).toString();
        setRate(cleanRate); // This updates state AND localStorage
      } else {
        throw new Error('Rate data unavailable');
      }
    } catch (err) {
      console.error("Exchange Rate Error:", err);
      setError('Connection failed. Please enter manually.');
    } finally {
      setLoading(false);
    }
  };

  return { rate, setRate, loading, error, fetchLiveRate };
};
