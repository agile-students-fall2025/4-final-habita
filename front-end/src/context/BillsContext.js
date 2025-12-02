import { createContext, useContext, useEffect, useMemo, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const normalizeBill = (bill) => {
  const id = bill._id || bill.id;
  return {
    id,
    title: bill.title || "Untitled bill",
    amount: Number(bill.amount || 0),
    dueDate: bill.dueDate || new Date().toISOString().slice(0, 10),
    payer: bill.payer || "You",
    splitBetween: Array.isArray(bill.splitBetween) ? bill.splitBetween : ["You"],
    splitType: bill.splitType || "even",
    customSplitAmounts: bill.customSplitAmounts || {},
    paymentDirection: bill.paymentDirection || "none",
    payments: bill.payments || {},
    status: bill.status || "unpaid",
    description: bill.description || "",
  };
};

const BillsContext = createContext(null);

export function BillsProvider({ children }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    return localStorage.getItem("habita:auth:token");
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setBills([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/bills`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch bills");

      const data = await response.json();
      setBills(data.data.map(normalizeBill));
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching bills:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const addBill = async (billData) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/bills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(billData),
      });

      if (!response.ok) throw new Error("Failed to create bill");

      const data = await response.json();
      const newBill = normalizeBill(data.data);
      setBills((prev) => [newBill, ...prev]);
      return newBill;
    } catch (err) {
      setError(err.message);
      console.error("Error adding bill:", err);
      throw err;
    }
  };

  const updateBill = async (id, updates) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/bills/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update bill");

      const data = await response.json();
      const updatedBill = normalizeBill(data.data);
      setBills((prev) => prev.map((b) => (b.id === id ? updatedBill : b)));
      return updatedBill;
    } catch (err) {
      setError(err.message);
      console.error("Error updating bill:", err);
      throw err;
    }
  };

  const updateBillStatus = async (id, newStatus) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/bills/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update bill status");

      const data = await response.json();
      const updatedBill = normalizeBill(data.data);
      setBills((prev) => prev.map((b) => (b.id === id ? updatedBill : b)));
      return updatedBill;
    } catch (err) {
      setError(err.message);
      console.error("Error updating bill status:", err);
      throw err;
    }
  };

  const togglePayment = async (id, person) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/bills/${id}/pay`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ person }),
      });

      if (!response.ok) throw new Error("Failed to toggle payment");

      const data = await response.json();
      const updatedBill = normalizeBill(data.data);
      setBills((prev) => prev.map((b) => (b.id === id ? updatedBill : b)));
      return updatedBill;
    } catch (err) {
      setError(err.message);
      console.error("Error toggling payment:", err);
      throw err;
    }
  };

  const deleteBill = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/bills/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete bill");

      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err.message);
      console.error("Error deleting bill:", err);
      throw err;
    }
  };

  const stats = useMemo(() => {
    const unpaid = bills.filter((b) => b.status === "unpaid").length;
    const total = bills.length;
    const totalAmount = bills.reduce((s, b) => s + Number(b.amount || 0), 0);
    const paid = bills.filter((b) => b.status === "paid").length;
    return { unpaid, total, totalAmount, paid };
  }, [bills]);

  return (
    <BillsContext.Provider
      value={{
        bills,
        addBill,
        updateBill,
        updateBillStatus,
        togglePayment,
        deleteBill,
        stats,
        loading,
        error,
        refetch: fetchBills,
      }}
    >
      {children}
    </BillsContext.Provider>
  );
}

export function useBills() {
  const ctx = useContext(BillsContext);
  if (!ctx) throw new Error("useBills must be used within a BillsProvider");
  return ctx;
}