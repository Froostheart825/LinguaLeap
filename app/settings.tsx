import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Switch, Modal, ActivityIndicator, Share, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '../hooks/useUser';
import { useAlert } from '@/template';
import { updateUser } from '../services/userService';
import { STORAGE_KEYS } from '../constants/config';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../constants/theme';

// ─── Extra storage keys used across the app ──────────────────────────────────
const ALL_CLEARABLE_KEYS = [
  STORAGE_KEYS.progress,
  STORAGE_KEYS.vocabulary_review,
  STORAGE_KEYS.xpHistory,
  'sm2_cards',
  'user_achievements',
  'streak_freeze_count',
  'weekly_xp',
  'last_reset_week',
  'notification_settings',
  'sound_enabled',
  'user_avatar',
];

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
];

const LANG_STORAGE_KEY = 'target_language';
const DARK_MODE_KEY = 'dark_mode_enabled';

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Row wrappers ─────────────────────────────────────────────────────────────
function SettingRow({ children, last = false }: { children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[styles.settingRow, !last && styles.settingRowBorder]}>
      {children}
    </View>
  );
}

// ─── Export modal ─────────────────────────────────────────────────────────────
interface ExportModalProps {
  visible: boolean;
  data: string;
  onClose: () => void;
}

function ExportModal({ visible, data, onClose }: ExportModalProps) {
  const handleShare = async () => {
    try {
      await Share.share({ message: data, title: 'LinguaLeap Data Export' });
    } catch {
      // user dismissed
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={styles.exportSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.exportHeader}>
          <Text style={styles.exportTitle}>📦 Data Export</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.exportClose}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.exportHint}>
          Your data is shown below. Tap "Share" to save or send it.
        </Text>
        <ScrollView style={styles.exportBox} nestedScrollEnabled>
          <Text style={styles.exportJson} selectable>
            {data}
          </Text>
        </ScrollView>
        <View style={styles.exportActions}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.exportShareBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.exportShareText}>📤 Share / Save</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.exportCancelBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.exportCancelText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Language picker modal ────────────────────────────────────────────────────
interface LanguagePickerProps {
  visible: boolean;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

function LanguagePicker({ visible, selected, onSelect, onClose }: LanguagePickerProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.pickerTitle}>Target Language</Text>
        <Text style={styles.pickerSub}>The language you are learning</Text>
        {LANGUAGE_OPTIONS.map(lang => {
          const isSelected = lang.code === selected;
          return (
            <Pressable
              key={lang.code}
              onPress={() => { onSelect(lang.code); onClose(); }}
              style={({ pressed }) => [
                styles.langOption,
                isSelected && styles.langOptionSelected,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>
                {lang.label}
              </Text>
              {isSelected && <Text style={styles.langCheck}>✓</Text>}
            </Pressable>
          );
        })}
        <View style={{ height: Spacing.lg }} />
      </View>
    </Modal>
  );
}

// ─── Main settings screen ─────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const { showAlert } = useAlert();

  // Account
  const [username, setUsername] = useState(user?.username ?? '');
  const [usernameEditing, setUsernameEditing] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const usernameRef = useRef<TextInput>(null);

  // Appearance
  const [darkMode, setDarkMode] = useState(false);

