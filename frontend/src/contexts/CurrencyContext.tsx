import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'BDT' | 'USD' | 'EUR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // Against BDT (BDT = 1.0)
}

const DEFAULT_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.00833 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.00781 },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amountInBdt: number | string, overrideCode?: CurrencyCode) => string;
  convertPrice: (amountInBdt: number | string, overrideCode?: CurrencyCode) => number;
  currencies: typeof DEFAULT_CURRENCIES;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'BDT',
  setCurrency: () => {},
  formatPrice: (amt) => `৳ ${Number(amt).toLocaleString()}`,
  convertPrice: (amt) => Number(amt),
  currencies: DEFAULT_CURRENCIES,
  symbol: '৳',
});

export const CurrencyProvider: React.FC<{
  children: React.ReactNode;
  initialRates?: Record<string, number>;
}> = ({ children, initialRates }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('centerpoint_currency') as CurrencyCode;
    return saved && DEFAULT_CURRENCIES[saved] ? saved : 'BDT';
  });

  const [currencies, setCurrencies] = useState(DEFAULT_CURRENCIES);

  useEffect(() => {
    if (initialRates) {
      setCurrencies(prev => ({
        BDT: { ...prev.BDT, rate: initialRates.BDT ?? 1.0 },
        USD: { ...prev.USD, rate: initialRates.USD ?? 0.00833 },
        EUR: { ...prev.EUR, rate: initialRates.EUR ?? 0.00781 },
      }));
    }
  }, [initialRates]);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem('centerpoint_currency', code);
  };

  const convertPrice = (amountInBdt: number | string, overrideCode?: CurrencyCode): number => {
    const num = typeof amountInBdt === 'string' ? parseFloat(amountInBdt) || 0 : amountInBdt;
    const target = overrideCode || currency;
    const rate = currencies[target]?.rate ?? 1.0;
    return num * rate;
  };

  const formatPrice = (amountInBdt: number | string, overrideCode?: CurrencyCode): string => {
    const target = overrideCode || currency;
    const converted = convertPrice(amountInBdt, target);
    const sym = currencies[target]?.symbol ?? '৳';

    if (target === 'BDT') {
      return `${sym} ${Math.round(converted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${sym}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        convertPrice,
        currencies,
        symbol: currencies[currency].symbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

