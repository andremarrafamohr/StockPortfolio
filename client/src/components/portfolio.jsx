import { useState, useEffect } from "react";
import axios from "axios";
import AddStock from "./addStock";
import { API_BASE_URL } from "../config/api";

export default function Portfolio() {
  const [stocks, setStocks] = useState([]);
  const token = localStorage.getItem("token");

  const fetchPortfolio = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStocks(data.stocks || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  return (
    <div>
      <h2>Portfolio</h2>
      <AddStock onAdd={fetchPortfolio} />
      <ul>
        {stocks.map((s) => (
          <li key={s._id}>
            {s.symbol} - {s.quantity} shares @ ${s.purchasePrice}
          </li>
        ))}
      </ul>
    </div>
  );
}