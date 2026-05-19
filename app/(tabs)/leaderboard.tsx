import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../hooks/useUser';
import { MOCK_LEADERBOARD } from '../../services/seedData';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../../constants/theme';
import {
  checkAndResetWeeklyXp, getMsUntilNextReset,
} from '../../services/userService';

type Tab = 'weekly' | 'alltime';

interface LeaderboardEntry {
  id: string;
  username: string;
  totalXp: number;
  weeklyXp: number;
  streak: number;
  avatar: string;
  rank?: number;
}

/** Format ms duration as "Xd Xh Xm Xs" */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSecs = Math.floor(ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function LeaderboardScreen() {
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>('weekly');
  const [weeklyXp, setWeeklyXp] = useState(0);
  const [msLeft, setMsLeft] = useState(getMsUntilNextReset());

  // Animated highlight pulse for current user row
  const highlightAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check/reset weekly XP on mount
    checkAndResetWeeklyXp().then(({ weeklyXp: wx }) => setWeeklyXp(wx));

    // Countdown ticker — updates every second
    const ticker = setInterval(() => {
      setMsLeft(getMsUntilNextReset());
    }, 1000);

    // Pulse animation for current user row
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 0.85, duration: 900, useNativeDriver: true }),
        Animated.timing(highlightAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => {
      clearInterval(ticker);
      pulse.stop();
    };
  }, []);

  const userEntry: LeaderboardEntry | null = user
    ? {
        id: user.id,
        username: user.username,
        totalXp: user.totalXp,
        weeklyXp,
        streak: user.currentStreak,
        avatar: '🧑',
      }
    : null;

  const allEntries: LeaderboardEntry[] = userEntry
    ? [...MOCK_LEADERBOARD, userEntry]
    : [...MOCK_LEADERBOARD];

  const ranked: (LeaderboardEntry & { rank: number })[] = [...allEntries]
    .sort((a, b) => (tab === 'weekly' ? b.weeklyXp - a.weeklyXp : b.totalXp - a.totalXp))
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  const rankColors = [Colors.gold, Colors.silver, Colors.bronze];
  const rankEmojis = ['🥇', '🥈', '🥉'];

  const userRankEntry = ranked.find(e => e.id === user?.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={rest}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Leaderboard 🏆</Text>
              <Text style={styles.subtitle}>Compete with learners worldwide</Text>
            </View>

            {/* Tab selector */}
            <View style={styles.tabs}>
              {(['weekly', 'alltime'] as Tab[]).map(t => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[styles.tab, tab === t && styles.tabActive]}
                >
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                    {t === 'weekly' ? '📅 This Week' : '🌟 All Time'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Countdown banner — only on weekly tab */}
            {tab === 'weekly' && (
              <View style={styles.countdownBanner}>
                <View style={styles.countdownLeft}>
                  <Text style={styles.countdownLabel}>🔄 Resets in</Text>
                  <Text style={styles.countdownTimer}>{formatCountdown(msLeft)}</Text>
                </View>
                <View style={styles.countdownRight}>
                  <Text style={styles.countdownNote}>Every Monday</Text>
                  <Text style={styles.countdownNote}>00:00 UTC</Text>
                </View>
              </View>
            )}

            {/* Current user rank banner (if not in top 3) */}
            {userRankEntry && userRankEntry.rank > 3 && (
              <Animated.View style={[styles.myRankBanner, { opacity: highlightAnim }]}>
                <Text style={styles.myRankLabel}>Your Rank</Text>
                <Text style={styles.myRankNum}>#{userRankEntry.rank}</Text>
                <View style={styles.myRankXpWrap}>
                  <Text style={styles.myRankXp}>
                    {tab === 'weekly' ? userRankEntry.weeklyXp : userRankEntry.totalXp} XP
                  </Text>
                  {tab === 'weekly' && (
                    <Text style={styles.myRankBehind}>
                      {ranked[userRankEntry.rank - 2]
                        ? `${(tab === 'weekly'
                            ? ranked[userRankEntry.rank - 2].weeklyXp
                            : ranked[userRankEntry.rank - 2].totalXp) -
                            (tab === 'weekly' ? userRankEntry.weeklyXp : userRankEntry.totalXp)} XP behind #${userRankEntry.rank - 1}`
                        : ''}
                    </Text>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Top 3 podium */}
            <View style={styles.podium}>
              {/* Reorder: 2nd, 1st, 3rd for visual podium */}
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                if (!entry) return null;
                const originalRank = entry.rank - 1; // 0-indexed
                const podiumOrder = [1, 0, 2]; // visual left=2nd, center=1st, right=3rd
                const rank = podiumOrder[i];
                const isCurrentUser = entry.id === user?.id;
                const xpVal = tab === 'weekly' ? entry.weeklyXp : entry.totalXp;

                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.podiumItem,
                      rank === 0 && styles.podiumFirst,
                      isCurrentUser && styles.podiumSelf,
                    ]}
                  >
                    <Text style={styles.podiumAvatar}>{entry.avatar}</Text>
                    <Text style={[styles.podiumRankEmoji, { color: rankColors[rank] }]}>
                      {rankEmojis[rank]}
                    </Text>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {entry.username}{isCurrentUser ? ' ★' : ''}
                    </Text>
                    <Text style={[styles.podiumXp, { color: rankColors[rank] }]}>
                      {xpVal} XP
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Ranking</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        )}
        renderItem={({ item }) => {
          const isCurrentUser = item.id === user?.id;
          const xpVal = tab === 'weekly' ? item.weeklyXp : item.totalXp;

          if (isCurrentUser) {
            return (
              <Animated.View style={[styles.row, styles.rowHighlight, Shadow.sm, { opacity: highlightAnim }]}>
                <View style={[styles.rankBadge, { backgroundColor: Colors.primary }]}>
                  <Text style={styles.rankBadgeText}>#{item.rank}</Text>
                </View>
                <Text style={styles.avatar}>{item.avatar}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, styles.nameHighlight]}>{item.username}</Text>
                    <View style={styles.youBadge}><Text style={styles.youText}>YOU</Text></View>
                  </View>
                  <Text style={styles.streak}>🔥 {item.streak} day streak</Text>
                </View>
                <Text style={[styles.xp, styles.xpHighlight]}>{xpVal} XP</Text>
              </Animated.View>
            );
          }

          return (
            <View style={[styles.row, Shadow.sm]}>
              <Text style={styles.rankNum}>#{item.rank}</Text>
              <Text style={styles.avatar}>{item.avatar}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.username}</Text>
                <Text style={styles.streak}>🔥 {item.streak} day streak</Text>
              </View>
              <Text style={styles.xp}>{xpVal} XP</Text>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 20 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  // Tabs
  tabs: {
    flexDirection: 'row', marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 4, marginBottom: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },

  // Countdown
  countdownBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.primaryLight,
  },
  countdownLeft: { gap: 2 },
  countdownLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  countdownTimer: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary, fontVariant: ['tabular-nums'] as any },
  countdownRight: { alignItems: 'flex-end', gap: 2 },
  countdownNote: { fontSize: FontSize.xs, color: Colors.textMuted },

  // My rank banner
  myRankBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.primaryBg, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 2, borderColor: Colors.primary,
  },
  myRankLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  myRankNum: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  myRankXpWrap: { flex: 1, alignItems: 'flex-end', gap: 2 },
  myRankXp: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.primary },
  myRankBehind: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Podium
  podium: {
    flexDirection: 'row', marginHorizontal: Spacing.lg,
    gap: Spacing.sm, marginBottom: Spacing.md,
    justifyContent: 'center', alignItems: 'flex-end',
  },
  podiumItem: {
    flex: 1, alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, gap: 4,
    borderWidth: 2, borderColor: Colors.border,
  },
  podiumFirst: { borderColor: Colors.gold, transform: [{ scale: 1.05 }], ...Shadow.md },
  podiumSelf: { borderColor: Colors.primary },
  podiumAvatar: { fontSize: 28 },
  podiumRankEmoji: { fontSize: 20 },
  podiumName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  podiumXp: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Rows
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  rowHighlight: { backgroundColor: Colors.primaryBg, borderWidth: 2, borderColor: Colors.primary },
  rankBadge: { borderRadius: Radius.full, minWidth: 34, height: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  rankBadgeText: { color: '#fff', fontWeight: FontWeight.extrabold, fontSize: FontSize.sm },
  rankNum: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textSecondary, width: 36 },
  avatar: { fontSize: 26 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  nameHighlight: { color: Colors.primary },
  youBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  youText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.extrabold, letterSpacing: 0.5 },
  streak: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  xp: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  xpHighlight: { color: Colors.primary },
});
