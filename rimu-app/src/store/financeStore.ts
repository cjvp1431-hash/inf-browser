import { create } from 'zustand';
import { Account, Transaction, Budget } from '../types';
import {
  getAccounts, addAccount as dbAddAcc,
  getTransactions, addTransaction as dbAddTx, addInstallmentTransaction, deleteTransaction as dbDeleteTx,
  getBudgets, addBudget as dbAddBudget, deleteBudget as dbDeleteBudget,
  getMonthlySpendByCategory,
} from '../database/database';

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  monthlySpend: Record<string, number>;
  selectedAccountId: string | null;
  isLoading: boolean;
  loadAll: () => Promise<void>;
  addAccount: (a: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'installmentNumber' | 'totalInstallments'>, installments?: number) => Promise<void>;
  deleteTransaction: (id: string, accountId: string, type: string, amount: number) => Promise<void>;
  addBudget: (b: Omit<Budget, 'id' | 'createdAt'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  setSelectedAccount: (id: string | null) => void;
  refreshSpend: () => Promise<void>;
  budgetUsage: (category: string) => { spent: number; limit: number; pct: number } | null;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  transactions: [],
  budgets: [],
  monthlySpend: {},
  selectedAccountId: null,
  isLoading: false,

  loadAll: async () => {
    set({ isLoading: true });
    const [accounts, transactions, budgets, monthlySpend] = await Promise.all([
      getAccounts(), getTransactions(), getBudgets(), getMonthlySpendByCategory(),
    ]);
    set({
      accounts,
      transactions,
      budgets,
      monthlySpend,
      selectedAccountId: accounts[0]?.id ?? null,
      isLoading: false,
    });
  },

  addAccount: async (data) => {
    const acc = await dbAddAcc(data);
    set(s => ({ accounts: [...s.accounts, acc], selectedAccountId: s.selectedAccountId ?? acc.id }));
  },

  addTransaction: async (txData, installments) => {
    if (installments && installments > 1) {
      const results = await addInstallmentTransaction({ ...txData, installments }, installments);
      const first = results[0];
      const delta = first.type === 'income' ? first.amount : -first.amount;
      set(s => ({
        transactions: [first, ...s.transactions],
        accounts: s.accounts.map(a => a.id === first.accountId ? { ...a, balance: a.balance + delta } : a),
        monthlySpend: first.type === 'expense'
          ? { ...s.monthlySpend, [first.category]: (s.monthlySpend[first.category] || 0) + first.amount }
          : s.monthlySpend,
      }));
    } else {
      const tx = await dbAddTx({ ...txData, installmentNumber: 1, totalInstallments: 1 });
      const delta = tx.type === 'income' ? tx.amount : -tx.amount;
      set(s => ({
        transactions: [tx, ...s.transactions],
        accounts: s.accounts.map(a => a.id === tx.accountId ? { ...a, balance: a.balance + delta } : a),
        monthlySpend: tx.type === 'expense'
          ? { ...s.monthlySpend, [tx.category]: (s.monthlySpend[tx.category] || 0) + tx.amount }
          : s.monthlySpend,
      }));
    }
  },

  deleteTransaction: async (id, accountId, type, amount) => {
    await dbDeleteTx(id, accountId, type, amount);
    const delta = type === 'income' ? -amount : amount;
    set(s => ({
      transactions: s.transactions.filter(t => t.id !== id),
      accounts: s.accounts.map(a => a.id === accountId ? { ...a, balance: a.balance + delta } : a),
    }));
  },

  addBudget: async (data) => {
    const budget = await dbAddBudget(data);
    set(s => ({ budgets: [...s.budgets, budget] }));
  },

  deleteBudget: async (id) => {
    await dbDeleteBudget(id);
    set(s => ({ budgets: s.budgets.filter(b => b.id !== id) }));
  },

  setSelectedAccount: (id) => set({ selectedAccountId: id }),

  refreshSpend: async () => {
    const monthlySpend = await getMonthlySpendByCategory();
    set({ monthlySpend });
  },

  budgetUsage: (category) => {
    const { budgets, monthlySpend } = get();
    const budget = budgets.find(b => b.category === category);
    if (!budget) return null;
    const spent = monthlySpend[category] || 0;
    return { spent, limit: budget.limitAmount, pct: Math.min((spent / budget.limitAmount) * 100, 100) };
  },
}));
