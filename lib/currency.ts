import type { Currency, RegionConfig, CurrencyCode, Region } from '@/types';

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.5, locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, locale: 'en-GB' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36, locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.52, locale: 'en-AU' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67, locale: 'ar-AE' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.5, locale: 'ja-JP' },
};

export const REGIONS: Record<Region, RegionConfig> = {
  IN: { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳', shippingZone: 'domestic', taxRate: 0.18 },
  US: { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸', shippingZone: 'zone1', taxRate: 0.08 },
  EU: { code: 'EU', name: 'Europe', currency: 'EUR', flag: '🇪🇺', shippingZone: 'zone2', taxRate: 0.20 },
  GB: { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', shippingZone: 'zone2', taxRate: 0.20 },
  CA: { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦', shippingZone: 'zone1', taxRate: 0.13 },
  AU: { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺', shippingZone: 'zone2', taxRate: 0.10 },
  AE: { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪', shippingZone: 'zone2', taxRate: 0.05 },
  JP: { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵', shippingZone: 'zone3', taxRate: 0.10 },
  GLOBAL: { code: 'GLOBAL', name: 'Global', currency: 'USD', flag: '🌍', shippingZone: 'zone3', taxRate: 0.0 },
};

export function formatPrice(amountUSD: number, currency: Currency): string {
  const converted = amountUSD * currency.rate;
  const fractionDigits = currency.code === 'JPY' ? 0 : 2;
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(converted);
}

export function convertPrice(amountUSD: number, currency: Currency): number {
  return amountUSD * currency.rate;
}
