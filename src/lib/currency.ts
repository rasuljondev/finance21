"use client";

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  label: string;
}

const CACHE_KEY = "currency_rates";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const CURRENCIES = [
  { from: "USD", to: "UZS", label: "USD/UZS" },
  { from: "EUR", to: "UZS", label: "EUR/UZS" },
  { from: "RUB", to: "UZS", label: "RUB/UZS" },
  { from: "GBP", to: "UZS", label: "GBP/UZS" },
  { from: "CNY", to: "UZS", label: "CNY/UZS" },
];

async function fetchExchangeRate(from: string, to: string): Promise<number> {
  try {
    // Try exchangerate-api.com (free tier, supports multiple currencies)
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const data = await res.json();
    const rate = data.rates?.[to];
    if (rate && typeof rate === "number" && rate > 0) {
      return rate;
    }
  } catch (e) {
    console.warn(`Failed to fetch ${from}/${to} from exchangerate-api:`, e);
  }

  // Fallback defaults (approximate rates as of 2024)
  const defaults: Record<string, number> = {
    "USD/UZS": 12845.0,
    "EUR/UZS": 13900.0,
    "RUB/UZS": 140.0,
    "GBP/UZS": 16200.0,
    "CNY/UZS": 1800.0,
  };

  return defaults[`${from}/${to}`] || 12845.0;
}

export async function getAllCurrencyRates(): Promise<CurrencyRate[]> {
  // Check cache first
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION && Array.isArray(rates)) {
        return rates;
      }
    }
  }

  // Fetch all rates in parallel
  const ratePromises = CURRENCIES.map(async (currency) => {
    const rate = await fetchExchangeRate(currency.from, currency.to);
    return {
      from: currency.from,
      to: currency.to,
      rate,
      label: currency.label,
    };
  });

  const rates = await Promise.all(ratePromises);

  // Cache it
  if (typeof window !== "undefined") {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
  }

  return rates;
}

export async function getUSDToUZSRate(): Promise<number> {
  const rates = await getAllCurrencyRates();
  const usdRate = rates.find((r) => r.from === "USD" && r.to === "UZS");
  return usdRate?.rate || 12845.0;
}

export function formatCurrency(amount: number, currency: "USD" | "UZS" = "UZS"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

