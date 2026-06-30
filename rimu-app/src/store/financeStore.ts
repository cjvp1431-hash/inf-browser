import { create } from 'zustand';
import {
  Account, Transaction,
  getAccounts, addAccount as dbAddAccount,
  getTransactions, addTransaction as dbAddTransaction,
  deleteTransaction as dbDeleteTransaction,
} from '../database/database';

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  isLoading: boolean;
  selectedAccountId: string | null;
  loadAll: () => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string, accountId: string, type: string, amount: number) => Promise<void>;
  setSelectedAccount: (id: string | null) => void;
  getTotalByCurrency: () => Record<string, number>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  transactions: [],
  isLoading: false,
  selectedAccountId: null,

  loadAll: async () => {
    set({ isLoading: true });
    const [accounts, transactions] = await Promise.all([getAccounts(), getTransactions()]);
    const selectedAccountId = accounts.length > 0 ? accounts[0].id : null;
    set({ accounts, transactions, selectedAccountId, isLoading: false });
  },

  addAccount: async (accountData) => {
    const account = await dbAddAccount(accountData);
    set(state => ({
      accounts: [...state.accounts, account],
      selectedAccountId: state.selectedAccountId || account.id,
    }));
  },

  addTransaction: async (txData) => {
    const tx = await dbAddTransaction(txData);
    const delta = tx.type === 'income' ? tx.amount : -tx.amount;
    set(state => ({
      transactions: [tx, ...state.transactions],
      accounts: state.accounts.map(a =>
        a.id === tx.accountId ? { ...a, balance: a.balance + delta } : a
      ),
    }));
  },

  deleteTransaction: async (id, accountId, type, amount) => {
    await dbDeleteTransaction(id, accountId, type, amount);
    const delta = type === 'income' ? -amount : amount;
    set(state => ({
      transactions: state.transactions.filter(t => t.id !== id),
      accounts: state.accounts.map(a =>
        a.id === accountId ? { ...a, balance: a.balance + delta } : a
      ),
    }));
  },

  setSelectedAccount: (id) => set({ selectedAccountId: id }),

  getTotalByCurrency: () => {
    const totals: Record<string, number> = {};
    for (const acc of get().accounts) {
      totals[acc.currency] = (totals[acc.currency] || 0) + acc.balance;
    }
    return totals;
  },
}));
