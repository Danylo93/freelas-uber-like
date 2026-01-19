import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import api from '@/src/services/api';

type ServiceRequest = {
    id: string;
    category: string;
    price: float;
    status: string;
    timestamp?: string; // Mocking date for now if backend doesn't have it
    provider_id?: string;
    // In real app, we'd broaden this to include provider name/details
};

export default function ServiceHistoryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');
    const [loading, setLoading] = useState(true);
    const [activeRequests, setActiveRequests] = useState<ServiceRequest[]>([]);
    const [completedRequests, setCompletedRequests] = useState<ServiceRequest[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            if (!user) return;

            // Fetch Ongoing (pending, accepted, in_progress)
            const ongoingRes = await api.get(`/requests/client/${user.id}?status=pending,accepted,in_progress`);
            setActiveRequests(ongoingRes.data);

            // Fetch Completed (completed, cancelled)
            const completedRes = await api.get(`/requests/client/${user.id}?status=completed,cancelled`);
            setCompletedRequests(completedRes.data);

        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#4CAF50';
            case 'cancelled': return '#FF5252';
            case 'in_progress': return '#2196F3';
            case 'accepted': return '#FF9800';
            default: return '#999';
        }
    };

    const renderCard = (req: ServiceRequest) => (
        <View key={req.id} style={styles.card}>
            <Image
                source={{ uri: 'https://images.unsplash.com/photo-1581578731117-104f2a8d467e?w=500' }} // Mock image based on category in real app
                style={styles.cardImage}
            />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(req.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(req.status) }]}>{req.status.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.priceText}>${req.price.toFixed(2)}</Text>
                </View>

                <Text style={styles.serviceTitle}>{req.category} Service</Text>
                <Text style={styles.providerName}>{req.provider_id ? 'Provider Assigned' : 'Looking for provider...'}</Text>
                <Text style={styles.dateText}>Nov 10, 2023 • 2:30 PM</Text>

                <View style={styles.cardActions}>
                    {req.status === 'in_progress' || req.status === 'accepted' ? (
                        <TouchableOpacity style={styles.trackButton} onPress={() => router.back()}>
                            <Text style={styles.trackButtonText}>Track Pro</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.rebookButton}>
                            <Text style={styles.rebookText}>Rebook</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Service History</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
                    onPress={() => setActiveTab('ongoing')}
                >
                    <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>Ongoing</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                {loading ? <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} /> : (
                    activeTab === 'ongoing' ? (
                        activeRequests.length > 0 ? activeRequests.map(renderCard) : <Text style={styles.emptyText}>No ongoing services</Text>
                    ) : (
                        completedRequests.length > 0 ? completedRequests.map(renderCard) : <Text style={styles.emptyText}>No completed services</Text>
                    )
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60, backgroundColor: '#fff' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },

    tabs: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 20 },
    activeTab: { backgroundColor: '#fff', borderBottomWidth: 2, borderBottomColor: '#1a1a1a', borderRadius: 0 },
    tabText: { color: '#999', fontWeight: '600' },
    activeTabText: { color: '#1a1a1a' },

    listContent: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    cardImage: { width: '100%', height: 120 },
    cardContent: { padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    priceText: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    serviceTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
    providerName: { fontSize: 12, color: '#666', marginBottom: 4 },
    dateText: { fontSize: 12, color: '#999', marginBottom: 16 },

    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    trackButton: { backgroundColor: '#00E676', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    trackButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    rebookButton: { backgroundColor: '#f5f5f5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    rebookText: { color: '#333', fontWeight: 'bold', fontSize: 12 },

    emptyText: { textAlign: 'center', color: '#999', marginTop: 40 }
});
