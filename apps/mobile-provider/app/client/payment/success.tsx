import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function PaymentSuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const request_id = params.request_id;
    const amount = params.amount;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity onPress={() => router.replace('/client')} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>

                <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={50} color="#fff" />
                </View>

                <Text style={styles.title}>Payment Successful!</Text>
                <Text style={styles.subtitle}>Your transaction has been completed</Text>

                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>TOTAL PAID</Text>
                    <Text style={styles.amountValue}>R$ {amount}</Text>
                </View>

                <View style={styles.serviceInfo}>
                    <View style={styles.iconBox}>
                        <Ionicons name="shield-checkmark" size={24} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.serviceProvider}>Service Provider</Text>
                        <Text style={styles.serviceName}>Home Cleaners Inc.</Text>
                    </View>
                </View>

                <Text style={styles.transId}>Transaction ID: 739-1829-372910</Text>

            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.homeButton} onPress={() => router.push({ pathname: '/client/review', params: { requestId: request_id, providerName: 'Home Cleaners Inc.' } })}>
                    <Text style={styles.homeButtonText}>Rate & Finish</Text>
                    <Ionicons name="star" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.receiptButton} onPress={() => router.push({ pathname: '/client/receipt', params: { request_id } })}>
                    <Text style={styles.receiptButtonText}>View Receipt</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 30 : 0 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },

    closeButton: { position: 'absolute', top: 20, left: 20, padding: 8 },

    successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00E676', alignItems: 'center', justifyContent: 'center', marginBottom: 30, shadowColor: '#00E676', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 10 }, elevation: 15 },

    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#888', marginBottom: 40 },

    amountCard: { width: '100%', backgroundColor: '#E8F5E9', padding: 30, borderRadius: 24, alignItems: 'center', marginBottom: 30 },
    amountLabel: { fontSize: 12, color: '#4CAF50', fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
    amountValue: { fontSize: 40, fontWeight: 'bold', color: '#1a1a1a' },

    serviceInfo: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 16, backgroundColor: '#f9f9f9', borderRadius: 16, marginBottom: 20 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00B0FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    serviceProvider: { fontSize: 12, color: '#666' },
    serviceName: { fontSize: 16, fontWeight: '600', color: '#333' },

    transId: { fontSize: 10, color: '#bbb' },

    footer: { padding: 30, gap: 16 },
    homeButton: { backgroundColor: '#00E676', paddingVertical: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    homeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    receiptButton: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
    receiptButtonText: { color: '#666', fontSize: 16, fontWeight: '600' }
});
