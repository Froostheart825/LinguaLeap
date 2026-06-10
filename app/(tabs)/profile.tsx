import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '../../hooks/useUser';
import { useLessons } from '../../hooks/useLessons';
import { getXpHistory } from '../../services/userService';
import { getStreakFreezeCount } from '../../services/userService';
import { XpHistoryEntry } from '../../services/types';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../../constants/theme';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LESSON_STATUS } from '../../constants/config';
import {
  getAchievements, checkAndUnlockAchievements,
  getPerfectScoresCount, getFlashcardsReviewedCount,
  Achievement,
} from '../../services/achievementService';
import {
  getNotificationSettings, NotificationSettings,
} from '../../services/notificationService';
import { isSoundEnabled, setSoundEnabled } from '../../services/soundService';
import { NotificationSettingsSheet } from '../../components/NotificationSettingsSheet';
import { useAlert } from '@/template';
import { Modal } from 'react-native';

const AVATAR_STORAGE_KEY = 'user_avatar';
const DEFAULT_AVATAR = '🧑';
const AVATAR_OPTIONS = ['👤','🧑','👩','🧒','👴','👵','🧑‍💻','🧑‍🎓','🦸','🦹','🧙','🧚','🧛','🐱','🐶','🐼','🦊','🐸','🌟','🎭'];

const GOAL_OPTIONS = [
  { xp: 10, label: '☕ Casual', desc: '10 XP/day' },
  { xp: 20, label: '📚 Regular', desc: '20 XP/day' },
  { xp: 50, label: '🔥 Serious', desc: '50 XP/day' },
];

function formatNotifTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `Daily at ${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateDailyGoal } = useUser();
  const { showAlert } = useAlert();
  const { progress, loadProgress } = useLessons();
  const [xpHistory, setXpHistory] = useState<XpHistoryEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({ enabled: false, hour: 20, minute: 0 });
  const [showNotifSheet, setShowNotifSheet] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [freezeCount, setFreezeCount] = useState(0);
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadProgress(user.id);
      getXpHistory(user.id).then(setXpHistory);
      loadAchievements();
      getNotificationSettings().then(setNotifSettings);
      isSoundEnabled().then(setSoundOn);
      getStreakFreezeCount().then(setFreezeCount);
      AsyncStorage.getItem(AVATAR_STORAGE_KEY).then(val => {
        if (val) setAvatar(val);
      });
    }
  }, [user?.id]);

  const handleAvatarSelect = async (emoji: string) => {
    setAvatar(emoji);
    await AsyncStorage.setItem(AVATAR_STORAGE_KEY, emoji);
    setShowAvatarPicker(false);
  };

  const loadAchievements = async () => {
    if (!user) return;
    const completedLessons = progress.filter(p => p.status === LESSON_STATUS.COMPLETED).length;
    const perfectScores = await getPerfectScoresCount();
    const flashcardsReviewed = await getFlashcardsReviewedCount();
    await checkAndUnlockAchievements({
      streak: user.currentStreak,
      totalXp: user.totalXp,
      lessonsCompleted: completedLessons,
      perfectScores,
      wordsLearned: user.wordsLearned || 0,
      flashcardsReviewed,
    });
    const all = await getAchievements();
    setAchievements(all);
  };

  if (!user) return null;

  const completedLessons = progress.filter(p => p.status === LESSON_STATUS.COMPLETED).length;
  const totalStars = progress.reduce((a, p) => a + p.stars, 0);
  const unlockedCount = achievements.filter(a => a.unlockedAt !== null).length;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const dayXp = xpHistory
      .filter(h => new Date(h.earnedAt).toISOString().split('T')[0] === dayStr)
      .reduce((sum, h) => sum + h.xpGained, 0);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), xp: dayXp };
  });

  const maxXp = Math.max(...last7Days.map(d => d.xp), 1);

  const handleLogout = () => {
    showAlert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const handleSoundToggle = async (val: boolean) => {
    setSoundOn(val);
    await setSoundEnabled(val);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Pressable
            onPress={() => setShowAvatarPicker(true)}
            style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{avatar}</Text>
            </View>
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>✏️</Text>
            </View>
          </Pressable>
          <Text style={styles.username}>{user.username}</Text>
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {user.level}</Text>
            </View>
            <Text style={styles.joinDate}>
              Joined {new Date(user.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            {[
              { icon: '🔥', value: user.currentStreak, label: 'Day Streak' },
              { icon: '🏆', value: user.longestStreak, label: 'Best Streak' },
              { icon: '⚡', value: user.totalXp, label: 'Total XP' },
              { icon: '✅', value: completedLessons, label: 'Lessons' },
              { icon: '⭐', value: totalStars, label: 'Stars' },
              { icon: '❄️', value: freezeCount, label: 'Freezes' },
            ].map(stat => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* XP Chart */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>XP This Week</Text>
          <View style={styles.chartWrap}>
            {last7Days.map(day => (
              <View key={day.day} style={styles.chartCol}>
                <Text style={styles.chartXp}>{day.xp > 0 ? day.xp : ''}</Text>
                <View style={styles.chartBarWrap}>
                  <View style={[styles.chartBar, { height: Math.max(4, (day.xp / maxXp) * 80) }]} />
                </View>
                <Text style={styles.chartDay}>{day.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.achieveHeader}>
            <Text style={styles.cardTitle}>🏆 Achievements</Text>
            <Text style={styles.achieveCount}>{unlockedCount} / {achievements.length}</Text>
          </View>
          <View style={styles.achieveGrid}>
            {achievements.map(a => (
              <Pressable
                key={a.id}
                onPress={() => setSelectedAchievement(a)}
                style={({ pressed }) => [
                  styles.achieveItem,
                  a.unlockedAt ? styles.achieveUnlocked : styles.achieveLocked,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.achieveIcon, !a.unlockedAt && styles.achieveIconLocked]}>
                  {a.icon}
                </Text>
                {!a.unlockedAt && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>🔒</Text>
                  </View>
                )}
                <Text style={[styles.achieveTitle, !a.unlockedAt && styles.achieveTitleLocked]} numberOfLines={2}>
                  {a.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Daily Goal */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Daily Goal</Text>
          <View style={styles.goalOptions}>
            {GOAL_OPTIONS.map(g => (
              <Pressable
                key={g.xp}
                onPress={() => updateDailyGoal(g.xp)}
                style={[styles.goalChip, user.dailyGoalXp === g.xp && styles.goalChipActive]}
              >
                <Text style={[styles.goalChipText, user.dailyGoalXp === g.xp && styles.goalChipTextActive]}>
                  {g.label}
                </Text>
                <Text style={[styles.goalChipSub, user.dailyGoalXp === g.xp && { color: Colors.primaryDark }]}>
                  {g.desc}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Daily Progress */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Today</Text>
            <Text style={styles.cardSub}>{user.todayXp} / {user.dailyGoalXp} XP</Text>
          </View>
          <ProgressBar progress={user.todayXp / user.dailyGoalXp} height={12} />
        </View>

        {/* Settings */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Settings</Text>

          {/* Notifications row */}
          <Pressable
            onPress={() => setShowNotifSheet(true)}
            style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.settingIcon}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingSub}>
                {notifSettings.enabled
                  ? formatNotifTime(notifSettings.hour, notifSettings.minute)
                  : 'Off'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.settingDivider} />

          {/* Sound toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingIcon}>🔊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.settingSub}>Haptic feedback on answers</Text>
            </View>
            <Switch
              value={soundOn}
              onValueChange={handleSoundToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Logout */}
        <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.logoutText}>🚪 Log Out</Text>
        </Pressable>
      </ScrollView>

      {/* Notification settings sheet */}
      <NotificationSettingsSheet
        visible={showNotifSheet}
        onClose={() => {
          setShowNotifSheet(false);
          getNotificationSettings().then(setNotifSettings);
        }}
      />

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatarPicker} transparent animationType="fade" onRequestClose={() => setShowAvatarPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAvatarPicker(false)} />
        <View style={styles.avatarPickerSheet}>
          <View style={styles.avatarPickerHandle} />
          <Text style={styles.avatarPickerTitle}>Choose Your Avatar</Text>
          <Text style={styles.avatarPickerSub}>Tap an emoji to set it as your avatar</Text>
          <FlatList
            data={AVATAR_OPTIONS}
            keyExtractor={item => item}
            numColumns={5}
            scrollEnabled={false}
            contentContainerStyle={styles.avatarGrid}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleAvatarSelect(item)}
                style={({ pressed }) => [
                  styles.avatarOption,
                  item === avatar && styles.avatarOptionSelected,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.avatarOptionEmoji}>{item}</Text>
              </Pressable>
            )}
          />
          <Pressable onPress={() => setShowAvatarPicker(false)} style={styles.avatarPickerClose}>
            <Text style={styles.avatarPickerCloseText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Achievement Detail Modal */}
      <Modal visible={!!selectedAchievement} transparent animationType="fade" onRequestClose={() => setSelectedAchievement(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedAchievement(null)} />
        {selectedAchievement && (
          <View style={styles.modalSheet}>
            <Text style={styles.modalIcon}>{selectedAchievement.icon}</Text>
            <Text style={styles.modalTitle}>{selectedAchievement.title}</Text>
            <Text style={styles.modalDesc}>{selectedAchievement.description}</Text>
            {selectedAchievement.unlockedAt ? (
              <View style={styles.unlockedBadge}>
                <Text style={styles.unlockedText}>
                  🎉 Unlocked {new Date(selectedAchievement.unlockedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            ) : (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedText}>🔒 Not yet unlocked</Text>
              </View>
            )}
            <Pressable onPress={() => setSelectedAchievement(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  profileHeader: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.primary },
  avatarEmoji: { fontSize: 52 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditIcon: { fontSize: 13 },
  // Avatar picker
  avatarPickerSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
  },
  avatarPickerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  avatarPickerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  avatarPickerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  avatarGrid: { gap: Spacing.sm, paddingHorizontal: Spacing.sm },
  avatarOption: {
    width: 52, height: 52, borderRadius: 26, margin: 4,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border,
  },
  avatarOptionSelected: {
    borderColor: Colors.primary, backgroundColor: Colors.primaryBg,
    transform: [{ scale: 1.12 }],
  },
  avatarOptionEmoji: { fontSize: 26 },
  avatarPickerClose: {
    marginTop: Spacing.sm, paddingVertical: 12, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border,
  },
  avatarPickerCloseText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  username: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  levelBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  levelText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  joinDate: { fontSize: FontSize.sm, color: Colors.textMuted },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardSub: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statItem: { width: '33.33%', alignItems: 'center', paddingVertical: Spacing.md, gap: 4 },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartXp: { fontSize: 9, color: Colors.primary, fontWeight: FontWeight.bold },
  chartBarWrap: { flex: 1, justifyContent: 'flex-end', width: '70%' },
  chartBar: { backgroundColor: Colors.primary, borderRadius: 4, width: '100%', opacity: 0.85 },
  chartDay: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  achieveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  achieveCount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  achieveItem: { width: '30%', alignItems: 'center', borderRadius: Radius.lg, padding: Spacing.sm, gap: 4, position: 'relative', borderWidth: 1.5, minHeight: 80, justifyContent: 'center' },
  achieveUnlocked: { backgroundColor: '#FFFBEA', borderColor: Colors.gold },
  achieveLocked: { backgroundColor: Colors.surface, borderColor: Colors.border, opacity: 0.6 },
  achieveIcon: { fontSize: 28 },
  achieveIconLocked: { opacity: 0.4 },
  lockOverlay: { position: 'absolute', top: 4, right: 4 },
  lockIcon: { fontSize: 12 },
  achieveTitle: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center', lineHeight: 13 },
  achieveTitleLocked: { color: Colors.textMuted },
  goalOptions: { flexDirection: 'row', gap: Spacing.sm },
  goalChip: { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  goalChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  goalChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  goalChipTextActive: { color: Colors.primary },
  goalChipSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  settingIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  settingLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  settingSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  settingDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  chevron: { fontSize: 20, color: Colors.textMuted },
  logoutBtn: { backgroundColor: Colors.errorBg, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  logoutText: { color: Colors.error, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  modalIcon: { fontSize: 56 },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center' },
  modalDesc: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  unlockedBadge: { backgroundColor: '#FFFBEA', borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderWidth: 1.5, borderColor: Colors.gold },
  unlockedText: { color: Colors.secondary, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  lockedBadge: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border },
  lockedText: { color: Colors.textMuted, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
  closeBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: Spacing.xl, ...Shadow.sm, marginTop: Spacing.sm },
  closeBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.base },
});
