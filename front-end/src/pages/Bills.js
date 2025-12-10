import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBills } from "../context/BillsContext";
import { useHousehold } from "../context/HouseholdContext";
import { useUser } from "../context/UserContext";
//import TaskChat from "../components/TaskChat";
import ChatThread from "../components/ChatThread";


//import ChatThread from "../components/ChatThread";

// format ISO 'YYYY-MM-DD' to local label w/o timezone shift
const formatISODate = (iso, options) => {
  const token = typeof iso === "string" ? iso.slice(0, 10) : "";
  const m = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso || "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString(undefined, options);
};

const filterOptions = [
  { id: "all", label: "All" },
  { id: "unpaid", label: "Unpaid" },
  { id: "paid", label: "Paid" },
  { id: "general", label: "General Bill" },
  { id: "personal", label: "Personal Bill" },
];

const statusDisplay = {
  unpaid: { label: "Unpaid", fg: "#d42626", bg: "rgba(212, 38, 38, 0.15)" },
  paid: { label: "Paid", fg: "#389e0d", bg: "rgba(88, 204, 2, 0.18)" },
};

export default function Bills() {
  const { household } = useHousehold();
  const { user } = useUser();
  const myName = user?.name || user?.username || "";
  const location = useLocation();
  const navigate = useNavigate();
  const { bills, addBill, updateBillStatus, togglePayment, updateBill, deleteBill } = useBills();
  const [chatOpen, setChatOpen] = useState(null);
  const activeBill = chatOpen
    ? bills.find((b) => `bill-${b.id}` === chatOpen)
    : null;

  const [editingBill, setEditingBill] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  const memberOptions = useMemo(() => {
    const names = new Set([myName]);
    if (household && household.members) {
      household.members.forEach((member) => {
        const name = member.userId?.displayName || member.userId?.username;
        if (name) names.add(name);
      });
    }
    return Array.from(names);
  }, [household, myName]);

  const createInitialBillState = useCallback(
    () => ({
      title: "",
      amount: "",
      dueDate: "",
      payer: memberOptions[0] || myName,
      receiver: memberOptions[0] || myName,
      splitBetween: [memberOptions[0] || myName],
      splitType: "even",
      customSplitAmounts: {},
      paymentDirection: "none",
      description: "",
    }),
    [memberOptions, myName]
  );

  const [newBill, setNewBill] = useState(() => createInitialBillState());
  const [splitAmountError, setSplitAmountError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!location.state) {
      return;
    }
    const { openForm, filter: targetFilter, openChatForBillId, fromCalendarDate } = location.state;
    let shouldReplace = false;

    if (openForm) {
      setShowForm(true);
      shouldReplace = true;
    }

    if (targetFilter) {
      setFilter(targetFilter);
      shouldReplace = true;
    }

    if (fromCalendarDate) {
      const token = typeof fromCalendarDate === "string" ? fromCalendarDate.slice(0, 10) : "";
      setDateFilter(token);
      shouldReplace = true;
    }

    if (openChatForBillId) {
      const targetId = `bill-card-${openChatForBillId}`;
      const scrollToTarget = () => {
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };
      window.requestAnimationFrame(scrollToTarget);
      shouldReplace = true;
    }

    if (shouldReplace) { 
      navigate("/bills", { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (editingBill) {
      setNewBill({
        title: editingBill.title,
        amount: editingBill.amount.toString(),
        dueDate: editingBill.dueDate,
        payer: editingBill.payer,
        receiver: editingBill.receiver || memberOptions[0] || myName,
        splitBetween: editingBill.splitBetween || [myName],
        splitType: editingBill.splitType || "even",
        customSplitAmounts: editingBill.customSplitAmounts || {},
        paymentDirection: editingBill.paymentDirection || "none",
        description: editingBill.description || "",
      });
    } else {
      setNewBill(createInitialBillState());
    }
  }, [editingBill, createInitialBillState, myName, memberOptions]);

  // Auto-update splitBetween for personal bills when receiver changes
  useEffect(() => {
    if (newBill.paymentDirection === "personal" && memberOptions.length > 0) {
      const debtors = memberOptions.filter(m => m !== newBill.receiver);
      setNewBill(prev => ({
        ...prev,
        splitBetween: debtors,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newBill.paymentDirection, newBill.receiver, memberOptions.length]);

  const filteredBills = bills.filter((bill) => {
    // enforce personal bill visibility: only debtors, receiver, or creator can see personal bills
    if (bill.paymentDirection === "personal") {
      const isDebtor = Array.isArray(bill.splitBetween) && bill.splitBetween.includes(myName);
      const isReceiver = bill.receiver === myName;
      const isCreator = bill.createdBy === myName;
      if (!(isDebtor || isReceiver || isCreator)) return false;
    }
    if (filter === "all") return true;
    if (filter === "personal") return bill.paymentDirection === "personal";
    if (filter === "general") return bill.paymentDirection === "none";
    return bill.status === filter;
  });

  const filteredByDate = dateFilter
    ? filteredBills.filter(
        (bill) => typeof bill?.dueDate === "string" && bill.dueDate.slice(0, 10) === dateFilter
      )
    : filteredBills;

  const validateSplitAmounts = () => {
    if (newBill.splitType === "custom" && newBill.splitBetween.length > 1) {
      const totalAmount = parseFloat(newBill.amount);
      const splitTotal = Object.values(newBill.customSplitAmounts)
        .reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
      
      if (Math.abs(splitTotal - totalAmount) > 0.01) {
        setSplitAmountError(`Split total (${splitTotal.toFixed(2)}) must equal bill amount (${totalAmount.toFixed(2)})`);
        return false;
      }
    }
    setSplitAmountError("");
    return true;
  };

  const isFormValid = () => {
    if (!newBill.title.trim() || !newBill.amount || !newBill.dueDate) {
      return false;
    }
    if (parseFloat(newBill.amount) <= 0) return false;
    if (newBill.splitBetween.length === 0) {
      return false;
    }
    if (!!splitAmountError) {
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      let errorMsg = "Please fill in the following: ";
      let errors = [];
      
      if (!newBill.title.trim()) errors.push("Bill Title");
      if (!newBill.amount) errors.push("Amount");
      if (!newBill.dueDate) errors.push("Due Date");
      if (newBill.splitBetween.length === 0) errors.push("Select at least one person");
      
      setFormError(errorMsg + errors.join(", "));
      return;
    }
    
    if (!validateSplitAmounts()) {
      return;
    }

    setFormError("");
    const billData = {
      ...newBill,
      amount: parseFloat(newBill.amount),
      splitType: newBill.splitBetween.length > 1 ? newBill.splitType : "even",
      customSplitAmounts: newBill.splitType === "custom" ? newBill.customSplitAmounts : {},
    };
    
    if (editingBill) {
      updateBill(editingBill.id, billData);
      setEditingBill(null);
    } else {
      addBill(billData);
    }
    
    setShowForm(false);
    setNewBill(createInitialBillState());
    setSplitAmountError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBill(null);
    setNewBill(createInitialBillState());
    setSplitAmountError("");
    setFormError("");
  };

  const handleSplitToggle = (roommate) => {
    setNewBill(prev => {
      if (prev.paymentDirection === "outgoing") {
        return {
          ...prev,
          splitBetween: prev.splitBetween.includes(roommate) ? [] : [roommate],
        };
      }

      return {
        ...prev,
        splitBetween: prev.splitBetween.includes(roommate)
          ? prev.splitBetween.filter(r => r !== roommate)
          : [...prev.splitBetween, roommate],
      };
    });
  };

  const calculateYourShare = (bill) => {
    if (bill.splitType === "custom" && bill.customSplitAmounts) {
      const yourAmount = bill.customSplitAmounts[myName];
      return yourAmount ? parseFloat(yourAmount) : 0;
    }
    return bill.amount / bill.splitBetween.length;
  };

  const getBillTypeLabel = (paymentDirection) => {
    if (paymentDirection === "outgoing") return "I Need to Pay Someone";
    if (paymentDirection === "incoming") return "Someone Owes Me";
    if (paymentDirection === "personal") return "Personal Bill";
    return "General Bill";
  };

  const getBillTypeColor = (paymentDirection) => {
    if (paymentDirection === "outgoing") return { bg: "rgba(255, 193, 7, 0.15)", fg: "#ff9800" };
    if (paymentDirection === "incoming") return { bg: "rgba(88, 204, 2, 0.18)", fg: "#389e0d" };
    if (paymentDirection === "personal") return { bg: "rgba(123, 97, 255, 0.12)", fg: "#7b61ff" };
    return { bg: "rgba(33, 150, 243, 0.15)", fg: "#1976d2" };
  };


  // Visibility: personal bills should only be visible to assigned people, receiver, or creator
  const isBillVisibleToUser = (bill) => {
    if (bill.paymentDirection === "personal") {
      const isDebtor = Array.isArray(bill.splitBetween) && bill.splitBetween.includes(myName);
      const isReceiver = bill.receiver === myName;
      const isCreator = bill.createdBy === myName;
      return isDebtor || isReceiver || isCreator;
    }
    // general and other bills are visible to household members
    return true;
  };

  const visibleBills = bills.filter(isBillVisibleToUser);
  const visibleTotal = visibleBills.length;
  const visibleUnpaid = visibleBills.filter(b => b.status === 'unpaid').length;
  const visibleTotalAmount = visibleBills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const visibleYouOwe = visibleBills
    .filter(b => b.status === 'unpaid')
    .reduce((s, b) => {
      // If I've already marked my payment for this bill, don't count it
      if (b.payments && b.payments[myName]) return s;

      // For personal bills, only count if I'm a debtor (not the receiver)
      if (b.paymentDirection === 'personal') {
        const isReceiver = b.receiver === myName;
        if (isReceiver) return s; // receivers don't owe anything
        const isDebtor = Array.isArray(b.splitBetween) && b.splitBetween.includes(myName);
        if (!isDebtor) return s;
      }

      // For other bills, count if I'm in the split
      if (!(Array.isArray(b.splitBetween) && b.splitBetween.includes(myName))) return s;
      const myShare = b.splitType === 'custom' ? (parseFloat(b.customSplitAmounts?.[myName]) || 0) : (parseFloat(b.amount) || 0) / b.splitBetween.length;
      return s + myShare;
    }, 0);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Bills & Expenses</h2>
        
        <button
          onClick={() => {
            if (!household) {
                alert("You must join a household before creating bills.");
                return;
            }
            if (showForm || editingBill) {
              handleCancel();
            } else {
              setShowForm(true);
            }
          }}
          style={{
            ...addButtonStyle,
            opacity: !household ? 0.5 : 1,
            cursor: !household ? "not-allowed" : "pointer"
          }}
          disabled={!household}
          title={!household ? "Join a household to add bills" : "Add Bill"}
        >
          {showForm || editingBill ? "✕" : "+"}
        </button>
      </div>

      {!household && (
        <div style={{
            backgroundColor: "rgba(255, 107, 107, 0.1)",
            border: "1px solid rgba(255, 107, 107, 0.3)",
            color: "#d63031",
            padding: "1rem",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            textAlign: "center",
            fontSize: "0.95rem"
        }}>
            <strong>Missing Household:</strong> You are not currently part of a household. 
            <br/>Please create or join a household in your settings to manage bills.
        </div>
      )}

      <div style={statsContainerStyle}>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Total Bills</span>
          <span style={statValueStyle}>{visibleTotal}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Unpaid</span>
          <span style={statValueStyle}>{visibleUnpaid}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>You Owe</span>
          <span style={statValueStyle}>${(visibleYouOwe ?? 0).toFixed(2)}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Total Amount</span>
          <span style={statValueStyle}>${(visibleTotalAmount ?? 0).toFixed(2)}</span>
        </div>
      </div>

      {(showForm || editingBill) && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            style={inputStyle}
            type="text"
            placeholder="Bill Title"
            value={newBill.title}
            onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
            required
          />

          <input
            style={inputStyle}
            type="number"
            step="0.01"
            placeholder="Amount"
            value={newBill.amount}
            onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
            required
          />

          <input
            style={inputStyle}
            type="date"
            value={newBill.dueDate}
            onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
            required
          />

          <div style={paymentDirectionStyle}>
            <p style={formSectionTitleStyle}>Bill Type</p>
            <div style={optionButtonsContainerStyle}>
              <button
                type="button"
                style={{
                  ...optionButtonStyle,
                  backgroundColor: newBill.paymentDirection === "none" 
                    ? "var(--habita-accent)" 
                    : "var(--habita-chip)",
                  color: newBill.paymentDirection === "none"
                    ? "#ffffff"
                    : "var(--habita-text)",
                }}
                onClick={() => {
                  setNewBill(prev => ({
                    ...prev,
                    paymentDirection: "none",
                    splitBetween: [myName],
                    splitType: "even",
                    payer: myName
                  }));
                }}
              >
                General Bill
              </button>
              <button
                type="button"
                style={{
                  ...optionButtonStyle,
                  backgroundColor: newBill.paymentDirection === "personal"
                    ? "var(--habita-accent)"
                    : "var(--habita-chip)",
                  color: newBill.paymentDirection === "personal"
                    ? "#ffffff"
                    : "var(--habita-text)",
                }}
                onClick={() => {
                  const defaultReceiver = memberOptions[0] || myName;
                  setNewBill(prev => ({
                    ...prev,
                    paymentDirection: "personal",
                    splitBetween: memberOptions.filter(m => m !== defaultReceiver),
                    receiver: defaultReceiver
                  }));
                }}
              >
                Personal Bill
              </button>
            </div>

            <p style={formSectionTitleStyle}>
              {newBill.paymentDirection === "none" ? "Split Between" :
               newBill.paymentDirection === "personal" ? "Select who owes" :
               "Split Between"}
            </p>

            {newBill.paymentDirection === "personal" && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={receiverPayerLabelStyle}>Receiver</p>
                <select
                  value={newBill.receiver}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewBill(prev => ({
                      ...prev,
                      receiver: val,
                      // ensure receiver isn't in splitBetween and add everyone else
                      splitBetween: memberOptions.filter(m => m !== val),
                    }));
                  }}
                  style={{ padding: '0.5rem 0.6rem', borderRadius: 8, border: '1px solid var(--habita-border)', background: 'var(--habita-input)', color: 'var(--habita-text)' }}
                >
                  {memberOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={splitButtonsContainer}>
              <p style={receiverPayerLabelStyle}>Payer</p>
              {memberOptions.map((person) => {
                // For personal bills, do not show the receiver as a payer option
                if (newBill.paymentDirection === "personal" && person === newBill.receiver) return null;
                const shouldShow = newBill.paymentDirection === "none" || person !== myName || newBill.paymentDirection === "personal";
                if (!shouldShow) return null;

                return (
                  <button
                    key={person}
                    type="button"
                    onClick={() => handleSplitToggle(person)}
                    style={{
                      ...splitPersonButtonStyle,
                      backgroundColor: newBill.splitBetween.includes(person)
                        ? "var(--habita-accent)"
                        : "var(--habita-chip)",
                      color: newBill.splitBetween.includes(person)
                        ? "#ffffff"
                        : "var(--habita-text)",
                    }}
                  >
                    {person}
                  </button>
                );
              })}
            </div>
          </div>

          {newBill.splitBetween.length > 1 && (newBill.paymentDirection === "none" || newBill.paymentDirection === "personal") && (
            <div style={splitTypeContainerStyle}>
              <p style={formSectionTitleStyle}>Split Type</p>
              <div style={optionButtonsContainerStyle}>
                <button
                  type="button"
                  style={{
                    ...optionButtonStyle,
                    backgroundColor: newBill.splitType === "even"
                      ? "var(--habita-accent)"
                      : "var(--habita-chip)",
                    color: newBill.splitType === "even"
                      ? "#ffffff"
                      : "var(--habita-text)",
                  }}
                  onClick={() => setNewBill(prev => ({ ...prev, splitType: "even", customSplitAmounts: {} }))}
                >
                  Even Split
                </button>
                <button
                  type="button"
                  style={{
                    ...optionButtonStyle,
                    backgroundColor: newBill.splitType === "custom"
                      ? "var(--habita-accent)"
                      : "var(--habita-chip)",
                    color: newBill.splitType === "custom"
                      ? "#ffffff"
                      : "var(--habita-text)",
                  }}
                  onClick={() => setNewBill(prev => ({ ...prev, splitType: "custom" }))}
                >
                  Custom Split
                </button>
              </div>
            </div>
          )}

          {newBill.splitType === "custom" && newBill.splitBetween.length > 1 && (
            <div style={customSplitContainerStyle}>
              <p style={formSectionTitleStyle}>Custom Split Amounts</p>
              <div style={customSplitGridStyle}>
                {newBill.splitBetween.map((person) => (
                  <div key={person} style={customSplitCardStyle}>
                    <div style={personNameStyle}>{person}</div>
                    <div style={amountInputContainerStyle}>
                      <span style={currencySymbolStyle}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={newBill.customSplitAmounts[person] || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setNewBill(prev => ({
                            ...prev,
                            customSplitAmounts: {
                              ...prev.customSplitAmounts,
                              [person]: newValue,
                            },
                          }));
                          
                          const totalAmount = parseFloat(newBill.amount) || 0;
                          const otherAmounts = Object.entries({...newBill.customSplitAmounts, [person]: newValue})
                            .reduce((sum, [_, value]) => sum + (parseFloat(value) || 0), 0);

                          if (newValue !== "" && parseFloat(newValue) <= 0) {
                            setSplitAmountError(`Each custom amount must be greater than 0`);
                          } else if (Math.abs(otherAmounts - totalAmount) > 0.01 && otherAmounts !== 0) {
                            setSplitAmountError(`Split total (${otherAmounts.toFixed(2)}) must equal bill amount (${totalAmount.toFixed(2)})`);
                          } else {
                            setSplitAmountError("");
                          }
                        }}
                        style={amountInputStyle}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {splitAmountError && (
                <div style={errorTextStyle}>
                  {splitAmountError}
                </div>
              )}
            </div>
          )}

          <textarea
            style={textareaStyle}
            placeholder="Description (optional)"
            value={newBill.description}
            onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
          />
          
          {formError && (
            <div style={errorTextStyle}>
              {formError}
            </div>
          )}
          
          <div style={formButtonsStyle}>
            <button type="button" onClick={handleCancel} style={cancelButtonStyle}>
              Cancel
            </button>
            <button type="submit" style={submitButtonStyle} disabled={!isFormValid()}>
              {editingBill ? "Save Changes" : "Add Bill"}
            </button>
          </div>
        </form>
      )}

      <div style={filterContainerStyle}>
        {filterOptions.map((option) => {
          const isActive = filter === option.id;
          return (
            <button
              key={option.id}
              style={{
                ...filterButtonStyle,
                backgroundColor: isActive
                  ? "rgba(74,144,226,0.18)"
                  : "var(--habita-chip)",
                color: isActive ? "var(--habita-accent)" : "var(--habita-muted)",
                borderColor: isActive
                  ? "var(--habita-accent)"
                  : "var(--habita-border)",
                fontWeight: isActive ? 700 : 600,
              }}
              onClick={(event) => {
                setFilter(option.id);
                event.currentTarget.blur();
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div style={dateFilterRowStyle}>
        <input
          type="date"
          value={dateFilter || ""}
          onChange={(event) => setDateFilter(event.target.value || "")}
          placeholder="Filter by date"
          aria-label="Filter by date"
          style={dateInputStyle}
        />
        {dateFilter && (
          <button
            type="button"
            onClick={() => setDateFilter("")}
            style={clearDateButtonStyle}
            aria-label="Clear date filter"
          >
            Clear
          </button>
        )}
      </div>

      <div style={billsListStyle}>
        {filteredByDate.length === 0 ? (
          <p style={emptyStateStyle}>No bills in this view.</p>
        ) : (
          filteredByDate.map((bill) => {
            const billTypeColor = getBillTypeColor(bill.paymentDirection);
            return (
              <div id={`bill-card-${bill.id}`} key={bill.id} style={billCardStyle}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    updateBillStatus(bill.id, bill.status === "paid" ? "unpaid" : "paid")
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      updateBillStatus(bill.id, bill.status === "paid" ? "unpaid" : "paid");
                    }
                  }}
                  style={{
                    ...statusChipStyle,
                    position: "absolute",
                    top: "1rem",
                    right: "1.25rem",
                    backgroundColor: statusDisplay[bill.status]?.bg ?? "rgba(0,0,0,0.06)",
                    color: statusDisplay[bill.status]?.fg ?? "var(--habita-text)",
                    display: 'inline-block',
                    cursor: 'pointer'
                  }}
                >
                  {statusDisplay[bill.status]?.label ?? bill.status ?? "Unknown"}
                </div>
                <div style={billTypeIndicatorStyle}>
                  <span style={{
                    ...billTypeBadgeStyle,
                    backgroundColor: billTypeColor.bg,
                    color: billTypeColor.fg,
                  }}>
                    {getBillTypeLabel(bill.paymentDirection)}
                  </span>
                </div>
                
                <div style={billHeaderStyle}>
                  <h3 style={billTitleStyle}>{bill.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setChatOpen(`bill-${bill.id}`)}
                      style={{
                        ...editButtonStyle,
                        background: "var(--habita-chip)",
                        color: "var(--habita-accent)",
                      }}
                    >
                      Chat
                    </button>
                    {!(bill.paymentDirection === "personal") || (bill.createdBy && bill.createdBy === myName) ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingBill(bill);
                            setShowForm(true);
                          }}
                          style={{ ...editButtonStyle, color: "var(--habita-accent)" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            const ok = window.confirm("Delete this bill?");
                            if (!ok) return;
                            deleteBill(bill.id);
                          }}
                          style={{ ...editButtonStyle, color: "var(--habita-accent)" }}
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                
                <div style={billAmountStyle}>
                  <div>
                    <div style={amountMainStyle}>
                      ${bill.paymentDirection === "personal"
                        ? bill.receiver === myName
                          ? bill.amount.toFixed(2)
                          : calculateYourShare(bill).toFixed(2)
                        : bill.paymentDirection === "incoming" 
                          ? calculateYourShare(bill).toFixed(2)
                          : bill.paymentDirection === "outgoing"
                            ? bill.amount.toFixed(2)
                            : calculateYourShare(bill).toFixed(2)}
                    </div>
                    <div style={amountSecondaryStyle}>
                      {bill.paymentDirection === "personal"
                        ? bill.receiver === myName
                          ? "total owed to you"
                          : bill.splitType === "custom"
                            ? `your custom share of ${bill.amount.toFixed(2)}`
                            : bill.splitBetween.length > 0
                              ? `your share of ${bill.amount.toFixed(2)}`
                              : "total amount"
                        : bill.paymentDirection === "incoming"
                          ? bill.splitType === "custom"
                            ? `they owe you (custom) of ${bill.amount.toFixed(2)}`
                            : bill.splitBetween.length > 1
                              ? `they owe you of ${bill.amount.toFixed(2)}`
                              : "total amount owed"
                          : bill.paymentDirection === "outgoing"
                            ? "you need to pay"
                            : bill.splitType === "custom" 
                              ? `your custom share of ${bill.amount.toFixed(2)}` 
                              : bill.splitBetween.length > 1
                                ? `your share of ${bill.amount.toFixed(2)}`
                                : "total amount"}
                    </div>
                  </div>
                  <div style={amountSecondaryStyle}>
                    {bill.paymentDirection === "outgoing"
                      ? "single payment"
                      : bill.splitBetween.length > 1 
                        ? `${bill.splitBetween.length} way ${bill.splitType || 'even'} split`
                        : "single payer"}
                  </div>
                </div>
                
                <div style={billInfoContainerStyle}>
                  <p style={billInfoStyle}>Due: {formatISODate(bill.dueDate, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p style={billInfoStyle}>
                    {bill.paymentDirection === "personal"
                      ? "Pay to"
                      : bill.paymentDirection === "incoming"
                        ? "Paid by"
                        : bill.paymentDirection === "outgoing"
                          ? "Pay to"
                          : "Paid by"}: {
                      bill.paymentDirection === "outgoing"
                        ? bill.splitBetween[0]
                        : bill.paymentDirection === "personal"
                          ? (bill.receiver || "None")
                          : bill.payments && Object.entries(bill.payments).filter(([_, paid]) => paid).length > 0
                            ? Object.entries(bill.payments).filter(([_, paid]) => paid).map(([person]) => person).join(", ")
                            : "None"
                    }
                  </p>
                </div>
                
                {((bill.paymentDirection === "none" && bill.splitBetween.length > 1) || 
                  bill.paymentDirection === "incoming" || 
                  bill.paymentDirection === "outgoing" ||
                  bill.paymentDirection === "personal") && (
                  <div style={paymentStatusStyle}>
                    <p style={paymentLabelStyle}>Payment Status:</p>
                    <div style={paymentChipsContainer}>
                      {bill.paymentDirection === "outgoing" ? (
                        <button
                          onClick={() => togglePayment(bill.id, myName)}
                          style={{
                            ...paymentChipStyle,
                            backgroundColor: bill.payments?.[myName]
                              ? "rgba(88, 204, 2, 0.18)"
                              : "rgba(212, 38, 38, 0.15)",
                            color: bill.payments?.[myName] ? "#389e0d" : "#d42626",
                          }}
                        >
                          {myName} {bill.payments?.[myName] ? "✓" : "✗"}
                        </button>
                      ) : (
                        bill.splitBetween.map((person) => (
                          <button
                            key={person}
                            onClick={() => togglePayment(bill.id, person)}
                            style={{
                              ...paymentChipStyle,
                              backgroundColor: (bill.payments && bill.payments[person])
                                ? "rgba(88, 204, 2, 0.18)"
                                : "rgba(212, 38, 38, 0.15)",
                              color: (bill.payments && bill.payments[person])
                                ? "#389e0d"
                                : "#d42626",
                            }}
                          >
                            {person} {(bill.payments && bill.payments[person]) ? "✓" : "✗"}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                {bill.description && (
                  <p style={billDescriptionStyle}>{bill.description}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {chatOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "var(--habita-bg)",
              borderRadius: "16px",
              padding: "1rem",
              width: "90%",
              maxWidth: "480px",
              height: "70%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <button
              onClick={() => setChatOpen(null)}
              style={{
                alignSelf: "flex-end",
                border: "none",
                background: "transparent",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <ChatThread
              threadId={`bill-${activeBill.id}`}
              title={`Bill Chat: ${activeBill.title}`}
              currentUserName={myName}
            />

          </div>
        </div>
      )}


    </div>
  );
}

// Styles
const pageStyle = {
  padding: "1.25rem",
  backgroundColor: "var(--habita-bg)",
  minHeight: "100%",
  color: "var(--habita-text)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "var(--habita-card)",
  padding: "1rem 1.25rem",
  borderRadius: "16px",
  border: "1px solid rgba(74,144,226,0.25)",
  marginBottom: "1.25rem",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.3rem",
  fontWeight: 600,
};

const addButtonStyle = {
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "1.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 0.2s ease",
};

const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "1rem",
  marginBottom: "1.5rem",
};

const statItemStyle = {
  background: "var(--habita-card)",
  padding: "1rem",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.3rem",
};

const statLabelStyle = {
  fontSize: "0.85rem",
  color: "var(--habita-muted)",
  fontWeight: 500,
};

const statValueStyle = {
  fontSize: "1.4rem",
  fontWeight: 700,
  color: "var(--habita-accent)",
};

const formStyle = {
  background: "var(--habita-card)",
  padding: "1.5rem",
  borderRadius: "16px",
  border: "1px solid rgba(74,144,226,0.25)",
  marginBottom: "1.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const inputStyle = {
  background: "var(--habita-input)",
  border: "1px solid var(--habita-border)",
  borderRadius: "10px",
  padding: "0.9rem",
  color: "var(--habita-text)",
  fontSize: "0.95rem",
  fontFamily: "inherit",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "80px",
  resize: "vertical",
  fontFamily: "inherit",
};

const formSectionTitleStyle = {
  fontSize: "0.95rem",
  fontWeight: 600,
  color: "var(--habita-text)",
  marginBottom: "0.6rem",
  marginTop: "0.3rem",
};

const receiverPayerLabelStyle = {
  fontSize: "1.05rem",
  fontWeight: 700,
  color: "var(--habita-text)",
  marginBottom: "0.5rem",
  marginTop: "0.2rem",
};

const paymentDirectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const optionButtonsContainerStyle = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
};

const optionButtonStyle = {
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 600,
  flex: 1,
  minWidth: "120px",
  transition: "all 0.2s ease",
};

const splitButtonsContainer = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.6rem",
  marginTop: "0.3rem",
};

const splitPersonButtonStyle = {
  padding: "0.6rem 1.1rem",
  borderRadius: "20px",
  border: "none",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 600,
  transition: "all 0.2s ease",
};

const splitTypeContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const customSplitContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.7rem",
};

const customSplitGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "0.9rem",
};

const customSplitCardStyle = {
  background: "var(--habita-chip)",
  padding: "1rem",
  borderRadius: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
};

const personNameStyle = {
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "var(--habita-text)",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const amountInputContainerStyle = {
  display: "flex",
  alignItems: "center",
  background: "var(--habita-input)",
  borderRadius: "8px",
  padding: "0.6rem 0.8rem",
  border: "1px solid var(--habita-border)",
};

const currencySymbolStyle = {
  color: "var(--habita-muted)",
  marginRight: "0.4rem",
  fontSize: "1rem",
  fontWeight: 600,
};

const amountInputStyle = {
  border: "none",
  background: "transparent",
  color: "var(--habita-text)",
  fontSize: "1rem",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

const errorTextStyle = {
  color: '#d42626',
  fontSize: '0.85rem',
  marginTop: '0.3rem',
  textAlign: 'center',
  fontWeight: 500,
};

const formButtonsStyle = {
  display: "flex",
  gap: "0.75rem",
  marginTop: "0.5rem",
};

const submitButtonStyle = {
  background: "var(--habita-accent)",
  color: "#ffffff",
  border: "none",
  padding: "0.9rem",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.95rem",
  flex: 1,
  transition: "opacity 0.2s ease",
  opacity: 1,
};

const cancelButtonStyle = {
  background: "var(--habita-chip)",
  color: "var(--habita-text)",
  border: "none",
  padding: "0.9rem",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.95rem",
  minWidth: "100px",
};

const filterContainerStyle = {
  display: "flex",
  gap: "0.6rem",
  marginBottom: "1.25rem",
  flexWrap: "wrap",
};

const filterButtonStyle = {
  border: "1px solid var(--habita-border)",
  borderRadius: "999px",
  background: "var(--habita-chip)",
  fontSize: "0.8rem",
  padding: "0.35rem 0.9rem",
  cursor: "pointer",
  color: "var(--habita-muted)",
  fontWeight: 600,
  transition: "all 0.2s ease",
};

const dateFilterRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  marginLeft: "0.25rem",
};

const dateInputStyle = {
  border: "1px solid var(--habita-border)",
  borderRadius: "999px",
  background: "var(--habita-card)",
  color: "var(--habita-text)",
  fontSize: "0.8rem",
  padding: "0.35rem 0.6rem",
  outline: "none",
};

const clearDateButtonStyle = {
  ...filterButtonStyle,
  padding: "0.35rem 0.6rem",
};

const billsListStyle = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "1.2rem 0",
  color: "var(--habita-muted)",
  gridColumn: "1 / -1",
  fontSize: "0.85rem",
};

const billCardStyle = {
  background: "var(--habita-card)",
  padding: "1.25rem",
  borderRadius: "14px",
  border: "1px solid rgba(74,144,226,0.25)",
  transition: "transform 0.2s ease",
  position: "relative",
};

const billTypeIndicatorStyle = {
  marginBottom: "0.75rem",
};

const billTypeBadgeStyle = {
  display: "inline-block",
  padding: "0.4rem 0.9rem",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: 600,
};

const billHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "1rem",
  gap: "0.75rem",
};

const billTitleStyle = {
  margin: 0,
  fontSize: "1.1rem",
  fontWeight: 700,
  flex: 1,
};

const editButtonStyle = {
  border: "none",
  padding: "0.4rem 0.9rem",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
  backgroundColor: "var(--habita-chip)",
  color: "var(--habita-text)",
  whiteSpace: "nowrap",
};

const statusChipStyle = {
  border: "none",
  padding: "0.4rem 0.9rem",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const billAmountStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  margin: "1rem 0",
  padding: "1rem",
  background: "var(--habita-chip)",
  borderRadius: "10px",
};

const amountMainStyle = {
  color: "var(--habita-accent)",
  fontSize: "1.5rem",
  fontWeight: 700,
  marginBottom: "0.2rem",
};

const amountSecondaryStyle = {
  color: "var(--habita-muted)",
  fontSize: "0.85rem",
  fontWeight: 500,
};

const billInfoContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
  marginBottom: "0.8rem",
};

const billInfoStyle = {
  margin: 0,
  fontSize: "0.9rem",
  color: "var(--habita-text)",
};

const paymentStatusStyle = {
  marginTop: "1rem",
  padding: "1rem",
  background: "var(--habita-chip)",
  borderRadius: "10px",
};

const paymentLabelStyle = {
  fontSize: "0.85rem",
  color: "var(--habita-muted)",
  marginBottom: "0.6rem",
  fontWeight: 600,
  margin: 0,
};

const paymentChipsContainer = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  marginTop: "0.6rem",
};

const paymentChipStyle = {
  border: "none",
  padding: "0.4rem 0.9rem",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
};

const billDescriptionStyle = {
  margin: "1rem 0 0 0",
  fontSize: "0.9rem",
  color: "var(--habita-text)",
  padding: "0.9rem",
  background: "var(--habita-chip)",
  borderRadius: "8px",
};
