import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import { 
  Expense, expenses as initialExpenses, 
  expenseCategories, getTodayBR, PaymentSource
} from "@/lib/finance-data";

export type CountryFilter = "todos" | "brasil" | "uruguay";

interface FinanceContextType {
  expenses: Expense[];
  allExpenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  addAutoExpenses: (autoExpenses: Omit<Expense, "id">[]) => void;
  registerFbAdsPayment: (amount: number, source: PaymentSource) => void;
  fbAdsAccumulated: number;
  fbAdsPaid: number;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  countryFilter: CountryFilter;
  setCountryFilter: (country: CountryFilter) => void;
  manualCash: number | null;
  setManualCash: (value: number | null) => void;
  manualSaque: number | null;
  setManualSaque: (value: number | null) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const today = getTodayBR();

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [allExpenses, setAllExpenses] = useState<Expense[]>(initialExpenses);
  const [selectedDate, setSelectedDate] = useState(today);
  const [dateRange, setDateRange] = useState({ from: today, to: today });
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("todos");
  const [manualCash, setManualCashState] = useState<number | null>(() => {
    const stored = localStorage.getItem("manualCash");
    return stored ? Number(stored) : null;
  });
  const [manualSaque, setManualSaqueState] = useState<number | null>(() => {
    const stored = localStorage.getItem("manualSaque");
    return stored ? Number(stored) : null;
  });

  const setManualCash = (value: number | null) => {
    setManualCashState(value);
    if (value !== null) {
      localStorage.setItem("manualCash", String(value));
    } else {
      localStorage.removeItem("manualCash");
    }
  };

  const setManualSaque = (value: number | null) => {
    setManualSaqueState(value);
    if (value !== null) {
      localStorage.setItem("manualSaque", String(value));
    } else {
      localStorage.removeItem("manualSaque");
    }
  };

  const expenses = useMemo(() => {
    if (countryFilter === "todos") return allExpenses;
    return allExpenses.filter(e => e.country === countryFilter);
  }, [allExpenses, countryFilter]);

  const addExpense = (expense: Omit<Expense, "id">) => {
    const id = `DES${String(allExpenses.length + 1).padStart(3, "0")}`;
    setAllExpenses(prev => [{ ...expense, id }, ...prev]);
  };

  return (
    <FinanceContext.Provider value={{ expenses, allExpenses, addExpense, selectedDate, setSelectedDate, dateRange, setDateRange, countryFilter, setCountryFilter, manualCash, setManualCash, manualSaque, setManualSaque }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
