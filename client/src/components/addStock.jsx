import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function AddStock({ onAdd }) {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/portfolio`, {
        symbol,
        quantity: Number(quantity),
        purchasePrice: Number(purchasePrice),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSymbol(""); setQuantity(""); setPurchasePrice("");
      onAdd();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Symbol" value={symbol} onChange={e => setSymbol(e.target.value)} />
      <input placeholder="Quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
      <input placeholder="Purchase Price" type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
      <button type="submit">Add Stock</button>
    </form>
  );
}