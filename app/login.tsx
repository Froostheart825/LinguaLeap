import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../hooks/useUser';
import { useAlert } from '@/template';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../constants/theme';

type Tab = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register } = useUser();
  const { showAlert } = useAlert();
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) { showAlert('Error', 'Please enter your email'); return; }
    setLoading(true);
    try {
      await login(email.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      showAlert('Login Failed', e.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim()) { showAlert('Error', 'Please enter a username'); return; }
    if (!email.trim()) { showAlert('Error', 'Please enter your email'); return; }
    if (password.length < 4) { showAlert('Error', 'Password must be at least 4 characters'); return; }
    if (password !== confirmPw) { showAlert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(username.trim(), email.trim());
      router.replace('/goal-picker');
    } catch (e: any) {
      showAlert('Registration Failed', e.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>🐸</Text>
          <Text style={styles.title}>LinguaLeap</Text>
          <Text style={styles.subtitle}>Your daily English adventure</Text>

          <View style={styles.mockBanner}>
            <Text style={styles.mockText}>🔧 DEMO MODE — Enter any email to login/register</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['login', 'register'] as Tab[]).map(t => (
              <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === 'login' ? 'Sign In' : 'Register'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.form}>
            {tab === 'register' && (
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Your display name"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>

            {tab === 'register' && (
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
              </View>
            )}

            <Pressable
              onPress={tab === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>{tab === 'login' ? 'Sign In' : 'Create Account'}</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, alignItems: 'center', paddingTop: Spacing.xxl },
  logo: { fontSize: 64, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing.lg },
  mockBanner: { backgroundColor: Colors.secondaryBg, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.lg, width: '100%' },
  mockText: { fontSize: FontSize.xs, color: Colors.secondaryDark, textAlign: 'center', fontWeight: FontWeight.semibold },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 4, width: '100%', marginBottom: Spacing.lg },
  tab: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  form: { width: '100%', gap: Spacing.md },
  inputWrap: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 48,
  },
  btn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm, ...Shadow.md },
  btnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
