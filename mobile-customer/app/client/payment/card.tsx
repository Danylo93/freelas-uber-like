import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/src/services/api';

export default function CardPaymentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const request_id = params.request_id;
    const amount = params.amount;
    const provider_name = params.provider_name;

    const [cardNumber, setCardNumber] = useState('');
    const [holderName, setHolderName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [saveCard, setSaveCard] = useState(true);

    const handlePay = async () => {
        if (!cardNumber || !holderName || !expiry || !cvv) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        try {
            if (request_id) {
                await api.post(`/requests/${request_id}/payment`, {
                    method: 'card',
                    amount: parseFloat(String(amount || 0)),
                    transaction_id: 'card_' + Math.floor(Math.random() * 10000),
                    timestamp: new Date().toISOString()
                });
            }
            router.push({ pathname: '/client/payment/success', params: { request_id, amount, provider_name } });
        } catch (e) {
            Alert.alert("Error", "Payment failed");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Card Payment</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Virtual Card Preview */}
                <View style={styles.cardPreview}>
                    <View style={styles.cardChip} />
                    <Text style={styles.cardPreviewNumber}>{cardNumber || '•••• •••• •••• ••••'}</Text>
                    <View style={styles.cardPreviewRow}>
                        <View>
                            <Text style={styles.cardLabel}>Card Holder</Text>
                            <Text style={styles.cardPreviewName}>{holderName.toUpperCase() || 'YOUR NAME'}</Text>
                        </View>
                        <View>
                            <Text style={styles.cardLabel}>Expires</Text>
                            <Text style={styles.cardPreviewExpiry}>{expiry || 'MM/YY'}</Text>
                        </View>
                    </View>
                    <View style={styles.mastercardCircle} />
                </View>

                <Text style={styles.sectionTitle}>Card Details</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Card Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0000 0000 0000 0000"
                        keyboardType="numeric"
                        value={cardNumber}
                        onChangeText={setCardNumber}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Cardholder Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Alex Johnson"
                        value={holderName}
                        onChangeText={setHolderName}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 15 }]}>
                        <Text style={styles.inputLabel}>Expiry Date</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="MM/YY"
                            value={expiry}
                            onChangeText={setExpiry}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>CVV</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="123"
                            keyboardType="numeric"
                            secureTextEntry
                            value={cvv}
                            onChangeText={setCvv}
                        />
                        <Ionicons name="help-circle-outline" size={16} color="#999" style={styles.cvvIcon} />
                    </View>
                </View>

                <TouchableOpacity style={styles.saveCardRow} onPress={() => setSaveCard(!saveCard)}>
                    <Ionicons name={saveCard ? "checkbox" : "square-outline"} size={24} color="#00B0FF" />
                    <Text style={styles.saveCardText}>Save card for future payments</Text>
                </TouchableOpacity>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.payButton} onPress={handlePay}>
                    <Text style={styles.payButtonText}>Pay Now - R$ {amount}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: Platform.OS === 'android' ? 30 : 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    backButton: { padding: 8, backgroundColor: '#fff', borderRadius: 12 },
    content: { padding: 20 },

    cardPreview: { height: 200, backgroundColor: '#1a1a1a', borderRadius: 20, padding: 24, justifyContent: 'space-between', marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
    cardChip: { width: 40, height: 30, backgroundColor: '#CCAEA1', borderRadius: 6 },
    cardPreviewNumber: { color: '#fff', fontSize: 22, letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    cardPreviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
    cardLabel: { color: '#aaa', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 },
    cardPreviewName: { color: '#fff', fontSize: 14, fontWeight: '600' },
    cardPreviewExpiry: { color: '#fff', fontSize: 14, fontWeight: '600' },
    mastercardCircle: { position: 'absolute', top: 20, right: 20, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,165,0,0.8)' },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },

    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 12, color: '#666', marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#eee', color: '#333' },

    row: { flexDirection: 'row' },
    cvvIcon: { position: 'absolute', right: 12, top: 45 },

    saveCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
    saveCardText: { color: '#333', fontSize: 14 },

    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    payButton: { backgroundColor: '#00B0FF', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16 },
    payButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
