import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTheme } from '@/hooks/use-theme';
import { normalizeContestMemberships } from '@/lib/normalize';
import { supabase } from '@/lib/supabase';
import type { ContestMembership } from '@/lib/types';

export default function HomeScreen() {
  const theme = useTheme();
  const { user, profile } = useAuth();
  const [contests, setContests] = useState<ContestMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    const { data, error: queryError } = await supabase
      .from('contest_members')
      .select(
        `
        contest_id,
        role,
        joined_at,
        contests (
          name,
          contest_key,
          season_length,
          is_open,
          is_public
        )
      `
      )
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setContests([]);
    } else {
      setContests(normalizeContestMemberships(data));
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const displayName = profile?.username || profile?.email || user?.email || 'Player';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={theme.accent}
            />
          }>
          <View style={styles.header}>
            <ThemedText type="small" themeColor="textSecondary">
              Welcome back
            </ThemedText>
            <ThemedText type="subtitle" style={styles.title}>
              {displayName}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              Predict Premier League scores and climb your league tables.
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Your leagues
            </ThemedText>

            {loading ? (
              <ActivityIndicator color={theme.accent} style={{ marginVertical: Spacing.four }} />
            ) : error ? (
              <ThemedText themeColor="danger">{error}</ThemedText>
            ) : contests.length === 0 ? (
              <ThemedText themeColor="textSecondary">
                You are not in a league yet. Open the Leagues tab to create or join one.
              </ThemedText>
            ) : (
              contests.slice(0, 5).map((row) => (
                <View
                  key={row.contest_id}
                  style={[styles.row, { borderColor: theme.backgroundSelected }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="default">{row.contests?.name || 'League'}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {(row.role === 'admin' ? 'Admin' : 'Member') +
                        (row.contests?.is_open === false ? ' · Locked' : '')}
                    </ThemedText>
                  </View>
                  <View style={[styles.pill, { backgroundColor: theme.accentMuted }]}>
                    <ThemedText type="smallBold" style={{ color: theme.accent }}>
                      Open
                    </ThemedText>
                  </View>
                </View>
              ))
            )}
          </View>

          <Pressable
            style={[styles.hint, { backgroundColor: theme.backgroundElement }]}
            disabled>
            <ThemedText type="smallBold">Next up</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Matchday predictions will land here. Use Leagues to open a contest and make picks.
            </ThemedText>
          </Pressable>
        </ScrollView>
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
  card: { borderRadius: 16, padding: Spacing.four, gap: Spacing.three },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  hint: { borderRadius: 16, padding: Spacing.four, gap: Spacing.two },
});
