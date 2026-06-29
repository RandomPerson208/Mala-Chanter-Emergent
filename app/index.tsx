import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getColors, spacing, radius } from '@/src/theme';
import {
  getSettings,
  saveSettings,
  Settings,
  getMantras,
  Mantra,
  DEFAULT_MANTRAS,
  getCurrentCount,
  setCurrentCount,
  addHistoryEntry,
} from '@/src/storage';

const BEADS = 108;
const TICK_URI =
  'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg';
const BELL_URI =
  'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg';

const colors = getColors('dark');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CounterScreen() {
  const insets = useSafeAreaInsets();
  const [count, setCount] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [mantras, setMantras] = useState<Mantra[]>(DEFAULT_MANTRAS);
  const [showEdit, setShowEdit] = useState(false);
  const [editValue, setEditValue] = useState('0');
  const [showSettings, setShowSettings] = useState(false);
  const [showMantraPicker, setShowMantraPicker] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const sessionStart = useRef<number>(Date.now());

  const tickPlayer = useAudioPlayer({ uri: TICK_URI });
  const bellPlayer = useAudioPlayer({ uri: BELL_URI });

  const ringScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const numberScale = useSharedValue(1);

  // Load persisted state
  useEffect(() => {
    (async () => {
      const [s, ms, c] = await Promise.all([getSettings(), getMantras(), getCurrentCount()]);
      setSettings(s);
      setMantras(ms);
      setCount(c);
    })();
  }, []);

  // Reload mantras list when screen focuses (in case user added a custom one)
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [s, ms] = await Promise.all([getSettings(), getMantras()]);
        setSettings(s);
        setMantras(ms);
      })();
    }, [])
  );

  const activeMantra = useMemo(() => {
    if (!settings) return DEFAULT_MANTRAS[0];
    return mantras.find((m) => m.id === settings.selectedMantraId) || DEFAULT_MANTRAS[0];
  }, [mantras, settings]);

  const persistCount = (n: number) => {
    setCount(n);
    setCurrentCount(n).catch(() => {});
  };

  const animateTap = () => {
    ringScale.value = withSequence(
      withTiming(1.03, { duration: 80, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 8, stiffness: 180 })
    );
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 90 }),
      withTiming(0.4, { duration: 360 })
    );
    numberScale.value = withSequence(
      withTiming(1.08, { duration: 90 }),
      withSpring(1, { damping: 7, stiffness: 200 })
    );
  };

  const handleTap = async () => {
    if (!settings) return;

    animateTap();

    const next = count + 1;

    if (settings.hapticsEnabled && Platform.OS !== 'web') {
      Haptics.impactAsync(
        next === BEADS ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
      ).catch(() => {});
    }

    if (settings.soundEnabled) {
      try {
        if (next === BEADS) {
          bellPlayer.seekTo(0);
          bellPlayer.play();
        } else {
          tickPlayer.seekTo(0);
          tickPlayer.play();
        }
      } catch {}
    }

    if (next >= BEADS) {
      // Complete mala
      const entry = {
        id: `h-${Date.now()}`,
        mantraId: activeMantra.id,
        mantraName: activeMantra.name,
        malaCount: 1,
        beadCount: BEADS,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - sessionStart.current,
      };
      await addHistoryEntry(entry);
      if (settings.hapticsEnabled && Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setShowCelebrate(true);
      persistCount(0);
      sessionStart.current = Date.now();
      setTimeout(() => setShowCelebrate(false), 2200);
    } else {
      persistCount(next);
    }
  };

  const handleReset = () => {
    if (settings?.hapticsEnabled && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    persistCount(0);
    sessionStart.current = Date.now();
  };

  const openEdit = () => {
    setEditValue(String(count));
    setShowEdit(true);
  };

  const submitEdit = () => {
    const n = Math.max(0, Math.min(BEADS - 1, parseInt(editValue, 10) || 0));
    persistCount(n);
    setShowEdit(false);
  };

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const numStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Circle progress
  const size = 320;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress = count / BEADS;
  const strokeDashoffset = circumference * (1 - progress);

  if (!settings) {
    return <View style={[styles.root, { backgroundColor: colors.surface }]} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]} testID="counter-screen">
      {/* Background image */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1538024333176-f25f63f873ee?crop=entropy&cs=srgb&fm=jpg&q=85',
        }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(20,19,17,0.55)', 'rgba(20,19,17,0.85)', 'rgba(20,19,17,0.98)']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.brand} testID="app-title">ZenMala</Text>
        <Pressable
          onPress={() => setShowSettings(true)}
          style={styles.iconBtn}
          testID="settings-button">
          <Ionicons name="settings-outline" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      {/* Big tap area */}
      <Pressable
        style={styles.tapArea}
        onPress={handleTap}
        testID="bead-tap-area"
        accessibilityLabel="Tap to count one bead">
        <Animated.View style={[styles.ringWrap, ringStyle]}>
          {/* Glow */}
          <Animated.View style={[styles.glow, glowStyle]} />
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.brandSecondary} stopOpacity="0.06" />
                <Stop offset="100%" stopColor={colors.brandSecondary} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={cx} cy={cy} r={r} fill="url(#centerGlow)" />
            {/* Track */}
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={colors.surfaceTertiary}
              strokeWidth={stroke}
              fill="none"
              opacity={0.5}
            />
            {/* Progress */}
            <AnimatedCircle
              cx={cx}
              cy={cy}
              r={r}
              stroke={colors.brandSecondary}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
            {/* Bead dots around the ring */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
              const bx = cx + r * Math.cos(angle);
              const by = cy + r * Math.sin(angle);
              return (
                <Circle
                  key={i}
                  cx={bx}
                  cy={by}
                  r={2.5}
                  fill={colors.brandPrimary}
                  opacity={0.6}
                />
              );
            })}
          </Svg>

          {/* Inner content */}
          <View style={[styles.ringInner, { pointerEvents: 'none' }]}>
            <Text style={styles.beadLabel}>BEAD</Text>
            <Animated.Text style={[styles.count, numStyle]} testID="count-text">
              {count}
            </Animated.Text>
            <Text style={styles.outOf}>of {BEADS}</Text>
          </View>
        </Animated.View>
      </Pressable>

      {/* Mantra display - positioned ABOVE actions row */}
      <View style={[styles.mantraPillWrap, { bottom: insets.bottom + 170 }]}>
        <Pressable
          onPress={() => setShowMantraPicker(true)}
          style={styles.mantraPill}
          testID="mantra-pill">
          {activeMantra.devanagari ? (
            <Text style={styles.mantraDeva}>{activeMantra.devanagari}</Text>
          ) : null}
          <Text style={styles.mantraName} testID="active-mantra-name">{activeMantra.name}</Text>
          <Text style={styles.mantraHint}>Tap to change</Text>
        </Pressable>
      </View>

      {/* Floating actions */}
      <View style={[styles.actionsRow, { bottom: insets.bottom + 92 }]}>
        <View style={styles.actionsCard}>
          <Pressable style={styles.actionBtn} onPress={handleReset} testID="reset-button">
            <Ionicons name="refresh" size={18} color={colors.onSurface} />
            <Text style={styles.actionText}>Reset</Text>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable style={styles.actionBtn} onPress={openEdit} testID="edit-count-button">
            <Ionicons name="create-outline" size={18} color={colors.onSurface} />
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable
            style={styles.actionBtn}
            onPress={handleTap}
            testID="manual-increment-button">
            <Ionicons name="add" size={20} color={colors.brandSecondary} />
            <Text style={[styles.actionText, { color: colors.brandSecondary }]}>+1</Text>
          </Pressable>
        </View>
      </View>

      {/* Edit Modal */}
      <Modal visible={showEdit} transparent animationType="fade" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} testID="edit-modal">
            <Text style={styles.modalTitle}>Edit count</Text>
            <Text style={styles.modalSub}>Set to any number from 0 to {BEADS - 1} (107)</Text>
            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="number-pad"
              style={styles.input}
              autoFocus
              testID="edit-count-input"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => setShowEdit(false)}
                testID="edit-cancel">
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={submitEdit}
                testID="edit-confirm">
                <Text style={styles.modalBtnPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} testID="settings-modal">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <Pressable onPress={() => setShowSettings(false)} testID="settings-close">
                <Ionicons name="close" size={22} color={colors.onSurface} />
              </Pressable>
            </View>
            <SettingRow
              label="Haptic feedback"
              value={settings.hapticsEnabled}
              onToggle={async (v) => {
                const next = { ...settings, hapticsEnabled: v };
                setSettings(next);
                await saveSettings(next);
              }}
              testID="toggle-haptics"
            />
            <SettingRow
              label="Sound on tap"
              value={settings.soundEnabled}
              onToggle={async (v) => {
                const next = { ...settings, soundEnabled: v };
                setSettings(next);
                await saveSettings(next);
              }}
              testID="toggle-sound"
            />
          </View>
        </View>
      </Modal>

      {/* Mantra picker (quick) */}
      <Modal
        visible={showMantraPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMantraPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '75%' }]} testID="mantra-picker-modal">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Mantra</Text>
              <Pressable onPress={() => setShowMantraPicker(false)} testID="mantra-picker-close">
                <Ionicons name="close" size={22} color={colors.onSurface} />
              </Pressable>
            </View>
            <ScrollView>
              {mantras.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={async () => {
                    const next = { ...settings, selectedMantraId: m.id };
                    setSettings(next);
                    await saveSettings(next);
                    if (Platform.OS !== 'web') {
                      Haptics.selectionAsync().catch(() => {});
                    }
                    setShowMantraPicker(false);
                  }}
                  style={[
                    styles.mantraRow,
                    m.id === settings.selectedMantraId && styles.mantraRowActive,
                  ]}
                  testID={`mantra-option-${m.id}`}>
                  <View style={{ flex: 1 }}>
                    {m.devanagari ? <Text style={styles.mantraRowDeva}>{m.devanagari}</Text> : null}
                    <Text style={styles.mantraRowName}>{m.name}</Text>
                    {m.meaning ? <Text style={styles.mantraRowMeaning}>{m.meaning}</Text> : null}
                  </View>
                  {m.id === settings.selectedMantraId ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.brandSecondary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Celebrate overlay */}
      {showCelebrate ? (
        <View style={[styles.celebrate, { pointerEvents: 'none' }]} testID="celebrate-overlay">
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.celebrateInner}>
            <Ionicons name="flame" size={48} color={colors.brandSecondary} />
            <Text style={styles.celebrateTitle}>Mala Complete</Text>
            <Text style={styles.celebrateSub}>108 beads chanted</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function SettingRow({
  label,
  value,
  onToggle,
  testID,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  testID?: string;
}) {
  return (
    <Pressable onPress={() => onToggle(!value)} style={styles.settingRow} testID={testID}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  brand: {
    color: colors.onSurface,
    fontSize: 22,
    letterSpacing: 2,
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tapArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  ringWrap: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.brandSecondary,
    opacity: 0.08,
  },
  ringInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beadLabel: {
    color: colors.onSurfaceTertiary,
    fontSize: 11,
    letterSpacing: 4,
    marginBottom: 4,
  },
  count: {
    color: colors.onSurface,
    fontSize: 96,
    fontWeight: '300',
    lineHeight: 104,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  outOf: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
    letterSpacing: 1,
    marginTop: 2,
  },
  mantraPill: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  mantraPillWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mantraDeva: {
    color: colors.brandSecondary,
    fontSize: 22,
    marginBottom: 2,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  mantraName: {
    color: colors.onSurface,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  mantraHint: {
    color: colors.onSurfaceTertiary,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  actionsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  actionsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(32,30,27,0.85)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  actionText: { color: colors.onSurface, fontSize: 13, fontWeight: '500' },
  actionDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  modalSub: { color: colors.onSurfaceTertiary, fontSize: 12, marginTop: spacing.xs },
  input: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.onSurface,
    fontSize: 22,
    textAlign: 'center',
    backgroundColor: colors.surface,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minWidth: 92,
    alignItems: 'center',
  },
  modalBtnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong },
  modalBtnGhostText: { color: colors.onSurface },
  modalBtnPrimary: { backgroundColor: colors.brandPrimary },
  modalBtnPrimaryText: { color: colors.onBrandPrimary, fontWeight: '600' },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingLabel: { color: colors.onSurface, fontSize: 15 },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceTertiary,
    justifyContent: 'center',
    padding: 3,
  },
  toggleOn: { backgroundColor: colors.brandPrimary },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.onSurface,
  },
  toggleKnobOn: { alignSelf: 'flex-end' },

  mantraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  mantraRowActive: { backgroundColor: 'rgba(214,97,68,0.12)' },
  mantraRowDeva: {
    color: colors.brandSecondary,
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  mantraRowName: { color: colors.onSurface, fontSize: 15, marginTop: 2 },
  mantraRowMeaning: { color: colors.onSurfaceTertiary, fontSize: 12, marginTop: 2 },

  celebrate: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrateInner: {
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(32,30,27,0.95)',
    borderWidth: 1,
    borderColor: colors.brandSecondary,
  },
  celebrateTitle: {
    color: colors.onSurface,
    fontSize: 28,
    marginTop: spacing.md,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  celebrateSub: { color: colors.onSurfaceTertiary, marginTop: spacing.xs, letterSpacing: 1 },
});
