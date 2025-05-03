import React, { useEffect, useState } from "react";
import NavBar from "../components/Nav2";
import { apiUrl } from "../config/config";
import "../css/Wallet.css";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ type: "deposit", amount: "" });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [balRes, walletRes, stockRes] = await Promise.all([
        fetch(`${apiUrl}/api/wallet/balance`, { credentials: "include" }),
        fetch(`${apiUrl}/api/wallet/transactions`, { credentials: "include" }),
        fetch(`${apiUrl}/api/transactions`, { credentials: "include" }), // stock trades endpoint
      ]);

      const balJson = await balRes.json();
      const walletJson = await walletRes.json();
      const stockJson = await stockRes.json();

      setBalance(balJson.balance || 0);

      // normalize stock transactions: compute amount and type
      const stockTx = (stockJson.transactions || []).map(tx => {
        const isSell = tx.sell_order_id && tx.sell_order_id_user === tx.user_id;
        const amount = (isSell ? 1 : -1) * tx.quantity * parseFloat(tx.price_per_share);
        return {
          transaction_id: tx.transaction_id,
          transaction_type: tx.transaction_type,
          amount: parseFloat(tx.amount),
          created_at: tx.executed_at,
        };
      });

      // wallet txns
      const walletTx = (walletJson.transactions || []).map(tx => ({
        transaction_id: tx.transaction_id,
        transaction_type: tx.transaction_type,
        amount: tx.transaction_type === "deposit" ? parseFloat(tx.amount) : -parseFloat(tx.amount),
        created_at: tx.created_at,
      }));

      // merge & sort desc by date
      const merged = [...walletTx, ...stockTx].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setTransactions(merged);
    } catch (err) {
      console.error("Wallet load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) return alert("Enter a positive amount");
    try {
      const res = await fetch(`${apiUrl}/api/wallet/${form.type}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      if (!res.ok) throw await res.json();
      setForm(f => ({ ...f, amount: "" }));
      await loadData();
    } catch (err) {
      alert(err.message || "Transaction failed");
    }
  };

  if (loading) return <p>Loading wallet…</p>;

  const grouped = transactions.reduce((acc, tx) => {
    const date = new Date(tx.created_at).toLocaleDateString();
    acc[date] = acc[date] || [];
    acc[date].push(tx);
    return acc;
  }, {});

  return (
    <>
      <NavBar />
      <div className="wallet-container">
        <h2>Wallet</h2>
        <p className="wallet-balance">
          <strong>Current Balance:</strong> ₹{Number(balance).toFixed(2)}
        </p>

        <form className="wallet-form" onSubmit={handleSubmit}>
          <label>
            Type:
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
            </select>
          </label>
          <label>
            Amount:
            <input
              type="number"
              name="amount"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit">
            {form.type === "deposit" ? "Deposit" : "Withdraw"}
          </button>
        </form>

        <div className="transactions-section">
          <h3>Transactions</h3>
          {Object.keys(grouped).length === 0 && <p>No transactions yet.</p>}
          {Object.entries(grouped).map(([date, txs]) => (
            <div className="transaction-group" key={date}>
              <h4>{date}</h4>
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Amount (₹)</th>
                    <th>Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let local_balance = 0;
                    return [...txs].reverse().map(tx => {
                      local_balance += tx.amount;
                      const row = (
                        <tr key={tx.transaction_id}>
                          <td>{new Date(tx.created_at).toLocaleTimeString()}</td>
                          <td>{tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1)}</td>
                          <td style={{
                            color: tx.amount >= 0 ? "green" : "red",
                            fontWeight: "bold",
                          }}>
                            {Math.abs(tx.amount).toFixed(2)}
                          </td>
                          <td style={{
                            color: local_balance > 0 ? "green" : "black",
                            fontWeight: "bold",
                          }}>
                            {local_balance.toFixed(2)}
                          </td>
                        </tr>
                      );
                      return row;
                    }).reverse(); // re-reverse to show latest first
                  })()}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