  // Language
  const [targetLang, setTargetLang] = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);

  // Data
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY).then(val => {
      if (val !== null) setDarkMode(val === 'true');
    });
    AsyncStorage.getItem(LANG_STORAGE_KEY).then(val => {
      if (val) setTargetLang(val);
    });
    if (user?.username) setUsername(user.username);
  }, [user?.username]);

  // ── Account ────────────────────────────────────────────────────────────────
  const handleEditUsername = () => {
    setUsernameEditing(true);
    setTimeout(() => usernameRef.current?.focus(), 80);
  };

  const handleSaveUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      showAlert('Invalid Name', 'Username cannot be empty.');
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      showAlert('Invalid Name', 'Username must be 2-20 characters.');
      return;
    }
    if (!user) return;
    setIsSavingUsername(true);
    try {
      await updateUser(user.id, { username: trimmed });
      await refreshUser();
      setUsernameEditing(false);
      showAlert('Saved', 'Username updated successfully.');
    } catch {
      showAlert('Error', 'Could not save username. Please try again.');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleCancelUsername = () => {
    setUsername(user?.username ?? '');
    setUsernameEditing(false);
  };

  // ── Appearance ─────────────────────────────────────────────────────────────
  const handleDarkModeToggle = async (val: boolean) => {
    setDarkMode(val);
    await AsyncStorage.setItem(DARK_MODE_KEY, String(val));
    // Dark mode implementation is a future enhancement — preference is saved
  };

  // ── Language ───────────────────────────────────────────────────────────────
  const handleSelectLang = async (code: string) => {
    setTargetLang(code);
    await AsyncStorage.setItem(LANG_STORAGE_KEY, code);
  };

  const selectedLangOption = LANGUAGE_OPTIONS.find(l => l.code === targetLang) ?? LANGUAGE_OPTIONS[0];

  // ── Data ───────────────────────────────────────────────────────────────────
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result: Record<string, unknown> = {};
      for (const key of Object.values(STORAGE_KEYS)) {
        const val = await AsyncStorage.getItem(key);
        result[key] = val ? JSON.parse(val) : null;
      }
      // Also add weekly/streak extras
      const extraKeys = ['weekly_xp', 'streak_freeze_count', 'user_avatar', LANG_STORAGE_KEY];
      for (const key of extraKeys) {
        const val = await AsyncStorage.getItem(key);
        result[key] = val;
      }
      const jsonStr = JSON.stringify(result, null, 2);
      setExportData(jsonStr);
      setShowExport(true);
    } catch {
      showAlert('Error', 'Failed to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearProgress = () => {
    showAlert(
      'Clear All Progress',
      'This will reset all lesson progress, XP history, achievements, and streak data. Your account will remain. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Progress',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await Promise.all(
                ALL_CLEARABLE_KEYS.map(key => AsyncStorage.removeItem(key))
              );
              // Reset user stats but keep account
              if (user) {
                await updateUser(user.id, {
                  totalXp: 0,
                  currentStreak: 0,
                  longestStreak: 0,
                  lastActiveDate: null,
                  todayXp: 0,
                  lessonsCompleted: 0,
                  wordsLearned: 0,
                  level: 1,
                });
                await refreshUser();
              }
              showAlert('Done', 'All progress has been cleared.');
            } catch {
              showAlert('Error', 'Failed to clear progress. Please try again.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear everything
              await AsyncStorage.clear();
              router.replace('/login');
            } catch {
              showAlert('Error', 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={8}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Account section ─────────────────────────────────────────── */}
        <SectionHeader title="Account" icon="👤" />
        <View style={[styles.card, Shadow.sm]}>

          {/* Email — read-only */}
          <SettingRow>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>📧</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue} numberOfLines={1}>{user?.email}</Text>
              </View>
            </View>
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyText}>Fixed</Text>
            </View>
          </SettingRow>

          {/* Username — editable */}
          <SettingRow last>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>✏️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Username</Text>
                {usernameEditing ? (
                  <TextInput
                    ref={usernameRef}
                    value={username}
                    onChangeText={setUsername}
                    style={styles.usernameInput}
                    maxLength={20}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveUsername}
                    placeholder="Enter username"
                    placeholderTextColor={Colors.textMuted}
                  />
                ) : (
                  <Text style={styles.rowValue}>{user?.username}</Text>
                )}
              </View>
            </View>

            {usernameEditing ? (
              <View style={styles.editActions}>
                <Pressable
                  onPress={handleCancelUsername}
                  style={({ pressed }) => [styles.editCancelBtn, pressed && { opacity: 0.7 }]}
                  hitSlop={4}
                >
                  <Text style={styles.editCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveUsername}
                  disabled={isSavingUsername}
                  style={({ pressed }) => [styles.editSaveBtn, pressed && { opacity: 0.85 }]}
                >
                  {isSavingUsername
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.editSaveText}>Save</Text>
                  }
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleEditUsername}
                style={({ pressed }) => [styles.editChip, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.editChipText}>Edit</Text>
              </Pressable>
            )}
          </SettingRow>
        </View>

        {/* ── Appearance section ───────────────────────────────────────── */}
        <SectionHeader title="Appearance" icon="🎨" />
        <View style={[styles.card, Shadow.sm]}>
          <SettingRow last>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🌙</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Dark Mode</Text>
                <Text style={styles.rowSubtitle}>
                  {darkMode ? 'Enabled — coming soon' : 'Light theme is active'}
                </Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: Colors.border, true: Colors.accentPurple }}
              thumbColor="#fff"
            />
          </SettingRow>
        </View>

        {/* ── Language section ─────────────────────────────────────────── */}
        <SectionHeader title="Language" icon="🌐" />
        <View style={[styles.card, Shadow.sm]}>
          <SettingRow>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>📚</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Learning</Text>
                <Text style={styles.rowSubtitle}>The language content in lessons</Text>
              </View>
            </View>
            <View style={[styles.readOnlyBadge, { backgroundColor: Colors.primaryBg, borderColor: Colors.primary + '55' }]}>
              <Text style={[styles.readOnlyText, { color: Colors.primary }]}>English 🇬🇧</Text>
            </View>
          </SettingRow>

          <SettingRow last>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>{selectedLangOption.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Your Native Language</Text>
                <Text style={styles.rowSubtitle}>Used for translations in exercises</Text>
              </View>
            </View>
            <Pressable
              onPress={() => setShowLangPicker(true)}
              style={({ pressed }) => [styles.langChip, pressed && { opacity: 0.75 }]}
            >
              <Text style={styles.langChipFlag}>{selectedLangOption.flag}</Text>
              <Text style={styles.langChipText}>{selectedLangOption.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </SettingRow>
        </View>

        {/* ── Data section ──────────────────────────────────────────────── */}
        <SectionHeader title="Data & Privacy" icon="📦" />
        <View style={[styles.card, Shadow.sm]}>

          {/* Export */}
          <SettingRow>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>📤</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Export My Data</Text>
                <Text style={styles.rowSubtitle}>Download all progress as JSON</Text>
              </View>
            </View>
            <Pressable
              onPress={handleExportData}
              disabled={isExporting}
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
            >
              {isExporting
                ? <ActivityIndicator size="small" color={Colors.accentBlue} />
                : <Text style={[styles.actionBtnText, { color: Colors.accentBlue }]}>Export</Text>
              }
            </Pressable>
          </SettingRow>

          {/* Clear Progress */}
          <SettingRow>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🔄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Clear All Progress</Text>
                <Text style={styles.rowSubtitle}>Reset lessons, XP, streaks, badges</Text>
              </View>
            </View>
            <Pressable
              onPress={handleClearProgress}
              disabled={isClearing}
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && { opacity: 0.8 }]}
            >
              {isClearing
                ? <ActivityIndicator size="small" color={Colors.error} />
                : <Text style={[styles.actionBtnText, { color: Colors.error }]}>Clear</Text>
              }
            </Pressable>
          </SettingRow>

          {/* Delete Account */}
          <SettingRow last>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🗑️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: Colors.error }]}>Delete Account</Text>
                <Text style={styles.rowSubtitle}>Permanently remove all data</Text>
              </View>
            </View>
            <Pressable
              onPress={handleDeleteAccount}
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && { opacity: 0.8 }]}
            >
              <Text style={[styles.actionBtnText, { color: Colors.error }]}>Delete</Text>
            </Pressable>
          </SettingRow>
        </View>

        {/* ── App info ──────────────────────────────────────────────────── */}
        <SectionHeader title="About" icon="ℹ️" />
        <View style={[styles.card, Shadow.sm]}>
          <SettingRow>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>📱</Text>
              <Text style={styles.rowLabel}>App Version</Text>
            </View>
            <Text style={styles.rowValue}>1.0.0</Text>
          </SettingRow>
          <SettingRow last>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🛡️</Text>
              <Text style={styles.rowLabel}>Data stored</Text>
            </View>
            <Text style={styles.rowValue}>On-device only</Text>
          </SettingRow>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Language Picker Modal */}
      <LanguagePicker
        visible={showLangPicker}
        selected={targetLang}
        onSelect={handleSelectLang}
        onClose={() => setShowLangPicker(false)}
      />

      {/* Export Data Modal */}
      <ExportModal
        visible={showExport}
        data={exportData}
        onClose={() => setShowExport(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  backArrow: { fontSize: FontSize.xl, color: Colors.textPrimary, fontWeight: FontWeight.bold, lineHeight: 26 },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  sectionIcon: { fontSize: FontSize.base },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.extrabold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Card
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },

  // Row
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: Spacing.md,
    gap: Spacing.sm, minHeight: 60,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  rowValue: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  rowSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  // Read-only badge
  readOnlyBadge: {
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  readOnlyText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },

  // Username editing
  usernameInput: {
    fontSize: FontSize.base, color: Colors.textPrimary,
    borderBottomWidth: 2, borderBottomColor: Colors.primary,
    paddingVertical: 2, marginTop: 2,
    fontWeight: FontWeight.semibold, minWidth: 120,
  },
  editActions: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  editCancelBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  editCancelText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  editSaveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
    minWidth: 52, alignItems: 'center', justifyContent: 'center',
  },
  editSaveText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  editChip: {
    backgroundColor: Colors.primaryBg, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: Colors.primary + '66',
  },
  editChipText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Language chip
  langChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  langChipFlag: { fontSize: 16 },
  langChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  chevron: { fontSize: FontSize.base, color: Colors.textMuted },

  // Action button
  actionBtn: {
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: Colors.accentBlue + '66',
    backgroundColor: Colors.accentBlueBg, minWidth: 60, alignItems: 'center',
  },
  actionBtnDanger: {
    borderColor: Colors.error + '66',
    backgroundColor: Colors.errorBg,
  },
  actionBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Language picker modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, gap: Spacing.sm,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm },
  pickerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center' },
  pickerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.sm },
  langOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  langOptionSelected: {
    borderColor: Colors.primary, backgroundColor: Colors.primaryBg,
  },
  langFlag: { fontSize: 28 },
  langLabel: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  langLabelSelected: { color: Colors.primary, fontWeight: FontWeight.bold },
  langCheck: { fontSize: FontSize.xl, color: Colors.primary, fontWeight: FontWeight.extrabold },

  // Export modal
  exportSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, gap: Spacing.md, maxHeight: '80%',
  },
  exportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  exportClose: { fontSize: FontSize.xl, color: Colors.textMuted, fontWeight: FontWeight.bold, padding: 4 },
  exportHint: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  exportBox: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, maxHeight: 220,
  },
  exportJson: {
    fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.textSecondary, lineHeight: 18,
  },
  exportActions: { flexDirection: 'row', gap: Spacing.sm },
  exportShareBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  exportShareText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.base },
  exportCancelBtn: {
    paddingVertical: 14, paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
  },
  exportCancelText: { color: Colors.textSecondary, fontWeight: FontWeight.semibold, fontSize: FontSize.base },
});
