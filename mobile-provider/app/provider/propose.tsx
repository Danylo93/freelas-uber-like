import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import api from '@/src/services/api';

export default function ProviderProposeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { requestId, suggestedPrice } = useLocalSearchParams<{ requestId?: string; suggestedPrice?: string }>();

  const [price, setPrice] = useState(suggestedPrice || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!requestId) {
      Alert.alert('Erro', 'Solicitacao invalida.');
      return;
    }

    const proposedPrice = Number(price);
    if (!proposedPrice || proposedPrice <= 0) {
      Alert.alert('Erro', 'Informe um valor valido.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/offers/${requestId}/propose`, {
        providerId: user?.id,
        proposedPrice,
        message: message || 'Posso fazer por esse valor.'
      }, true);

      Alert.alert('Proposta enviada', 'Aguardando resposta do cliente.');
      router.back();
    } catch (e) {
      Alert.alert('Falha', 'Endpoint de proposta ainda nao esta disponivel no backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Propor Valor</Text>
        <Text style={styles.subtitle}>Ajuste o preco antes de aceitar o servico.</Text>

        <Text style={styles.label}>Valor Proposto (R$)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
          placeholder="0.00"
        />

        <Text style={styles.label}>Mensagem (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Escreva uma mensagem para o cliente"
          multiline
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'Enviando...' : 'Enviar Proposta'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  label: { fontSize: 12, color: '#888', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, backgroundColor: '#fafafa', marginBottom: 14 },
  textArea: { height: 90, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: { marginTop: 12, alignItems: 'center' },
  cancelText: { color: '#666' }
});

