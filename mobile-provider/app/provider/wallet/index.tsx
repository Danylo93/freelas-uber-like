import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/services/api';
import { useAuth } from '@/src/contexts/AuthContext';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    description: string;
    date: string;
}

interface WalletData {
    balance: number;
    actions: Transaction[];
}

export default function WalletScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [balance, setBalance] = useState('0.00');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadWallet();
    }, []);

    const loadWallet = async () => {
        try {
            // Mock ID for now if user.id not available (though it should be)
            const providerId = user?.id || 'provider_123';
            const response = await api.get(`/providers/${providerId}/wallet`);
            const actions = response.data.actions || response.data.transactions || [];
            setBalance(Number(response.data.balance || 0).toFixed(2));
            setTransactions(actions);
        } catch (e) {
            // Fallback demo data
            setBalance('2,840.50');
            setTransactions([
                { id: '1', type: 'earning', amount: 115.00, description: 'Emergency Plumbing', date: 'Oct 24, 2023 • 02:30 PM' },
                { id: '2', type: 'earning', amount: 245.50, description: 'Repairing Service', date: 'Oct 23, 2023 • 10:15 AM' },
                { id: '3', type: 'earning', amount: 65.00, description: 'Faucet Installation', date: 'Oct 23, 2023 • 09:00 AM' },
                { id: '4', type: 'earning', amount: 89.20, description: 'Drain Cleaning', date: 'Oct 22, 2023 • 04:45 PM' },
                { id: '5', type: 'withdrawal', amount: -1290.00, description: 'Withdrawal to Bank', date: 'Oct 20, 2023 • 09:00 AM' },
            ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleWithdraw = async () => {
        // Implement withdraw logic
        alert('Solicitação de saque enviada!');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Carteira</Text>
                <TouchableOpacity style={styles.notifButton}>
                    <Ionicons name="notifications" size={20} color="#333" />
                    <View style={styles.badge} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadWallet(); }} />}
            >
                <View style={styles.balanceCard}>
                    <View>
                        <Text style={styles.balanceLabel}>Saldo Atual</Text>
                        <Text style={styles.balanceValue}>R$ {balance}</Text>
                    </View>
                    <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
                        <Ionicons name="cash-outline" size={20} color="#1a1a1a" />
                        <Text style={styles.withdrawText}>Sacar Fundos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.addButton}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.tabs}>
                    <TouchableOpacity style={[styles.tab, styles.activeTab]}><Text style={[styles.tabText, styles.activeTabText]}>Histórico</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Saques</Text></TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>ATIVIDADE RECENTE</Text>

                {transactions.map((t) => (
                    <View key={t.id} style={styles.transactionRow}>
                        <View style={[styles.iconBox, { backgroundColor: t.type === 'earning' ? '#E8F5E9' : '#f5f5f5' }]}>
                            <Ionicons
                                name={t.type === 'earning' ? "leaf" : "business"}
                                size={20}
                                color={t.type === 'earning' ? "#00E676" : "#666"}
                            />
                        </View>
                        <View style={styles.transInfo}>
                            <Text style={styles.transTitle}>{t.description}</Text>
                            <Text style={styles.transDate}>{t.date}</Text>
                        </View>
                        <View>
                            <Text style={[styles.transAmount, { color: t.type === 'earning' ? '#00E676' : '#666' }]}>
                                {t.type === 'earning' ? '+' : ''}R$ {Math.abs(t.amount).toFixed(2)}
                            </Text>
                            {t.type === 'earning' && <Text style={styles.navEarned}>Ganho Líquido</Text>}
                        </View>
                    </View>
                ))}

            </ScrollView>

            {/* Bottom Mock Tab Bar */}
            <View style={styles.tabBar}>
                <Ionicons name="grid-outline" size={24} color="#aaa" />
                <Ionicons name="briefcase-outline" size={24} color="#aaa" />
                <Ionicons name="wallet" size={24} color="#00E676" />
                <Ionicons name="person-outline" size={24} color="#aaa" />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: Platform.OS === 'android' ? 30 : 0 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    notifButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 5 },
    badge: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' },

    content: { padding: 20 },

    balanceCard: { backgroundColor: '#1a1a1a', borderRadius: 24, padding: 24, height: 180, justifyContent: 'center', marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 10 }, elevation: 15 },
    balanceLabel: { color: '#aaa', fontSize: 12, marginBottom: 8 },
    balanceValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 20 },

    withdrawButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00E676', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start' },
    withdrawText: { fontWeight: 'bold', color: '#1a1a1a', marginLeft: 8 },

    addButton: { position: 'absolute', right: 24, bottom: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

    tabs: { flexDirection: 'row', marginBottom: 30 },
    tab: { marginRight: 24, paddingBottom: 8 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#00E676' },
    tabText: { color: '#aaa', fontSize: 14, fontWeight: '600' },
    activeTabText: { color: '#1a1a1a' },

    sectionTitle: { fontSize: 10, color: '#aaa', fontWeight: 'bold', marginBottom: 20, letterSpacing: 1 },

    transactionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, elevation: 2 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    transInfo: { flex: 1 },
    transTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    transDate: { fontSize: 10, color: '#999', marginTop: 4 },
    transAmount: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
    navEarned: { fontSize: 10, color: '#ccc', textAlign: 'right' },

    tabBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' }
});
