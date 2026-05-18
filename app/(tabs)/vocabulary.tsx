import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllVocabulary, getLessonById } from '../../services/lessonService';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../../constants/theme';
import { Vocabulary } from '../../services/types';
import * as Speech from 'expo-speech';

export default function VocabularyScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [speaking, setSpeaking] = useState<string | null>(null);

  const allVocab = useMemo(() => getAllVocabulary(), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return allVocab;
    const q = search.toLowerCase();
    return allVocab.filter(v =>
      v.word.toLowerCase().includes(q) || v.meaning.toLowerCase().includes(q)
    );
  }, [search, allVocab]);

  const grouped = useMemo(() => {
    const map: Record<string, Vocabulary[]> = {};
    for (const v of filtered) {
      if (!map[v.lessonId]) map[v.lessonId] = [];
      map[v.lessonId].push(v);
    }
    return Object.entries(map).map(([lessonId, data]) => ({
      title: getLessonById(lessonId)?.title || lessonId,
      data,
    }));
  }, [filtered]);

  const speakWord = (word: string, id: string) => {
    setSpeaking(id);
    Speech.speak(word, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setSpeaking(null),
      onError: () => setSpeaking(null),
    });
  };

  const renderItem = ({ item }: { item: Vocabulary }) => (
    <View style={[styles.vocabCard, Shadow.sm]}>
      <View style={styles.vocabMain}>
        <View style={{ flex: 1 }}>
          <Text style={styles.word}>{item.word}</Text>
          <Text style={styles.phonetic}>{item.phonetic}</Text>
          <Text style={styles.meaning}>{item.meaning}</Text>
        </View>
        <Pressable onPress={() => speakWord(item.word, item.id)} style={styles.speakBtn}>
          <Text style={{ fontSize: 22 }}>{speaking === item.id ? '🔊' : '🔉'}</Text>
        </Pressable>
      </View>
      <View style={styles.exampleWrap}>
        <Text style={styles.example}>"{item.exampleSentence}"</Text>
        <Text style={styles.exampleTrans}>{item.exampleTranslation}</Text>
      </View>
    </View>
  );

  // Full empty state when no vocab loaded at all (no lessons completed)
  if (allVocab.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Vocabulary</Text>
          <Text style={styles.subtitle}>0 words in your library</Text>
        </View>
        <View style={styles.fullEmpty}>
          <Text style={styles.fullEmptyIcon}>📖</Text>
          <Text style={styles.fullEmptyTitle}>No vocabulary yet</Text>
          <Text style={styles.fullEmptyBody}>Complete a lesson to unlock vocabulary words</Text>
          <Pressable onPress={() => router.push('/(tabs)/learn')} style={styles.goLearnBtn}>
            <Text style={styles.goLearnText}>Go to Learn</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Vocabulary</Text>
        <Text style={styles.subtitle}>{allVocab.length} words in your library</Text>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search words or meanings..."
          placeholderTextColor={Colors.textMuted}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      <SectionList
        sections={grouped}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length} words</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No words found for your search</Text>
          </View>
        )}
      />

      <Pressable
        onPress={() => router.push('/flashcards')}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.fabText}>🃏 Flashcards</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: Spacing.md, minHeight: 48 },
  clearBtn: { padding: Spacing.sm },
  clearText: { color: Colors.textMuted, fontSize: FontSize.base },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionCount: { fontSize: FontSize.sm, color: Colors.textSecondary },
  vocabCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  vocabMain: { flexDirection: 'row', alignItems: 'flex-start' },
  word: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  phonetic: { fontSize: FontSize.sm, color: Colors.accentBlue, marginTop: 2, fontStyle: 'italic' },
  meaning: { fontSize: FontSize.base, color: Colors.secondary, fontWeight: FontWeight.semibold, marginTop: 4 },
  speakBtn: { padding: Spacing.sm, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  exampleWrap: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  example: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  exampleTrans: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.base, color: Colors.textSecondary },
  fab: { position: 'absolute', bottom: 100, right: Spacing.lg, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 14, ...Shadow.lg },
  fabText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  // Full empty state
  fullEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  fullEmptyIcon: { fontSize: 64 },
  fullEmptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  fullEmptyBody: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  goLearnBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 12, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
  goLearnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.base },
});
