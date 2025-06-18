/**
 * Test Alpaca API connection directly from frontend
 */
export const testAlpacaConnection = async (apiKey, apiSecret, endpoint) => {
  try {
    const response = await fetch(`${endpoint}/account`, {
      method: 'GET',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Connection successful!',
        data: data
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Connection failed: ${error.message}`
    };
  }
};

/**
 * Test Polygon API connection directly from frontend
 */
export const testPolygonConnection = async (apiKey) => {
  try {
    const response = await fetch(`https://api.polygon.io/v3/reference/tickers?ticker=NFLX&market=stocks&active=true&order=asc&limit=100&sort=ticker&apiKey=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Polygon connection successful!',
        data: data
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Connection failed: ${error.message}`
    };
  }
};