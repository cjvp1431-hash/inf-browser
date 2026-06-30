import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Modal,
  ScrollView, KeyboardAvoidingView, Platform, Dimensions, Text,
} from 'react-native';
import { TextInput, Button, Chip, FAB, ProgressBar } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../store/financeStore';
import { COLORS, CURRENCIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';
import { formatCurrency, getTodayString } from '../utils/formatters';
import TransactionCard from '../components/TransactionCard';

const { width: SCREEN_W } = Dimensions.get('window');

const PIE_COLORS = ['#F44336', '#2196F3', '#FF9800', '#4CAF50', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];

type TxType = 'income' | 'expense';
type ActiveTab = 'transactions' | 'charts' | 'budgets';

export default function FinanceScreen() {
  const {
    accounts, transactions, budgets, monthlySpend, selectedAccountId,
    addTransaction, deleteTransaction, addAccount, addBudget, deleteBudget,
    setSelectedAccount, budgetUsage,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('transactions');
  const [txModal, setTxModal] = useState(false);
  const [accModal, setAccModal] = useState(false);
  const [budgetModal, setBudgetModal] = useState(false);

  // TX form
  const [txType, setTxType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Otro');
  const [description, setDescription] = useState('');
  const [installments, setInstallments] = useState('1');

  // Account form
  const [accName, setAccName] = useState('');
  const [accCurrency, setAccCurrency] = useState('DOP');
  const [accBalance, setAccBalance] = useState('0');

  // Budget form
  const [budgetCategory, setBudgetCategory] = useState('Comida');
  const [budgetLimit, setBudgetLimit] = useState('');

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const filteredTx = selectedAccountId
    ? transactions.filter(t => t.accountId === selectedAccountId)
    : transactions;

  const openTx = (type: TxType = 'expense') => {
    setTxType(type);
    setAmount('');
    setCategory(type === 'expense' ? 'Otro' : 'Salario');
    setDescription('');
    setInstallments('1');
    setTxModal(true);
  };

  const handleAddTx = async () => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || !selectedAccountId) return;
    const cuotas = parseInt(installments) || 1;
    await addTransaction(
      {
        accountId: selectedAccountId,
        type: txType,
        amount: parsed,
        category,
        description: description.trim(),
        date: getTodayString(),
        installments: cuotas,
      },
      cuotas > 1 ? cuotas : undefined,
    );
    setTxModal(false);
  };

  const handleAddAccount = async () => {
    if (!accName.trim()) return;
    await addAccount({ name: accName.trim(), type: 'checking', currency: accCurrency, balance: parseFloat(accBalance) || 0 });
    setAccModal(false);
  };

  const handleAddBudget = async () => {
    if (!budgetLimit || !selectedAccountId) return;
    await addBudget({ accountId: selectedAccountId, category: budgetCategory, limitAmount: parseFloat(budgetLimit), period: 'monthly' });
    setBudgetModal(false);
  };

  // Pie chart data from monthlySpend
  const pieData = Object.entries(monthlySpend)
    .filter(([, v]) => v > 0)
    .map(([name, amt], i) => ({
      name: name.length > 8 ? name.slice(0, 7) + '.' : name,
      amount: amt,
      color: PIE_COLORS[i % PIE_COLORS.length],
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 11,
    }));

  const totalMonthlySpend = Object.values(monthlySpend).reduce((a, b) => a + b, 0);
  const totalIncome = filteredTx.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = filteredTx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  return (
    <View style={styles.container}>
      {/* Account selector */}
      <View style={styles.accountBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountScroll}>
          {accounts.map(acc => (
            <TouchableOpacity
              key={acc.id}
              style={[styles.accountChip, selectedAccountId === acc.id && styles.accountChipActive]}
              onPress={() => setSelectedAccount(acc.id)}
            >
              <Text style={[styles.accountChipText, selectedAccountId === acc.id && { color: '#000' }]}>
                {acc.name}
              </Text>
              <Text style={[styles.accountBalance, selectedAccountId === acc.id && { color: '#000' }]}>
                {formatCurrency(acc.balance, acc.currency)}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addAccountChip} onPress={() => setAccModal(true)}>
            <Ionicons name="add" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#4CAF5010' }]}>
          <Text style={styles.summaryLabel}>Ingresos</Text>
          <Text style={[styles.summaryAmount, { color: COLORS.success }]}>+{formatCurrency(totalIncome, selectedAccount?.currency ?? 'DOP')}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#F4433610' }]}>
          <Text style={styles.summaryLabel}>Gastos</Text>
          <Text style={[styles.summaryAmount, { color: COLORS.error }]}>-{formatCurrency(totalExpense, selectedAccount?.currency ?? 'DOP')}</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['transactions', 'charts', 'budgets'] as ActiveTab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {{ transactions: 'Movimientos', charts: 'Gráficos', budgets: 'Presupuestos' }[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'transactions' && (
          <>
            {filteredTx.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="cash-outline" size={64} color={COLORS.border} />
                <Text style={styles.emptyText}>Sin movimientos</Text>
              </View>
            ) : (
              filteredTx.map(tx => (
                <TransactionCard
                  key={tx.id}
                  tx={tx}
                  account={selectedAccount}
                  onDelete={deleteTransaction}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'charts' && (
          <View>
            <Text style={styles.chartTitle}>Gastos del mes por categoría</Text>
            {pieData.length > 0 ? (
              <>
                <PieChart
                  data={pieData}
                  width={SCREEN_W - 32}
                  height={200}
                  chartConfig={{ color: () => COLORS.accent, labelColor: () => COLORS.textSecondary }}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="12"
                  absolute={false}
                />
                <Text style={styles.chartSubtitle}>
                  Total: {formatCurrency(totalMonthlySpend, selectedAccount?.currency ?? 'DOP')}
                </Text>
                {Object.entries(monthlySpend).filter(([, v]) => v > 0).map(([cat, spent], i) => (
                  <View key={cat} style={styles.catRow}>
                    <View style={[styles.catDot, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
                    <Text style={styles.catName}>{cat}</Text>
                    <Text style={styles.catAmount}>{formatCurrency(spent, selectedAccount?.currency ?? 'DOP')}</Text>
                    <Text style={styles.catPct}>
                      {totalMonthlySpend > 0 ? Math.round((spent / totalMonthlySpend) * 100) : 0}%
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="pie-chart-outline" size={64} color={COLORS.border} />
                <Text style={styles.emptyText}>Sin gastos este mes</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'budgets' && (
          <View>
            {budgets.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="wallet-outline" size={64} color={COLORS.border} />
                <Text style={styles.emptyText}>Sin presupuestos</Text>
                <Text style={styles.emptySub}>Define límites de gasto por categoría</Text>
              </View>
            ) : (
              budgets.map(b => {
                const usage = budgetUsage(b.category);
                const pct = usage?.pct ?? 0;
                const barColor = pct >= 100 ? COLORS.error : pct >= 75 ? COLORS.warning : COLORS.success;
                return (
                  <View key={b.id} style={styles.budgetCard}>
                    <View style={styles.budgetHeader}>
                      <Text style={styles.budgetCat}>{b.category}</Text>
                      <TouchableOpacity onPress={() => deleteBudget(b.id)}>
                        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                    <ProgressBar progress={Math.min(pct / 100, 1)} color={barColor} style={styles.budgetBar} />
                    <View style={styles.budgetFooter}>
                      <Text style={styles.budgetSpent}>{formatCurrency(usage?.spent ?? 0, selectedAccount?.currency ?? 'DOP')}</Text>
                      <Text style={styles.budgetLimit}>/ {formatCurrency(b.limitAmount, selectedAccount?.currency ?? 'DOP')}</Text>
                      {pct >= 90 && (
                        <View style={styles.alertBadge}>
                          <Text style={styles.alertText}>{pct >= 100 ? '⚠️ Superado' : '⚠️ Cerca'}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB buttons */}
      <View style={styles.fabRow}>
        {activeTab === 'budgets' ? (
          <FAB icon="plus" style={styles.fab} color="#fff" onPress={() => setBudgetModal(true)} />
        ) : (
          <>
            <TouchableOpacity style={[styles.quickFab, { backgroundColor: COLORS.success }]} onPress={() => openTx('income')}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.quickFabText}>Ingreso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickFab, { backgroundColor: COLORS.error }]} onPress={() => openTx('expense')}>
              <Ionicons name="remove" size={20} color="#fff" />
              <Text style={styles.quickFabText}>Gasto</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Add Transaction Modal */}
      <Modal visible={txModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalSheet} keyboardShouldPersistTaps="handled">
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{txType === 'income' ? '💚 Ingreso' : '❤️ Gasto'}</Text>

            <TextInput
              label="Monto *"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
              style={styles.input}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text={selectedAccount?.currency === 'DOP' ? 'RD$' : '$'} />}
            />

            <Text style={styles.fieldLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {(txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                  <Chip key={c} selected={category === c} onPress={() => setCategory(c)} selectedColor={COLORS.accent} compact style={{ marginRight: 6 }}>
                    {c}
                  </Chip>
                ))}
              </View>
            </ScrollView>

            <TextInput
              label="Descripción"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
              style={styles.input}
            />

            {txType === 'expense' && (
              <TextInput
                label="Cuotas (1 = sin cuotas)"
                value={installments}
                onChangeText={setInstallments}
                mode="outlined"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.accent}
                style={styles.input}
                keyboardType="numeric"
              />
            )}

            <View style={styles.modalActions}>
              <Button onPress={() => setTxModal(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleAddTx} buttonColor={txType === 'income' ? COLORS.success : COLORS.error}>
                Guardar
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Account Modal */}
      <Modal visible={accModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Nueva Cuenta</Text>

            <TextInput label="Nombre *" value={accName} onChangeText={setAccName} mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.accent} style={styles.input} />

            <Text style={styles.fieldLabel}>Moneda</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {CURRENCIES.map(c => (
                  <Chip key={c} selected={accCurrency === c} onPress={() => setAccCurrency(c)} selectedColor={COLORS.accent} compact style={{ marginRight: 6 }}>
                    {c}
                  </Chip>
                ))}
              </View>
            </ScrollView>

            <TextInput label="Saldo inicial" value={accBalance} onChangeText={setAccBalance} mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.accent} style={styles.input} keyboardType="decimal-pad" />

            <View style={styles.modalActions}>
              <Button onPress={() => setAccModal(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleAddAccount} buttonColor={COLORS.primary}>Crear</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Budget Modal */}
      <Modal visible={budgetModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Nuevo Presupuesto</Text>

            <Text style={styles.fieldLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {EXPENSE_CATEGORIES.map(c => (
                  <Chip key={c} selected={budgetCategory === c} onPress={() => setBudgetCategory(c)} selectedColor={COLORS.accent} compact style={{ marginRight: 6 }}>
                    {c}
                  </Chip>
                ))}
              </View>
            </ScrollView>

            <TextInput label="Límite mensual *" value={budgetLimit} onChangeText={setBudgetLimit} mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.accent} style={styles.input} keyboardType="decimal-pad" />

            <View style={styles.modalActions}>
              <Button onPress={() => setBudgetModal(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleAddBudget} buttonColor={COLORS.primary}>Crear</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  accountBar: { backgroundColor: COLORS.primary, paddingVertical: 8 },
  accountScroll: { paddingHorizontal: 12, gap: 8 },
  accountChip: {
    backgroundColor: '#ffffff15',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ffffff20',
    minWidth: 120,
    alignItems: 'center',
  },
  accountChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  accountChipText: { fontSize: 12, fontWeight: '600', color: '#aaa' },
  accountBalance: { fontSize: 15, fontWeight: '800', color: '#fff', marginTop: 2 },
  addAccountChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  summaryRow: { flexDirection: 'row', gap: 10, padding: 12 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12, gap: 3 },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  summaryAmount: { fontSize: 15, fontWeight: '800' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },
  scroll: { padding: 12 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  emptySub: { fontSize: 13, color: COLORS.textSecondary },
  chartTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  chartSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, textAlign: 'center' },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
  catAmount: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  catPct: { fontSize: 12, color: COLORS.textSecondary, width: 36, textAlign: 'right' },
  budgetCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 8 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetCat: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  budgetBar: { height: 8, borderRadius: 4 },
  budgetFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  budgetSpent: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  budgetLimit: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  alertBadge: { backgroundColor: '#FF980020', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  alertText: { fontSize: 11, color: '#FF9800', fontWeight: '600' },
  fabRow: { position: 'absolute', right: 16, bottom: 16, flexDirection: 'row', gap: 10 },
  fab: { backgroundColor: COLORS.primary },
  quickFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickFabText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 50, gap: 10 },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  input: { backgroundColor: '#fff' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', paddingBottom: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
