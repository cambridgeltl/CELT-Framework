import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { exportResearchData, getEventCount, getParticipantCode, setParticipantCode } from '../analytics';
import AnimatedButton from './AnimatedButton';

/**
 * Settings → Research: shows the anonymous participant code for this account,
 * lets a facilitator replace it with the study code (e.g. "PUNO-07"), and exports
 * all usage data stored on this device. Nothing is uploaded automatically.
 */
export const ResearchSettings: React.FC = () => {
  const [code, setCode] = useState(getParticipantCode());
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    setCode(getParticipantCode());
    getEventCount()
      .then(setCount)
      .catch(() => setCount(null));
  }, []);

  useEffect(refresh, [refresh]);

  const save = async () => {
    const saved = await setParticipantCode(draft);
    setCode(saved);
    setEditing(false);
    setStatus(`Participant code set to ${saved}.`);
  };

  const doExport = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const { eventCount } = await exportResearchData();
      setStatus(`Exported ${eventCount} events.`);
    } catch (e) {
      setStatus(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
      refresh();
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: '#ecfdf5' }]}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={18} color="#059669" />
        </View>
        <Text style={styles.title}>Research</Text>
      </View>

      <Text style={styles.label}>Participant code</Text>
      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="e.g. PUNO-07"
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
            accessibilityLabel="Participant code"
          />
          <AnimatedButton style={styles.smallButton} onPress={save} disabled={!draft.trim()} hapticFeedback="light">
            <Text style={styles.smallButtonText}>Save</Text>
          </AnimatedButton>
        </View>
      ) : (
        <View style={styles.editRow}>
          <Text style={styles.code} selectable>
            {code}
          </Text>
          <AnimatedButton
            style={styles.linkButton}
            onPress={() => {
              setDraft(code.startsWith('anon-') ? '' : code);
              setEditing(true);
            }}
            hapticFeedback="light"
          >
            <Text style={styles.link}>Change</Text>
          </AnimatedButton>
        </View>
      )}

      <Text style={styles.meta}>
        {count === null ? 'Usage data is stored on this device only.' : `${count} events stored on this device. Nothing is uploaded automatically.`}
      </Text>

      <AnimatedButton style={styles.exportButton} onPress={doExport} disabled={busy} hapticFeedback="light">
        <MaterialCommunityIcons name="export-variant" size={18} color="#ffffff" />
        <Text style={styles.exportText}>{busy ? 'Exporting…' : 'Export research data'}</Text>
      </AnimatedButton>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  label: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  code: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0f172a', letterSpacing: 0.5 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#0f172a',
  },
  smallButton: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  smallButtonText: { color: '#ffffff', fontWeight: '600' },
  linkButton: { paddingHorizontal: 6, paddingVertical: 4 },
  link: { color: '#6366f1', fontWeight: '600' },
  meta: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
  },
  exportText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  status: { marginTop: 10, fontSize: 13, color: '#334155', textAlign: 'center' },
});

export default ResearchSettings;
