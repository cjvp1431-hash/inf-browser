import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Account } from '../types';
import { COLORS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';

interface Props {
  tx: Transaction;
  account?: Account;
  onDelete: (id: string, accountId: string, type: string, amount: number) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Comida: 'fast-food',
  Transporte: 'car',
  Salud: 'medical',
  Educación: 'school',
  Ropa: 'shirt',
  Entretenimiento: 'game-controller',
  'Suscripción': 'repeat',
  Salario: 'briefcase',
  Freelance: 'laptop',
  Inversión: 'trending-up',
  Otro: 'ellipse',
};

export default function TransactionCard({ tx, account, onDelete }: Props) {
  const isIncome = tx.type === 'income';
  const iconName = (CATEGORY_ICONS[tx.category] || 'receipt-outline') as any;
  const color = isIncome ? COLORS.success : COLORS.error;
  const bgColor = isIncome ? '#4CAF5015' : '#F4433615';

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={20} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.category}>{tx.category}</Text>
        <Text style={styles.desc} numberOfLines={1}>
          {tx.description || formatDate(tx.date)}
          {tx.totalInstallments > 1 ? ` · ${tx.installmentNumber}/${tx.totalInstallments}` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color }]}>
          {isIncome ? '+' : '-'}{formatCurrency(tx.amount, account?.currency ?? 'DOP')}
        </Text>
        <Text style={styles.date}>{formatDate(tx.date)}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onDelete(tx.id, tx.accountId, tx.type, tx.amount)}
        style={styles.delBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={15} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  category: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  desc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 14, fontWeight: '700' },
  date: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  delBtn: { padding: 6 },
});
