import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../hooks/useUser';
import { MOCK_LEADERBOARD } from '../../services/seedData';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../../constants/theme';

type Tab = 'weekly' | 'alltime';

export default function LeaderboardScreen() {
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>('weekly');

  const sorted = [...MOCK_LEADERBOARD].sort((a, b) =>
    tab === 'weekly' ? b.weeklyXp - a.weeklyXp : b.totalXp - a.totalXp
  );

  // Insert current user
  const userEntry = user ? {
    id: user.id,
    username: user.username,
    totalXp: user.totalXp,
    weeklyXp: user.todayXp,
    streak: user.currentStreak,
    avatar: '🧑',
  } : null;

  const allEntries = userEntry ? [...sorted, userEntry] : sorted;
  const ranked = [...allEntries]
    .sort((a, b) => tab === 'weekly' ? b.weeklyXp - a.weeklyXp : b.totalXp - a.totalXp)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const rankColors = [Colors.gold, Colors.silver, Colors.bronze];
  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard 🏆</Text>
        <Text style={styles.subtitle}>Compete with learners worldwide</Text>
      </View>

      {/* Tab */}
      <View style={styles.tabs}>
        {(['weekly', 'alltime'] as Tab[]).map(t => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'weekly' ? '📅 This Week' : '🌟 All Time'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Top 3 podium */}
      <View style={styles.podium}>
        {ranked.slice(0, 3).map((entry, i) => (
          <View key={entry.id} style={[styles.podiumItem, i === 0 && styles.podiumFirst]}>
            <Text style={styles.podiumAvatar}>{entry.avatar}</Text>
            <Text style={[styles.podiumRank, { color: rankColors[i] }]}>{rankEmojis[i]}</Text>
            <Text style={styles.podiumName} numberOfLines={1}>{entry.username}</Text>
            <Text style={[styles.podiumXp, { color: rankColors[i] }]}>
              {tab === 'weekly' ? entry.weeklyXp : entry.totalXp} XP
            </Text>
          </View>
        ))}
      </View>

      <FlatList
        data={ranked.slice(3)}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isCurrentUser = item.id === user?.id;
          return (
            <View style={[styles.row, isCurrentUser && styles.rowHighlight, Shadow.sm]}>
              <Text style={styles.rank}>#{item.rank}</Text>
              <Text style={styles.avatar}>{item.avatar}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, isCurrentUser && styles.nameHighlight]}>
                  {item.username} {isCurrentUser ? '(You)' : ''}
                </Text>
                <Text style={styles.streak}>🔥 {item.streak} day streak</Text>
              </View>
              <Text style={[styles.xp, isCurrentUser && styles.xpHighlight]}>
                {tab === 'weekly' ? item.weeklyXp : item.totalXp} XP
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.md },
  tab: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  podium: { flexDirection: 'row', marginHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md, justifyContent: 'center', alignItems: 'flex-end' },
  podiumItem: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 4, borderWidth: 2, borderColor: Colors.border },
  podiumFirst: { borderColor: Colors.gold, transform: [{ scale: 1.05 }] },
  podiumAvatar: { fontSize: 32 },
  podiumRank: { fontSize: 20 },
  podiumName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  podiumXp: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  rowHighlight: { backgroundColor: Colors.primaryBg, borderWidth: 2, borderColor: Colors.primary },
  rank: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textSecondary, width: 32 },
  avatar: { fontSize: 28 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  nameHighlight: { color: Colors.primary },
  streak: { fontSize: FontSize.xs, color: Colors.textSecondary },
  xp: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  xpHighlight: { color: Colors.primary },
});
