// testBackend.js
const axios = require("axios");

const API = "http://localhost:5000/api";

async function test() {
  try {
    // Register user
    let res = await axios.post(`${API}/auth/register`, {
      name: "Tester",
      email: "tester@example.com",
      password: "Password123!"
    });
    console.log("Register OK:", res.data);

    const token = res.data.token;

    // Add stock
    res = await axios.post(`${API}/portfolio`, {
      stocks: [{ symbol: "AAPL", quantity: 5, purchasePrice: 150 }]
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log("Add stock OK:", res.data);

    // Get portfolio
    res = await axios.get(`${API}/portfolio`, { headers: { Authorization: `Bearer ${token}` } });
    console.log("Get portfolio OK:", res.data);
  } catch (err) {
    console.error("Test failed:", err.response?.data || err.message);
  }
}

test();