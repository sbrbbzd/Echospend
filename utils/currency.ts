// Currency formatting utilities

export interface CurrencyInfo {
    code: string;
    name: string;
    symbol?: string;
    icon?: string;
}

/**
 * Get currency info by code from a list of currencies
 */
export function getCurrencyInfo(code: string, currencies: CurrencyInfo[] = []): CurrencyInfo {
    const currency = currencies.find(c => c.code === code);
    return currency || { code, name: code, symbol: code };
}

/**
 * Get currency symbol by code from a list of currencies
 */
export function getCurrencySymbol(code: string, currencies: CurrencyInfo[] = []): string {
    const currency = currencies.find(c => c.code === code);
    return currency?.symbol || '$';
}

/**
 * Format a number as currency using dynamic currency data
 * @param amount - The amount to format
 * @param currencyCode - The currency code (e.g., 'USD', 'EUR')
 * @param currencies - The list of supported currencies from the DB
 * @param options - Formatting options
 */
export function formatCurrency(
    amount: number,
    currencyCode: string,
    currencies: CurrencyInfo[] = [],
    options: {
        showSign?: boolean;     // Show + or - before amount
        showCode?: boolean;     // Show currency code instead of symbol
        decimals?: number;      // Number of decimal places (default 2)
    } = {}
): string {
    const { showSign = false, showCode = false, decimals = 2 } = options;

    const symbol = showCode ? currencyCode : getCurrencySymbol(currencyCode, currencies);
    const absAmount = Math.abs(amount).toFixed(decimals);

    // Determine sign prefix
    let signPrefix = '';
    if (showSign) {
        signPrefix = amount >= 0 ? '+' : '-';
    } else if (amount < 0) {
        signPrefix = '-';
    }

    // Some currencies have symbol after the number
    const symbolAfterCurrencies = ['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON'];

    if (symbolAfterCurrencies.includes(currencyCode)) {
        return `${signPrefix}${absAmount} ${symbol}`;
    }

    return `${signPrefix}${symbol}${absAmount}`;
}

/**
 * Format currency for display (compact version for large numbers)
 */
export function formatCurrencyCompact(
    amount: number,
    currencyCode: string,
    currencies: CurrencyInfo[] = []
): string {
    const symbol = getCurrencySymbol(currencyCode, currencies);
    const absAmount = Math.abs(amount);

    let formatted: string;
    if (absAmount >= 1000000) {
        formatted = (absAmount / 1000000).toFixed(1) + 'M';
    } else if (absAmount >= 1000) {
        formatted = (absAmount / 1000).toFixed(1) + 'K';
    } else {
        formatted = absAmount.toFixed(2);
    }

    const sign = amount < 0 ? '-' : '';
    return `${sign}${symbol}${formatted}`;
}
