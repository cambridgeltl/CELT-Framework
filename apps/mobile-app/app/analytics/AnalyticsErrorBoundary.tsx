import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { trackError } from './analytics';

type State = { error: Error | null };

/** Logs render crashes to the research log and shows a recoverable message instead of a blank screen. */
export class AnalyticsErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    trackError(error, true, 'render');
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>Please close and reopen the app. Your progress is saved.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  body: { fontSize: 15, color: '#475569', textAlign: 'center' },
});
