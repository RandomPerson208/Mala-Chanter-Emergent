import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getColors, spacing, radius } from '@/src/theme';
import { computeStats, getHistory, HistoryEntry } from '@/src/storage';

const colors = getColors('dark');

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, [])
  );

  const stats = computeStats(history);
  const maxWeekly = Math.max(1, ...stats.weekly.map((d) => d.malas));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="stats-screen">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + 110,
        }}>
        <Text style={styles.eyebrow}>YOUR JOURNEY</Text>
        <Text style={styles.title}>Stats</Text>

        {/* Streak card */}
        <View style={styles.streakCard} testID="streak-card">
          <Ionicons name="flame" size={42} color={colors.brandPrimary} />
          <Text style={styles.streakValue} testID="streak-value">{stats.streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>

        {/* Totals */}
        <View style={styles.statsRow}>
          <View style={styles.statCard} testID="total-malas-card">
            <Text style={styles.statValue}>{stats.totalMalas}</Text>
            <Text style={styles.statLabel}>Malas</Text>
          </View>
          <View style={styles.statCard} testID="total-beads-card">
            <Text style={styles.statValue}>{stats.totalBeads.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Beads</Text>
          </View>
        </View>

        {/* Weekly */}
        <Text style={styles.sectionTitle}>This week</Text>
        <View style={styles.chartCard}>
          <View style={styles.chart}>
            {stats.weekly.map((d, i) => {
              const h = (d.malas / maxWeekly) * 110;
              return (
                <View key={i} style={styles.chartCol} testID={`weekly-bar-${i}`}>
                  <View style={[styles.chartBar, { height: Math.max(4, h) }]}>
                    {d.malas > 0 ? (
                      <Text style={styles.chartValue}>{d.malas}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.chartLabel}>{d.label.slice(0, 1)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {history.length === 0 ? (
          <View style={styles.empty} testID="stats-empty">
            <Ionicons name="leaf-outline" size={44} color={colors.brandSecondary} />
            <Text style={styles.emptyTitle}>Begin your practice</Text>
            <Text style={styles.emptySub}>Complete your first mala to see your progress here.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  eyebrow: {
    color: colors.brandSecondary,
    fontSize: 11,
    letterSpacing: 3,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.onSurface,
    fontSize: 36,
    fontWeight: '300',
    fontFamily: serif,
    marginBottom: spacing.xl,
  },
  streakCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakValue: {
    color: colors.onSurface,
    fontSize: 64,
    fontFamily: serif,
    marginTop: spacing.sm,
    fontWeight: '300',
  },
  streakLabel: {
    color: colors.onSurfaceTertiary,
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    color: colors.onSurface,
    fontSize: 30,
    fontFamily: serif,
    fontWeight: '400',
  },
  statLabel: {
    color: colors.onSurfaceTertiary,
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: 18,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    fontFamily: serif,
  },
  chartCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBar: {
    width: 18,
    backgroundColor: colors.brandPrimary,
    borderRadius: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  chartValue: { color: colors.onBrandPrimary, fontSize: 10, fontWeight: '600' },
  chartLabel: {
    color: colors.onSurfaceTertiary,
    fontSize: 11,
    marginTop: spacing.sm,
    letterSpacing: 1,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
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
});
