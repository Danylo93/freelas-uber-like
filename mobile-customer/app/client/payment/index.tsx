import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView, Platform } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function PaymentMethodScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const request_id = params.request_id;
    const amount = params.amount || '45.00';
    const provider_name = params.provider_name;

    const [selectedMethod, setSelectedMethod] = useState('pix');

    const handlePay = () => {
        if (selectedMethod === 'pix') {
            router.push({ pathname: '/client/payment/pix', params: { request_id, amount, provider_name } });
        } else if (selectedMethod === 'card') {
            router.push({ pathname: '/client/payment/card', params: { request_id, amount, provider_name } });
        } else {
            // Mock Apple/Google Pay success
            router.push({ pathname: '/client/payment/success', params: { request_id, amount, provider_name } });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Method</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Amount Card */}
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>R$ {amount}</Text>
                    <View style={styles.serviceRow}>
                        <Text style={styles.serviceText}>House Cleaning Service + Taxes</Text>
                        <Ionicons name="receipt-outline" size={20} color="#007AFF" />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Select Payment Method</Text>

                {/* Methods */}
                <TouchableOpacity
                    style={[styles.methodCard, selectedMethod === 'pix' && styles.selectedMethod]}
                    onPress={() => setSelectedMethod('pix')}
                >
                    <View style={styles.methodIconBox}>
                        <MaterialCommunityIcons name="qrcode-scan" size={24} color="#00BFA5" />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={styles.methodTitle}>Pix</Text>
                        <Text style={styles.methodSubtitle}>Instant payment 24/7</Text>
                    </View>
                    <View style={styles.radio}>
                        {selectedMethod === 'pix' && <View style={styles.radioDocs} />}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.methodCard, selectedMethod === 'card' && styles.selectedMethod]}
                    onPress={() => setSelectedMethod('card')}
                >
                    <View style={styles.methodIconBox}>
                        <Ionicons name="card-outline" size={24} color="#333" />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={styles.methodTitle}>Credit/Debit Card</Text>
                        <Text style={styles.methodSubtitle}>Visa, Mastercard, Amex</Text>
                    </View>
                    <View style={styles.radio}>
                        {selectedMethod === 'card' && <View style={styles.radioDocs} />}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.methodCard, selectedMethod === 'apple' && styles.selectedMethod]}
                    onPress={() => setSelectedMethod('apple')}
                >
                    <View style={[styles.methodIconBox, { backgroundColor: '#000' }]}>
                        <Ionicons name="logo-apple" size={24} color="#fff" />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={styles.methodTitle}>Apple Pay</Text>
                        <Text style={styles.methodSubtitle}>Fast and secure checkout</Text>
                    </View>
                    <View style={styles.radio}>
                        {selectedMethod === 'apple' && <View style={styles.radioDocs} />}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.methodCard, selectedMethod === 'google' && styles.selectedMethod]}
                    onPress={() => setSelectedMethod('google')}
                >
                    <View style={styles.methodIconBox}>
                        <Ionicons name="logo-google" size={24} color="#DB4437" />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={styles.methodTitle}>Google Pay</Text>
                        <Text style={styles.methodSubtitle}>Pay with your Google account</Text>
                    </View>
                    <View style={styles.radio}>
                        {selectedMethod === 'google' && <View style={styles.radioDocs} />}
                    </View>
                </TouchableOpacity>

                <View style={styles.securityNote}>
                    <Ionicons name="lock-closed-outline" size={14} color="#666" />
                    <Text style={styles.securityText}>Your data is encrypted and 100% secure</Text>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.payButton} onPress={handlePay}>
                    <Text style={styles.payButtonText}>Pay Now - R$ {amount}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
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

    amountCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 30, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, elevation: 5
    },
    amountLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
    amountValue: { fontSize: 32, fontWeight: 'bold', color: '#00B0FF', marginBottom: 12 },
    serviceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F8FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    serviceText: { fontSize: 12, color: '#555', marginRight: 8 },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, marginLeft: 4 },

    methodCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee'
    },
    selectedMethod: { borderColor: '#00B0FF', backgroundColor: '#F0F8FF' },
    methodIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    methodInfo: { flex: 1 },
    methodTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
    methodSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
    radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    radioDocs: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00B0FF' },

    securityNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 8 },
    securityText: { fontSize: 12, color: '#666' },

    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    payButton: { backgroundColor: '#00B0FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 8, shadowColor: '#00B0FF', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
    payButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
