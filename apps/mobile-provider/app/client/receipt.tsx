import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/src/services/api';

interface ReceiptData {
    request_id: string;
    provider_name: string;
    service_fee: number;
    platform_fee: number;
    discount: number;
    total: number;
    date: string;
}

export default function ReceiptScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const request_id = params.request_id;

    const [loading, setLoading] = useState(true);
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);

    useEffect(() => {
        loadReceipt();
    }, []);

    const loadReceipt = async () => {
        try {
            if (!request_id) return;
            const response = await api.get(`/requests/${request_id}/receipt`);
            setReceipt(response.data);
        } catch (e) {
            // Fallback for demo if backend not running
            setReceipt({
                request_id: request_id as string || 'REQ-89021',
                provider_name: 'John Smith',
                service_fee: 128.00,
                platform_fee: 5.00,
                discount: -12.00,
                total: 113.00,
                date: 'Oct 24, 2023 - 02:30 PM'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#00E676" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Service Receipt</Text>
                <TouchableOpacity style={styles.shareButton}>
                    <Ionicons name="share-social-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <View style={styles.receiptCard}>
                <View style={styles.dottedTop} />

                <View style={styles.receiptContent}>
                    <Text style={styles.serviceTitle}>Emergency Plumbing</Text>
                    <Text style={styles.orderId}>Order ID: #{receipt?.request_id.slice(-8).toUpperCase()}</Text>

                    <View style={styles.providerRow}>
                        <Image source={{ uri: `https://ui-avatars.com/api/?name=${receipt?.provider_name}` }} style={styles.avatar} />
                        <View>
                            <Text style={styles.providerName}>{receipt?.provider_name}</Text>
                            <Text style={styles.providerRating}>Expert Plumber • 5.0 (240)</Text>
                        </View>
                    </View>

                    <View style={styles.dateRow}>
                        <View>
                            <Text style={styles.dateLabel}>DATE</Text>
                            <Text style={styles.dateValue}>{receipt?.date.split(' - ')[0]}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.dateLabel}>TIME</Text>
                            <Text style={styles.dateValue}>{receipt?.date.split(' - ')[1] || '02:30 PM'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionHeader}>PAYMENT SUMMARY</Text>

                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Service Fee (Emergency)</Text>
                        <Text style={styles.rowValue}>$ {receipt?.service_fee.toFixed(2)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Platform Fee</Text>
                        <Text style={styles.rowValue}>$ {receipt?.platform_fee.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.row, { marginBottom: 20 }]}>
                        <Text style={[styles.rowLabel, { color: '#00E676' }]}>Discount Applied <Text style={{ fontWeight: 'bold' }}>SAVE10</Text></Text>
                        <Text style={[styles.rowValue, { color: '#00E676' }]}>- $ {Math.abs(receipt?.discount || 0).toFixed(2)}</Text>
                    </View>

                    <View style={styles.dividerDashed} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Grand Total</Text>
                        <Text style={styles.totalValue}>$ {receipt?.total.toFixed(2)}</Text>
                    </View>

                    <View style={styles.paidBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#00E676" />
                        <Text style={styles.paidText}>PAID SUCCESSFULLY</Text>
                    </View>

                    <Text style={styles.footerNote}>If you have any questions regarding this receipt, please contact <Text style={{ color: '#00B0FF' }}>Customer Support</Text>.</Text>
                </View>

                <View style={styles.dottedBottom} />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.downloadButton}>
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text style={styles.downloadButtonText}>Download PDF</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: Platform.OS === 'android' ? 30 : 0 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    backButton: { padding: 8 },
    shareButton: { padding: 8 },

    receiptCard: { flex: 1, margin: 20, backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, elevation: 10, overflow: 'hidden' },

    dottedTop: { height: 10, backgroundColor: '#00E676' }, // Decorative top bar

    receiptContent: { padding: 30, flex: 1 },

    serviceTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
    orderId: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 30 },

    providerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    providerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    providerRating: { fontSize: 12, color: '#666' },

    dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    dateLabel: { fontSize: 10, color: '#aaa', fontWeight: 'bold' },
    dateValue: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 4 },

    divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 20 },
    dividerDashed: { height: 1, borderWidth: 1, borderColor: '#eee', borderStyle: 'dashed', marginBottom: 20 },

    sectionHeader: { fontSize: 12, fontWeight: 'bold', color: '#aaa', marginBottom: 16 },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    rowLabel: { fontSize: 14, color: '#666' },
    rowValue: { fontSize: 14, fontWeight: '600', color: '#333' },

    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 },
    totalLabel: { fontSize: 18, fontWeight: '600' },
    totalValue: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },

    paidBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9', paddingVertical: 8, borderRadius: 20, width: 160, alignSelf: 'center', marginBottom: 40 },
    paidText: { color: '#00E676', fontWeight: 'bold', fontSize: 10, marginLeft: 6 },

    footerNote: { fontSize: 10, color: '#999', textAlign: 'center', lineHeight: 16 },

    dottedBottom: { height: 0 },

    footer: { padding: 20, paddingBottom: 40 },
    downloadButton: { backgroundColor: '#00E676', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 8 },
    downloadButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
