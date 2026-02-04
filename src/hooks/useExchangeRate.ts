import { useState, useEffect } from 'react';

const STORAGE_KEY = 'riot_exchange_rate';

export const useExchangeRate = () => {
  const [rate, setRateState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '1500';
  });

  const setRate = (newRate: string) => {
    setRateState(newRate);
    localStorage.setItem(STORAGE_KEY, newRate);
  };

  // Simulation: In a real app, this would fetch from an API
  const fetchLiveRate = async () => {
    // Mocking an API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Simulating a fluctuation
        const mockRate = 1520 + Math.floor(Math.random() * 10); 
        setRate(mockRate.toString());
        resolve();
      }, 800);
    });
  };

  return { rate, setRate, fetchLiveRate };
};
