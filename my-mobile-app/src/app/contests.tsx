import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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

export default function ContestsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
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
            <ThemedText type="subtitle" style={styles.title}>
              Leagues
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              Your private prediction leagues. Create and join flows come next.
            </ThemedText>
          </View>

          {loading ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: Spacing.five }} />
          ) : error ? (
            <ThemedText themeColor="danger">{error}</ThemedText>
          ) : contests.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="default">No leagues yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Join with an invite key on xactscore.app, or create a league from the web app for
                now.
              </ThemedText>
            </View>
          ) : (
            contests.map((row) => (
              <View
                key={row.contest_id}
                style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="default">{row.contests?.name || 'League'}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Key · {row.contests?.contest_key || '—'}
                </ThemedText>
                <View style={styles.metaRow}>
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    {row.role === 'admin' ? 'Admin' : 'Member'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {(row.contests?.season_length || 'full').replace('_', ' ')}
                    {row.contests?.is_open === false ? ' · closed' : ''}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
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
    gap: Spacing.three,
  },
  header: { gap: Spacing.one, paddingTop: Spacing.three, marginBottom: Spacing.two },
  title: { fontSize: 28, lineHeight: 34 },
  card: { borderRadius: 16, padding: Spacing.four, gap: Spacing.one },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.two },
  empty: { borderRadius: 16, padding: Spacing.four, gap: Spacing.two },
});
