import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getColors, spacing, radius } from '@/src/theme';
import { clearHistory, getHistory, HistoryEntry } from '@/src/storage';

const colors = getColors('dark');
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms?: number) {
  if (!ms || ms < 1000) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${r}s`;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const refresh = useCallback(() => {
    getHistory().then(setHistory);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onClear = () => {
    Alert.alert?.('Clear history', 'This will delete all completed mala records.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="history-screen">
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>JOURNAL</Text>
          <Text style={styles.title}>History</Text>
        </View>
        {history.length > 0 ? (
          <Pressable style={styles.clearBtn} onPress={onClear} testID="clear-history-button">
            <Ionicons name="trash-outline" size={18} color={colors.onSurface} />
          </Pressable>
        ) : null}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty} testID="history-empty">
          <Ionicons name="time-outline" size={48} color={colors.brandSecondary} />
          <Text style={styles.emptyTitle}>No malas yet</Text>
          <Text style={styles.emptySub}>
            Your completed mala sessions will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + 110,
          }}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          renderItem={({ item }) => (
            <View style={styles.row} testID={`history-row-${item.id}`}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowDate}>{formatDate(item.completedAt)}</Text>
                <Text style={styles.rowTime}>{formatTime(item.completedAt)}</Text>
              </View>
              <View style={styles.rowMid}>
                <Text style={styles.rowMantra}>{item.mantraName}</Text>
                <Text style={styles.rowMeta}>
                  {item.beadCount} beads • {formatDuration(item.durationMs)}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Ionicons name="checkmark-circle" size={22} color={colors.brandSecondary} />
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: {
    color: colors.brandSecondary,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: spacing.xs,
  },
  title: { color: colors.onSurface, fontSize: 36, fontWeight: '300', fontFamily: serif },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
  emptyTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontFamily: serif,
    marginTop: spacing.md,
  },
  emptySub: {
    color: colors.onSurfaceTertiary,
    fontSize: 13,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 19,
  },
  divider: { height: 1, backgroundColor: colors.divider },
  row: { flexDirection: 'row', paddingVertical: spacing.lg, alignItems: 'center' },
  rowLeft: { width: 78 },
  rowDate: { color: colors.onSurface, fontSize: 13, fontWeight: '500' },
  rowTime: { color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 2 },
  rowMid: { flex: 1, paddingHorizontal: spacing.md },
  rowMantra: { color: colors.onSurface, fontSize: 15, fontFamily: serif },
  rowMeta: { color: colors.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
  rowRight: { paddingLeft: spacing.sm },
});
