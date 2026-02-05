import { useState } from 'react';

const STORAGE_KEY = 'riot_exchange_rate';

export const useExchangeRate = () => {
  const [rate, setRateState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '1500';
  });

  const setRate = (newRate: string) => {
    setRateState(newRate);
    localStorage.setItem(STORAGE_KEY, newRate);
  };

  const fetchLiveRate = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const mockRate = 1520 + Math.floor(Math.random() * 10); 
        setRate(mockRate.toString());
        resolve();
      }, 800);
    });
  };

  return { rate, setRate, fetchLiveRate };
};
