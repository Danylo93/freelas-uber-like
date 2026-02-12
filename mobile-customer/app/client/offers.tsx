import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useSocket } from '@/src/contexts/SocketContext';
import api from '@/src/services/api';

interface Offer {
  id: string;
  providerName?: string;
  providerId?: string;
  proposedPrice?: number;
  message?: string;
  createdAt?: string;
}

export default function ClientOffersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOffers = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const response = await api.get(`/offers/${requestId}`, true);
      const data = response.data?.offers || response.data || [];
      setOffers(Array.isArray(data) ? data : []);
    } catch (e) {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      if (data.requestId && data.requestId !== requestId) return;
      loadOffers();
    };
    socket.on('offer_received', handler);
    return () => {
      socket.off('offer_received', handler);
    };
  }, [socket, requestId, loadOffers]);

  const handleAccept = async (offer: Offer) => {
    try {
      await api.post(`/offers/${offer.id}/accept`, { customerId: user?.id }, true);
      Alert.alert('Proposta aceita', 'O prestador foi notificado.');
      router.back();
    } catch (e) {
      Alert.alert('Falha', 'Endpoint de proposta ainda nao esta disponivel no backend.');
    }
  };

  const handleDecline = (offer: Offer) => {
    setOffers(prev => prev.filter(o => o.id !== offer.id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Propostas Recebidas</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadOffers}>
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {offers.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhuma proposta disponivel.</Text>
            </View>
          )}

          {offers.map((offer) => (
            <View key={offer.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.providerName}>{offer.providerName || 'Prestador'}</Text>
                <Text style={styles.price}>R$ {(offer.proposedPrice || 0).toFixed(2)}</Text>
              </View>
              <Text style={styles.message}>{offer.message || 'Sem mensagem enviada.'}</Text>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(offer)}>
                  <Text style={styles.acceptText}>Aceitar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineButton} onPress={() => handleDecline(offer)}>
                  <Text style={styles.declineText}>Recusar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  refreshButton: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#E3F2FD', borderRadius: 10 },
  refreshText: { color: '#007AFF', fontWeight: '600' },
  list: { padding: 20, paddingTop: 0 },
  emptyState: { padding: 30, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center' },
  emptyText: { color: '#777' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  providerName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  message: { color: '#666', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  acceptButton: { flex: 1, backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '600' },
  declineButton: { flex: 1, backgroundColor: '#f5f5f5', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  declineText: { color: '#666', fontWeight: '600' }
});

