import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "habita:bills";

const defaultBills = [
  {
    id: 1,
    title: "Internet Bill",
    amount: 80.00,
    dueDate: "2025-11-05",
    payer: "Alex",
    splitBetween: ["Alex", "Sam", "Jordan", "You"],
    description: "Monthly internet bill",
    status: "unpaid",
    payments: {
      "Alex": true,
      "Sam": false,
      "Jordan": false,
      "You": false
    },
    createdAt: "2025-10-20"
  },
  {
    id: 2,
    title: "Electricity",
    amount: 120.00,
    dueDate: "2025-11-10",
    payer: "Sam",
    splitBetween: ["Alex", "Sam", "Jordan", "You"],
    description: "October electricity bill",
    status: "paid",
    payments: {
      "Alex": true,
      "Sam": true,
      "Jordan": true,
      "You": true
    },
    createdAt: "2025-10-15"
  }
];

const BillsContext = createContext(null);

export function BillsProvider({ children }) {
  const initializeBillWithPayments = (bill) => {
    if (!bill.payments) {
      bill.payments = {};
      bill.splitBetween.forEach(person => {
        bill.payments[person] = person === bill.payer;
      });
    }
    return bill;
  };

  const [bills, setBills] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initialBills = saved ? JSON.parse(saved) : defaultBills;
    return initialBills.map(initializeBillWithPayments);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
  }, [bills]);

  const addBill = (newBill) => {
    setBills(currentBills => [
      ...currentBills,
      initializeBillWithPayments({
        ...newBill,
        id: Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
        status: "unpaid"
      })
    ]);
  };

  const updateBillStatus = (billId, newStatus) => {
    setBills(currentBills =>
      currentBills.map(bill =>
        bill.id === billId 
          ? {
              ...bill,
              status: newStatus,
              payments: newStatus === "paid"
                ? Object.fromEntries(bill.splitBetween.map(person => [person, true]))
                : Object.fromEntries(bill.splitBetween.map(person => [person, person === bill.payer]))
            }
          : bill
      )
    );
  };

  const togglePayment = (billId, person) => {
    setBills(currentBills =>
      currentBills.map(bill => {
        if (bill.id !== billId) return bill;
        
        const newPayments = { ...bill.payments, [person]: !bill.payments[person] };
        const allPaid = Object.values(newPayments).every(paid => paid);
        
        return {
          ...bill,
          payments: newPayments,
          status: allPaid ? "paid" : "unpaid",
          payer: newPayments[person] ? person : bill.payer // Update payer when someone pays
        };
      })
    );
  };

  const updateBill = (billId, updates) => {
    setBills(currentBills =>
      currentBills.map(bill =>
        bill.id === billId
          ? initializeBillWithPayments({ ...bill, ...updates })
          : bill
      )
    );
  };

  const deleteBill = (billId) => {
    setBills(currentBills => currentBills.filter(bill => bill.id !== billId));
  };

  const stats = useMemo(() => ({
    total: bills.length,
    unpaid: bills.filter(bill => bill.status === "unpaid").length,
    paid: bills.filter(bill => bill.status === "paid").length,
    totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0)
  }), [bills]);

  return (
    <BillsContext.Provider value={{ bills, addBill, updateBill, updateBillStatus, togglePayment, deleteBill, stats }}>
      {children}
    </BillsContext.Provider>
  );
}

export function useBills() {
  const context = useContext(BillsContext);
  if (!context) {
    throw new Error("useBills must be used within a BillsProvider");
  }
  return context;
}