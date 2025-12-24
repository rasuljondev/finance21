"use client";

interface ExchangeRateResponse {
  success: boolean;
  rate?: number;
  error?: string;
}

const CACHE_KEY = "usd_uzs_rate";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchExchangeRate(): Promise<number> {
  try {
    // Try multiple free APIs
    const apis = [
      // API 1: exchangerate-api.com (free tier)
      async () => {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await res.json();
        return data.rates?.UZS;
      },
      // API 2: fixer.io alternative
      async () => {
        const res = await fetch("https://api.fixer.io/latest?base=USD&symbols=UZS");
        const data = await res.json();
        return data.rates?.UZS;
      },
      // API 3: currencyapi.net (fallback)
      async () => {
        const res = await fetch("https://api.currencyapi.com/v3/latest?apikey=free&currencies=UZS&base_currency=USD");
        const data = await res.json();
        return data.data?.UZS?.value;
      },
    ];

    for (const api of apis) {
      try {
        const rate = await api();
        if (rate && typeof rate === "number" && rate > 0) {
          return rate;
        }
      } catch (e) {
        // Try next API
        continue;
      }
    }

    throw new Error("All exchange rate APIs failed");
  } catch (error) {
    console.error("Failed to fetch exchange rate:", error);
    // Return a reasonable default (approximate current rate)
    return 12845.0;
  }
}

export async function getUSDToUZSRate(): Promise<number> {
  // Check cache first
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return rate;
      }
    }
  }

  // Fetch fresh rate
  const rate = await fetchExchangeRate();

  // Cache it
  if (typeof window !== "undefined") {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
  }

  return rate;
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

