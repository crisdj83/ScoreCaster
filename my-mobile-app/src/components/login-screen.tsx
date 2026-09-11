import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTheme } from '@/hooks/use-theme';

export function LoginScreen() {
  const theme = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function onSubmit() {
    setBusy(true);
    setMessage(null);
    setIsError(false);

    if (mode === 'signin') {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setIsError(true);
        setMessage(error);
      }
    } else {
      const { error, needsEmailConfirm } = await signUp(email.trim(), password);
      if (error) {
        setIsError(true);
        setMessage(error);
      } else if (needsEmailConfirm) {
        setMessage('Check your email to confirm your account, then sign in.');
      }
    }

    setBusy(false);
  }

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formWrap}>
          <View style={styles.brand}>
            <ThemedText type="title" style={styles.logo}>
              XactScore
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.tagline}>
              Exact scores with friends — no ads, always free.
            </ThemedText>
          </View>

          <View style={[styles.modeSwitch, { backgroundColor: theme.backgroundElement }]}>
            <Pressable
              onPress={() => setMode('signin')}
              style={[
                styles.modeBtn,
                mode === 'signin' && { backgroundColor: theme.accent },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: mode === 'signin' ? '#fff' : theme.textSecondary }}>
                Sign In
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setMode('signup')}
              style={[
                styles.modeBtn,
                mode === 'signup' && { backgroundColor: theme.accent },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: mode === 'signup' ? '#fff' : theme.textSecondary }}>
                Sign Up
              </ThemedText>
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" style={styles.label}>
              Email
            </ThemedText>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />

            <ThemedText type="smallBold" style={styles.label}>
              Password
            </ThemedText>
            <TextInput
              secureTextEntry
              autoComplete={mode === 'signin' ? 'password' : 'new-password'}
              placeholder="••••••••"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Password must be at least 6 characters.
            </ThemedText>

            {message ? (
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: isError ? `${theme.danger}22` : `${theme.success}22`,
                    borderColor: isError ? theme.danger : theme.success,
                  },
                ]}>
                <ThemedText type="small" style={{ color: isError ? theme.danger : theme.success }}>
                  {message}
                </ThemedText>
              </View>
            ) : null}

            <Pressable
              disabled={busy || !email || password.length < 6}
              onPress={onSubmit}
              style={[
                styles.submit,
                {
                  backgroundColor: theme.accent,
                  opacity: busy || !email || password.length < 6 ? 0.5 : 1,
                },
              ]}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="smallBold" style={styles.submitText}>
                  {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                </ThemedText>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.four },
  formWrap: { flex: 1, justifyContent: 'center', gap: Spacing.four },
  brand: { alignItems: 'center', gap: Spacing.two },
  logo: { fontSize: 40, lineHeight: 44, fontWeight: '800' },
  tagline: { textAlign: 'center', maxWidth: 280 },
  modeSwitch: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 999,
  },
  card: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  label: { marginTop: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, default: 10 }),
    fontSize: 16,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  submit: {
    marginTop: Spacing.three,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
});
