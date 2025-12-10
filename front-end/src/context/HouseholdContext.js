// Add useCallback to the imports (line 1):
import { createContext, useContext, useEffect, useState, useCallback } from "react";

// Remove or comment out the unused API_URL line:
// const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const HouseholdContext = createContext(null);

export function HouseholdProvider({ children }) {
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    return localStorage.getItem("habita:auth:token");
  };

  const fetchHousehold = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setHousehold(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/households/my-household`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        setHousehold(null);
        setError(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let detail = "Failed to fetch household";
        try {
          const data = await response.json();
          detail = data?.error || detail;
        } catch (_) {
          /* noop */
        }
        throw new Error(detail);
      }

      const data = await response.json();
      setHousehold(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching household:", err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array

  useEffect(() => {
    fetchHousehold();
  }, [fetchHousehold]);


  const createHousehold = async (name) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/households`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        let detail = "Failed to create household";
        try {
          const data = await response.json();
          detail = data?.error || detail;
        } catch (_) {
          /* noop */
        }
        throw new Error(detail);
      }

      const data = await response.json();
      // Fetch populated household (with member user data) after creation
      await fetchHousehold();
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error("Error creating household:", err);
      throw err;
    }
  };

  const joinHousehold = async (inviteCode) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/households/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join household");
      }

      const data = await response.json();
      // Refresh to get populated members with usernames/displayNames
      await fetchHousehold();
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error("Error joining household:", err);
      throw err;
    }
  };

  const leaveHousehold = async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/households/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to leave household");

      setHousehold(null);
    } catch (err) {
      setError(err.message);
      console.error("Error leaving household:", err);
      throw err;
    }
  };

  const regenerateInviteCode = async () => {
    try {
      if (!household) throw new Error("Not part of a household");

      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/households/${household.id}/regenerate-code`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to regenerate invite code");

      const data = await response.json();
      setHousehold((prev) => ({
        ...prev,
        inviteCode: data.data.inviteCode,
        inviteCodeExpires: data.data.inviteCodeExpires,
      }));
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error("Error regenerating invite code:", err);
      throw err;
    }
  };

  const removeMember = async (userId) => {
    try {
      if (!household) throw new Error("Not part of a household");

      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/households/${household.id}/members/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to remove member");

      await fetchHousehold();
    } catch (err) {
      setError(err.message);
      console.error("Error removing member:", err);
      throw err;
    }
  };

  return (
    <HouseholdContext.Provider
      value={{
        household,
        loading,
        error,
        createHousehold,
        joinHousehold,
        leaveHousehold,
        regenerateInviteCode,
        removeMember,
        refetch: fetchHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error("useHousehold must be used within a HouseholdProvider");
  return ctx;
}
