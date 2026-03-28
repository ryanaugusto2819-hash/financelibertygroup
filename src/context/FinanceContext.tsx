import React, { createContext, useContext, useState, ReactNode } from "react";
import { format } from "date-fns";
import { 
  Expense, expenses as initialExpenses, 
  expenseCategories 
} from "@/lib/finance-data";

export type CountryFilter = "todos" | "brasil" | "uruguay";

interface FinanceContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  countryFilter: CountryFilter;
  setCountryFilter: (country: CountryFilter) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const today = format(new Date(), "yyyy-MM-dd");

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [selectedDate, setSelectedDate] = useState(today);
  const [dateRange, setDateRange] = useState({ from: today, to: today });
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("todos");

  const addExpense = (expense: Omit<Expense, "id">) => {
    const id = `DES${String(expenses.length + 1).padStart(3, "0")}`;
    setExpenses(prev => [{ ...expense, id }, ...prev]);
  };

  return (
    <FinanceContext.Provider value={{ expenses, addExpense, selectedDate, setSelectedDate, dateRange, setDateRange, countryFilter, setCountryFilter }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
