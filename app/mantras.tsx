import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getColors, spacing, radius } from '@/src/theme';
import {
  getMantras,
  addCustomMantra,
  deleteCustomMantra,
  getSettings,
  saveSettings,
  Mantra,
  Settings,
} from '@/src/storage';

const colors = getColors('dark');

export default function MantrasScreen() {
  const insets = useSafeAreaInsets();
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDeva, setNewDeva] = useState('');
  const [newMeaning, setNewMeaning] = useState('');

  const refresh = useCallback(async () => {
    const [ms, s] = await Promise.all([getMantras(), getSettings()]);
    setMantras(ms);
    setSettings(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const select = async (id: string) => {
    if (!settings) return;
    const next = { ...settings, selectedMantraId: id };
    setSettings(next);
    await saveSettings(next);
  };

  const submitAdd = async () => {
    if (!newName.trim()) return;
    await addCustomMantra({
      name: newName.trim(),
      devanagari: newDeva.trim() || undefined,
      meaning: newMeaning.trim() || undefined,
    });
    setNewName('');
    setNewDeva('');
    setNewMeaning('');
    setShowAdd(false);
    refresh();
  };

  const handleDelete = (m: Mantra) => {
    Alert.alert?.('Delete mantra', `Remove "${m.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomMantra(m.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="mantras-screen">
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>LIBRARY</Text>
          <Text style={styles.title}>Mantras</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowAdd(true)}
          testID="add-mantra-button">
          <Ionicons name="add" size={20} color={colors.onBrandPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 110, paddingHorizontal: spacing.lg }}>
        {mantras.map((m) => {
          const isSelected = settings?.selectedMantraId === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => select(m.id)}
              onLongPress={() => (m.isCustom ? handleDelete(m) : undefined)}
              style={[styles.card, isSelected && styles.cardActive]}
              testID={`mantra-card-${m.id}`}>
              <View style={{ flex: 1 }}>
                {m.devanagari ? <Text style={styles.cardDeva}>{m.devanagari}</Text> : null}
                <Text style={styles.cardName}>{m.name}</Text>
                {m.meaning ? <Text style={styles.cardMeaning}>{m.meaning}</Text> : null}
                {m.isCustom ? <Text style={styles.customTag}>CUSTOM • long press to delete</Text> : null}
              </View>
              <View style={styles.selectIndicator}>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={26} color={colors.brandSecondary} />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color={colors.onSurfaceTertiary} />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}>
          <View style={styles.modalCard} testID="add-mantra-modal">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add custom mantra</Text>
              <Pressable onPress={() => setShowAdd(false)} testID="add-mantra-close">
                <Ionicons name="close" size={22} color={colors.onSurface} />
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Om Shanti"
              placeholderTextColor={colors.onSurfaceTertiary}
              style={styles.input}
              testID="new-mantra-name"
            />
            <Text style={styles.fieldLabel}>Sanskrit / Devanagari (optional)</Text>
            <TextInput
              value={newDeva}
              onChangeText={setNewDeva}
              placeholder="ॐ शान्ति"
              placeholderTextColor={colors.onSurfaceTertiary}
              style={styles.input}
              testID="new-mantra-deva"
            />
            <Text style={styles.fieldLabel}>Meaning (optional)</Text>
            <TextInput
              value={newMeaning}
              onChangeText={setNewMeaning}
              placeholder="The peace that surpasses understanding."
              placeholderTextColor={colors.onSurfaceTertiary}
              style={styles.input}
              testID="new-mantra-meaning"
              multiline
            />
            <Pressable
              style={[styles.saveBtn, !newName.trim() && { opacity: 0.5 }]}
              disabled={!newName.trim()}
              onPress={submitAdd}
              testID="save-mantra-button">
              <Text style={styles.saveBtnText}>Save mantra</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  title: {
    color: colors.onSurface,
    fontSize: 36,
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cardActive: {
    borderColor: colors.brandSecondary,
    backgroundColor: 'rgba(214,97,68,0.06)',
  },
  cardDeva: {
    color: colors.brandSecondary,
    fontSize: 22,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  cardName: {
    color: colors.onSurface,
    fontSize: 17,
    fontWeight: '500',
  },
  cardMeaning: {
    color: colors.onSurfaceTertiary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  customTag: {
    color: colors.brandSecondary,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 6,
  },
  selectIndicator: { paddingLeft: spacing.md },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  fieldLabel: {
    color: colors.onSurfaceTertiary,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.onSurface,
    fontSize: 15,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.onBrandPrimary, fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
});
