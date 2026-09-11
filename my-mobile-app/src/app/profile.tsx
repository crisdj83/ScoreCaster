import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.username || 'Set a username on the web';
  const email = profile?.email || user?.email || '—';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Profile
            </ThemedText>
            <ThemedText themeColor="textSecondary">Your XactScore account</ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Username
            </ThemedText>
            <ThemedText type="default">{displayName}</ThemedText>

            <ThemedText type="small" themeColor="textSecondary" style={styles.fieldGap}>
              Email
            </ThemedText>
            <ThemedText type="default">{email}</ThemedText>

            <ThemedText type="small" themeColor="textSecondary" style={styles.fieldGap}>
              Favorite team
            </ThemedText>
            <ThemedText type="default">{profile?.favorite_team || 'Not set'}</ThemedText>

            {profile?.is_global_admin ? (
              <View style={[styles.adminPill, { backgroundColor: theme.accentMuted }]}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  Global admin
                </ThemedText>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => void signOut()}
            style={[styles.signOut, { borderColor: theme.danger }]}>
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
              Sign out
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: { gap: Spacing.one, paddingTop: Spacing.three },
  title: { fontSize: 28, lineHeight: 34 },
  card: { borderRadius: 16, padding: Spacing.four, gap: Spacing.one },
  fieldGap: { marginTop: Spacing.three },
  adminPill: {
    alignSelf: 'flex-start',
    marginTop: Spacing.three,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signOut: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
