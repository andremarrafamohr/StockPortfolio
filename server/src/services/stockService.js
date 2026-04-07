const axios = require("axios");

const API_KEY = process.env.ALPHA_VANTAGE_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

// Fetch current stock price
exports.getStockPrice = async (symbol) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: "GLOBAL_QUOTE",
        symbol,
        apikey: API_KEY
      }
    });

    const data = response.data["Global Quote"];
    if (!data) return null;

    return {
      symbol: data["01. symbol"],
      price: parseFloat(data["05. price"]),
      change: parseFloat(data["09. change"]),
      percentChange: parseFloat(data["10. change percent"])
    };
  } catch (error) {
    console.error("Error fetching stock price:", error.message);
    return null;
  }
};