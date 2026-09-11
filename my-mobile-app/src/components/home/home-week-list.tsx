import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { HomeLeague } from '@/lib/home-api';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  leagues: HomeLeague[];
  onJoinPress: () => void;
  onLeaguePress: (league: HomeLeague) => void;
};

export function HomeWeekList({ leagues, onJoinPress, onLeaguePress }: Props) {
  const theme = useTheme();
  const isDark = theme.background !== '#e2e8f0';
  const totalOpen = leagues.reduce((sum, league) => sum + league.openPicks, 0);

  if (leagues.length === 0) {
    return (
      <Pressable
        onPress={onJoinPress}
        style={({ pressed }) => [
          styles.emptyCard,
          {
            backgroundColor: isDark ? 'rgba(255,138,43,0.10)' : '#ffffff',
            borderColor: isDark ? 'rgba(255,138,43,0.40)' : '#e2e8f0',
            opacity: pressed ? 0.88 : 1,
          },
        ]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Join a league</Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            Create or join a league to start calling scores.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.accent} />
      </Pressable>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fed7aa' : theme.text }]}>
            Your week
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {totalOpen > 0
              ? 'Put your scores in before they lock.'
              : 'You are up to date. Check the table or wait for the next matchday.'}
          </Text>
        </View>
        {totalOpen > 0 ? (
          <View style={[styles.picksPill, { backgroundColor: theme.accent }]}>
            <Text style={[styles.picksPillText, { color: isDark ? '#050506' : '#ffffff' }]}>
              {totalOpen} {totalOpen === 1 ? 'pick left' : 'picks left'}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.listCard,
          {
            backgroundColor: isDark ? '#18181b' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#e2e8f0',
          },
        ]}>
        {leagues.map((league, index) => (
          <Pressable
            key={league.contestId}
            onPress={() => onLeaguePress(league)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: isDark ? 'rgba(255,255,255,0.10)' : '#f1f5f9',
              },
              pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc' },
            ]}>
            <View
              style={[
                styles.trophyWrap,
                {
                  backgroundColor: isDark ? '#09090b' : '#f1f5f9',
                  borderColor: isDark ? 'transparent' : '#f1f5f9',
                },
              ]}>
              <Ionicons name="trophy" size={20} color={isDark ? theme.accent : '#475569'} />
            </View>
            <View style={styles.rowBody}>
              <Text numberOfLines={1} style={[styles.leagueName, { color: theme.text }]}>
                {league.name}
              </Text>
              <Text style={[styles.leagueMeta, { color: theme.textSecondary }]}>
                {league.openPicks > 0
                  ? `${league.openPicks} ${league.openPicks === 1 ? 'pick left' : 'picks left'}`
                  : 'All picks in'}
                {league.rank ? ` · #${league.rank}` : ''}
              </Text>
            </View>
            <Text style={[styles.cta, { color: theme.accent }]}>
              {league.openPicks > 0 ? 'Put scores' : 'View table'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  sectionSubtitle: { marginTop: 2, fontSize: 14, lineHeight: 20 },
  picksPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  picksPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  listCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  trophyWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  leagueName: { fontSize: 14, fontWeight: '700' },
  leagueMeta: { marginTop: 2, fontSize: 12 },
  cta: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  emptyBody: { marginTop: 4, fontSize: 14, lineHeight: 20 },
});
