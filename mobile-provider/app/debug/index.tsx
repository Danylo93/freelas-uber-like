import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '@/src/config';

export default function DebugScreen() {
  const router = useRouter();
  const [healthStatus, setHealthStatus] = useState<'checking' | 'ok' | 'error' | null>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const baseUrl = CONFIG.API_URL || process.env.EXPO_PUBLIC_API_BASE_URL || '(não configurado)';

  const checkHealth = async () => {
    if (!baseUrl || baseUrl === '(não configurado)') {
      setHealthStatus('error');
      setErrorMsg('EXPO_PUBLIC_API_BASE_URL não está definido no .env');
      return;
    }
    setHealthStatus('checking');
    setErrorMsg(null);
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/healthz`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      setHealthData({ status: res.status, data });
      setHealthStatus(res.ok ? 'ok' : 'error');
      if (!res.ok) setErrorMsg(`HTTP ${res.status}`);
    } catch (e: any) {
      setHealthStatus('error');
      setErrorMsg(e?.message || 'Falha ao conectar');
      setHealthData(null);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkHealth();
    setRefreshing(false);
  };

  if (!__DEV__) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Debug (dev)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>BASE_URL</Text>
        <Text style={styles.value} selectable>{baseUrl}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Status /healthz</Text>
        {healthStatus === 'checking' && (
          <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 8 }} />
        )}
        {healthStatus === 'ok' && (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.statusOk}>OK</Text>
            {healthData && (
              <Text style={styles.statusDetail}>{JSON.stringify(healthData.data)}</Text>
            )}
          </View>
        )}
        {healthStatus === 'error' && (
          <View style={styles.statusRow}>
            <Ionicons name="close-circle" size={24} color="#F44336" />
            <Text style={styles.statusError}>{errorMsg || 'Erro'}</Text>
            {healthData && (
              <Text style={styles.statusDetail}>{JSON.stringify(healthData)}</Text>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
        <Ionicons name="refresh" size={20} color="#007AFF" />
        <Text style={styles.refreshBtnText}>Atualizar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 12, color: '#666', marginBottom: 8, fontWeight: '600' },
  value: { fontSize: 14, color: '#333', fontFamily: 'monospace' },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  statusOk: { color: '#4CAF50', fontWeight: '600' },
  statusError: { color: '#F44336', fontWeight: '600' },
  statusDetail: { fontSize: 11, color: '#999', marginTop: 4, flexBasis: '100%' },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    gap: 8,
  },
  refreshBtnText: { color: '#007AFF', fontWeight: '600' },
});
