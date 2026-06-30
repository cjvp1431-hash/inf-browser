import React, { useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, Modal,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, Button, Surface, FAB, Chip, SegmentedButtons } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../store/financeStore';
import { COLORS, CURRENCIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';
import { formatCurrency, formatDate, getTodayString } from '../utils/formatters';
import { Transaction } from '../database/database';

type TxType = 'income' | 'expense';

export default function FinanceScreen() {
  const { accounts, transactions, selectedAccountId, addTransaction, deleteTransaction, setSelectedAccount, addAccount } = useFinanceStore();

  const [txModal, setTxModal] = useState(false);
  const [accModal, setAccModal] = useState(false);

  // Transaction form
  const [txType, setTxType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Otro');
  const [description, setDescription] = useState('');

  // Account form
  const [accName, setAccName] = useState('');
  const [accCurrency, setAccCurrency] = useState('USD');
  const [accBalance, setAccBalance] = useState('0');

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const filteredTx = selectedAccountId
    ? transactions.filter(t => t.accountId === selectedAccountId)
    : transactions;

  const openTxModal = (type: TxType = 'expense') => {
    setTxType(type);
    setAmount('');
    setCategory('Otro');
    setDescription('');
    setTxModal(true);
  };

  const handleAddTx = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || !selectedAccountId) return;
    await addTransaction({
      accountId: selectedAccountId,
      type: txType,
      amount: parsed,
      category,
      description,
      date: getTodayString(),
      installments: 1,
    });
    setTxModal(false);
  };

  const handleAddAccount = async () => {
    if (!accName.trim()) return;
    await addAccount({
      name: accName.trim(),
      type: 'checking',
      currency: accCurrency,
      balance: parseFloat(accBalance) || 0,
    });
    setAccModal(false);
  };

  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const renderTx = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const acc = accounts.find(a => a.id === item.accountId);
    return (
      <Surface style={styles.txCard} elevation={1}>
        <View style={[styles.txIcon, { backgroundColor: isIncome ? '#4CAF5020' : '#F4433620' }]}>
          <Ionicons
            name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}
            size={22}
            color={isIncome ? COLORS.success : COLORS.error}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txCategory}>{item.category}</Text>
          <Text style={styles.txDesc}>{item.description || formatDate(item.date)}</Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isIncome ? COLORS.success : COLORS.error }]}>
            {isIncome ? '+' : '-'}{formatCurrency(item.amount, acc?.currency || 'USD')}
          </Text>
          <TouchableOpacity onPress={() => deleteTransaction(item.id, item.accountId, item.type, item.amount)}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      {/* Accounts Header */}
      <View style={styles.header}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
          {accounts.map(acc => (
            <TouchableOpacity
              key={acc.id}
              style={[styles.accountCard, acc.id === selectedAccountId && styles.accountCardSelected]}
              onPress={() => setSelectedAccount(acc.id)}
            >
              <Text style={[styles.accountName, acc.id === selectedAccountId && styles.accountNameSelected]}>
                {acc.name}
              </Text>
              <Text style={[styles.accountBalance, acc.id === selectedAccountId && styles.accountBalanceSelected]}>
                {formatCurrency(acc.balance, acc.currency)}
              </Text>
              <Text style={[styles.accountCurrency, acc.id === selectedAccountId && styles.accountCurrencySelected]}>
                {acc.currency} · {acc.type}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addAccountBtn} onPress={() => setAccModal(true)}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.accent} />
            <Text style={styles.addAccountText}>Nueva{'\n'}Cuenta</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.actionBtns}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF5020' }]} onPress={() => openTxModal('income')}>
            <Ionicons name="arrow-down-circle" size={20} color={COLORS.success} />
            <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Ingreso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F4433620' }]} onPress={() => openTxModal('expense')}>
            <Ionicons name="arrow-up-circle" size={20} color={COLORS.error} />
            <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Gasto</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions */}
      <Text style={styles.txTitle}>Movimientos recientes</Text>
      <FlatList
        data={filteredTx.slice(0, 30)}
        keyExtractor={i => i.id}
        renderItem={renderTx}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>Sin movimientos aún</Text>
          </View>
        }
      />

      {/* Add Transaction Modal */}
      <Modal visible={txModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nuevo movimiento</Text>

            <SegmentedButtons
              value={txType}
              onValueChange={v => { setTxType(v as TxType); setCategory('Otro'); }}
              buttons={[
                { value: 'expense', label: 'Gasto', checkedColor: COLORS.error },
                { value: 'income', label: 'Ingreso', checkedColor: COLORS.success },
              ]}
            />

            <TextInput
              label="Monto *"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text={selectedAccount?.currency === 'EUR' ? '€' : '$'} />}
            />

            <TextInput
              label="Descripción"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
            />

            <Text style={styles.fieldLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {categories.map(c => (
                <Chip
                  key={c}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                  selectedColor={COLORS.accent}
                  compact
                  style={styles.chip}
                >
                  {c}
                </Chip>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button onPress={() => setTxModal(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleAddTx} buttonColor={txType === 'income' ? COLORS.success : COLORS.error}>
                Guardar
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Account Modal */}
      <Modal visible={accModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nueva Cuenta</Text>

            <TextInput
              label="Nombre de la cuenta *"
              value={accName}
              onChangeText={setAccName}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
            />

            <TextInput
              label="Balance inicial"
              value={accBalance}
              onChangeText={setAccBalance}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
              keyboardType="decimal-pad"
            />

            <Text style={styles.fieldLabel}>Moneda</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CURRENCIES.map(c => (
                <Chip
                  key={c}
                  selected={accCurrency === c}
                  onPress={() => setAccCurrency(c)}
                  selectedColor={COLORS.accent}
                  compact
                  style={styles.chip}
                >
                  {c}
                </Chip>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button onPress={() => setAccModal(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleAddAccount} buttonColor={COLORS.primary}>Crear</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 16, paddingBottom: 16 },
  accountScroll: { paddingHorizontal: 12, marginBottom: 12 },
  accountCard: {
    backgroundColor: '#ffffff20',
    borderRadius: 16,
    padding: 16,
    marginRight: 10,
    minWidth: 160,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accountCardSelected: { backgroundColor: COLORS.accent + '30', borderColor: COLORS.accent },
  accountName: { fontSize: 13, color: '#aaa', fontWeight: '600' },
  accountNameSelected: { color: COLORS.accent },
  accountBalance: { fontSize: 26, fontWeight: '800', color: '#fff', marginVertical: 4 },
  accountBalanceSelected: { color: '#fff' },
  accountCurrency: { fontSize: 11, color: '#888' },
  accountCurrencySelected: { color: '#aaa' },
  addAccountBtn: { alignItems: 'center', justifyContent: 'center', padding: 16, minWidth: 80, gap: 4 },
  addAccountText: { fontSize: 12, color: COLORS.accent, textAlign: 'center' },
  actionBtns: { flexDirection: 'row', paddingHorizontal: 12, gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
  },
  actionBtnText: { fontWeight: '700', fontSize: 14 },
  txTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, margin: 16, marginBottom: 8 },
  list: { paddingHorizontal: 12, paddingBottom: 100, gap: 8 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  txDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    gap: 10,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  input: { backgroundColor: '#fff' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipRow: { maxHeight: 44 },
  chip: { marginRight: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
