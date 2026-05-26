import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { formatCurrency } from '../utils/currency';

interface InvoiceItemRowProps {
  itemName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  onDelete?: () => void;
  showDelete?: boolean;
}

export default function InvoiceItemRow({
  itemName,
  quantity,
  unit,
  pricePerUnit,
  totalPrice,
  onDelete,
  showDelete = false,
}: InvoiceItemRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>
          {itemName}
        </Text>
        <Text style={styles.itemDetails}>
          {quantity} {unit} × {formatCurrency(pricePerUnit)}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.totalPrice}>{formatCurrency(totalPrice)}</Text>
        {showDelete && onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  deleteButton: {
    padding: 4,
  },
});
