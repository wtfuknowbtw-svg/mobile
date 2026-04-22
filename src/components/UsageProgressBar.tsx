import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface UsageProgressBarProps {
  current: number;
  limit: number;
  label: string;
  showWarning?: boolean;
  color?: string;
}

export default function UsageProgressBar({
  current,
  limit,
  label,
  showWarning = false,
  color = COLORS.primary,
}: UsageProgressBarProps) {
  const progress = limit === Infinity ? 100 : Math.min((current / limit) * 100, 100);
  const isNearLimit = limit !== Infinity && progress >= 80;
  const isAtLimit = limit !== Infinity && progress >= 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[
          styles.count,
          isNearLimit && styles.warningText,
          isAtLimit && styles.dangerText,
        ]}>
          {limit === Infinity ? `${current} used` : `${current}/${limit}`}
        </Text>
      </View>
      
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: isAtLimit ? COLORS.danger : isNearLimit ? COLORS.warning : color,
            },
          ]}
        />
      </View>
      
      {showWarning && isNearLimit && (
        <Text style={styles.warningMessage}>
          {isAtLimit 
            ? `You've reached the ${label.toLowerCase()} limit` 
            : `You're approaching the ${label.toLowerCase()} limit`
          }
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  warningText: {
    color: COLORS.warning,
  },
  dangerText: {
    color: COLORS.danger,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  warningMessage: {
    fontSize: 12,
    color: COLORS.warning,
    marginTop: 4,
    textAlign: 'center',
  },
});
