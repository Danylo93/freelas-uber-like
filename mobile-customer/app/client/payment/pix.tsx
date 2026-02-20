import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/src/services/api';

export default function PixPaymentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const request_id = params.request_id;
    const amount = params.amount;
    const provider_name = params.provider_name;

    const [timeLeft, setTimeLeft] = useState(600); // 10 mins

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
    };

    const handleCopyCode = () => {
        Alert.alert("Pix code ready", "Cole o codigo no seu app bancario para concluir o pagamento.");

        // Simulate payment success after copy for demo
        setTimeout(() => {
            handlePaymentSuccess();
        }, 3000);
    };

    const handlePaymentSuccess = async () => {
        try {
            if (request_id) {
                await api.post(`/requests/${request_id}/payment`, {
                    method: 'pix',
                    amount: parseFloat(String(amount || 0)),
                    transaction_id: 'pix_123',
                    timestamp: new Date().toISOString()
                });
            }
            router.push({ pathname: '/client/payment/success', params: { request_id, amount, provider_name } });
        } catch (e) {
            Alert.alert("Error", "Payment verification failed");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pix Payment</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.totalLabel}>Total amount to pay</Text>
                <Text style={styles.totalValue}>R$ {amount}</Text>

                <View style={styles.timerCard}>
                    <Text style={styles.timerFunction}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.timerLabel}>Time to pay</Text>
                </View>

                <View style={styles.qrContainer}>
                    <View style={styles.qrBorder}>
                        <Image
                            source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426655440000520400005303986540545.005802BR5913Casa Limpa Des6008Sao Paulo62070503***63041D3D' }}
                            style={styles.qrCode}
                        />
                    </View>
                </View>

                <Text style={styles.instruction}>
                    Open your bank app and paste the code or scan the QR code to complete the payment.
                </Text>

                <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                    <Ionicons name="copy-outline" size={20} color="#fff" />
                    <Text style={styles.copyButtonText}>Copy Pix Code</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 30 : 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    backButton: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 12 },
    content: { padding: 24, alignItems: 'center' },

    totalLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
    totalValue: { fontSize: 36, fontWeight: 'bold', color: '#333', marginBottom: 30 },

    timerCard: { backgroundColor: '#E3F2FD', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, alignItems: 'center', marginBottom: 40 },
    timerFunction: { fontSize: 24, fontWeight: 'bold', color: '#00B0FF' },
    timerLabel: { fontSize: 10, color: '#666', textTransform: 'uppercase', marginTop: 4 },

    qrContainer: { marginBottom: 30 },
    qrBorder: { padding: 20, borderWidth: 1, borderColor: '#eee', borderRadius: 20, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    qrCode: { width: 180, height: 180 },

    instruction: { textAlign: 'center', color: '#666', paddingHorizontal: 20, marginBottom: 30, lineHeight: 22 },

    copyButton: { width: '100%', backgroundColor: '#00B0FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 8 },
    copyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
