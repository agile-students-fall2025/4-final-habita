import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "habita:bills";

const defaultBills = [
	{ id: 1, title: "Electricity", amount: 62.45, due: "2025-11-20", paid: false },
	{ id: 2, title: "Internet", amount: 39.99, due: "2025-11-15", paid: false },
	{ id: 3, title: "Water", amount: 18.3, due: "2025-11-30", paid: true },
];

const normalizeBill = (bill, fallbackId) => {
	const id = bill.id ?? fallbackId ?? Date.now();
	const amount = Number(bill.amount ?? 0);
	const splitBetween = Array.isArray(bill.splitBetween) && bill.splitBetween.length ? bill.splitBetween : ["You"];
	const splitType = bill.splitType || "even";
	const paymentDirection = bill.paymentDirection || "none";
	const payments = bill.payments && typeof bill.payments === "object" ? bill.payments : {};
	const status = bill.status || (bill.paid ? "paid" : "unpaid");

	return {
		id,
		title: bill.title ?? "Untitled bill",
		amount,
		due: bill.due ?? new Date().toISOString().slice(0, 10),
		paid: status === "paid",
		status,
		splitBetween,
		splitType,
		paymentDirection,
		payments,
		payer: bill.payer || (Array.isArray(splitBetween) ? splitBetween[0] : "You"),
		description: bill.description || "",
		customSplitAmounts: bill.customSplitAmounts || {},
	};
};

const BillsContext = createContext(null);

export function BillsProvider({ children }) {
		const [bills, setBills] = useState(() => {
			if (typeof window === "undefined") return defaultBills.map((b, i) => normalizeBill(b, i + 1));
			try {
				const raw = window.localStorage.getItem(STORAGE_KEY);
				if (raw) {
					const parsed = JSON.parse(raw);
					if (Array.isArray(parsed) && parsed.length) return parsed.map((b, i) => normalizeBill(b, i + 1));
				}
			} catch (e) {
				// ignore and fall back
			}
			return defaultBills.map((b, i) => normalizeBill(b, i + 1));
		});

	useEffect(() => {
		if (typeof window !== "undefined") {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
		}
	}, [bills]);

		const addBill = (bill) => {
			const next = normalizeBill({ id: Date.now(), ...bill });
			setBills((prev) => [next, ...prev]);
			return next;
		};

		const updateBill = (id, updates) => {
			setBills((prev) => prev.map((b) => (b.id === id ? normalizeBill({ ...b, ...updates }, b.id) : b)));
		};

		const updateBillStatus = (id, newStatus) => {
			setBills((prev) =>
				prev.map((b) => (b.id === id ? normalizeBill({ ...b, status: newStatus, paid: newStatus === "paid" }, b.id) : b))
			);
		};

		const togglePayment = (id, person) => {
			setBills((prev) =>
				prev.map((b) => {
					if (b.id !== id) return b;
					const payments = { ...(b.payments || {}) };
					payments[person] = !payments[person];
					// if everyone in splitBetween has paid, mark as paid
					const allPaid = Array.isArray(b.splitBetween) && b.splitBetween.every((p) => payments[p]);
					return normalizeBill({ ...b, payments, status: allPaid ? "paid" : b.status }, b.id);
				})
			);
		};

		const markPaid = (id) => updateBillStatus(id, "paid");

		const stats = useMemo(() => {
			const unpaid = bills.filter((b) => !b.paid).length;
			const total = bills.length;
			const totalAmount = bills.reduce((s, b) => s + Number(b.amount || 0), 0);
			const amountDue = bills.filter((b) => !b.paid).reduce((s, b) => s + Number(b.amount || 0), 0);
			return { unpaid, total, amountDue, totalAmount };
		}, [bills]);

	return (
		<BillsContext.Provider value={{ bills, addBill, updateBill, markPaid, stats }}>
			{children}
		</BillsContext.Provider>
	);
}

export function useBills() {
	const ctx = useContext(BillsContext);
	if (!ctx) throw new Error("useBills must be used within a BillsProvider");
	return ctx;
}
