export const fetchMarketData = async () => {
    const response = await fetch('http://localhost:8000/api/market-data');
    return response.json();
};

export const executeTrade = async (tradeDetails) => {
    const response = await fetch('http://localhost:8000/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeDetails),
    });
    return response.json();
};