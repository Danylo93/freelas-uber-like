import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/services/api';

type ProviderDetails = {
    id: string;
    name: string;
    category: string;
    rating: float;
    jobs_done: number;
    experience_years: number;
    description: string;
    price: number;
};

// Mock reviews for now as backend doesn't return them in provider details yet
const MOCK_REVIEWS = [
    { id: 1, name: 'Maria G.', date: '2 days ago', rating: 5, text: 'João fixed our burst pipe in no time. Super professional and left everything spotless.' },
    { id: 2, name: 'Ricardo S.', date: '1 week ago', rating: 4.8, text: 'Excellent service. Arrived in 20 minutes and solved the issue.' }
];

export default function ProviderProfileScreen() {
    const router = useRouter();
    const { providerId } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [provider, setProvider] = useState<ProviderDetails | null>(null);

    useEffect(() => {
        if (providerId) {
            fetchProviderDetails();
        }
    }, [providerId]);

    const fetchProviderDetails = async () => {
        try {
            const res = await api.get(`/providers/${providerId}`);
            setProvider(res.data);
        } catch (error) {
            console.error('Error fetching provider:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!provider) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Provider not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Professional Profile</Text>
                    <Ionicons name="share-social-outline" size={24} color="#1a1a1a" />
                </View>

                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: `https://ui-avatars.com/api/?name=${provider.name}&background=FF9800&color=fff&size=128` }} style={styles.avatar} />
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.name}>{provider.name}</Text>
                    <Text style={styles.category}>{provider.category}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-sharp" size={14} color="#666" />
                        <Text style={styles.location}>Sao Paulo, BR</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <View style={styles.statRow}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.statValue}>{provider.rating.toFixed(1)}</Text>
                        </View>
                        <Text style={styles.statLabel}>RATING</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{provider.jobs_done || 0}+</Text>
                        <Text style={styles.statLabel}>JOBS DONE</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{provider.experience_years || 0}</Text>
                        <Text style={styles.statLabel}>YEARS EXP.</Text>
                    </View>
                </View>

                {/* About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.sectionText}>
                        {provider.description || "Specializing in residential and commercial services. I pride myself on punctuality, cleanliness, and high-quality repairs."}
                    </Text>
                    <Text style={styles.readMore}>Read more</Text>
                </View>

                {/* Recent Reviews */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Recent Reviews</Text>
                        <Text style={styles.viewAll}>View all</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
                        {MOCK_REVIEWS.map(review => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Image source={{ uri: `https://ui-avatars.com/api/?name=${review.name}&background=random` }} style={styles.reviewAvatar} />
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={styles.reviewName}>{review.name}</Text>
                                        <Text style={styles.reviewDate}>{review.date}</Text>
                                    </View>
                                    <View style={{ flex: 1 }} />
                                    <View style={{ flexDirection: 'row' }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Ionicons key={s} name="star" size={10} color="#FFD700" />
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.reviewText} numberOfLines={3}>{review.text}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            {/* Floating Bottom Action */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.chatButton}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => {
                        // In real flow, pass provider to request creation
                        router.back();
                    }}
                >
                    <Ionicons name="calendar" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.bookButtonText}>Book Service</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60 },
    headerTitle: { fontSize: 16, fontWeight: 'bold' },

    profileSection: { alignItems: 'center', marginTop: 10 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
    verifiedBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#00B0FF', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
    name: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
    category: { fontSize: 16, color: '#00B0FF', fontWeight: '500', marginTop: 4 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    location: { color: '#666', fontSize: 14, marginLeft: 4 },

    statsContainer: { flexDirection: 'row', backgroundColor: '#fff', margin: 24, padding: 20, borderRadius: 16, justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    statLabel: { fontSize: 10, color: '#999', marginTop: 4, letterSpacing: 0.5 },
    statDivider: { width: 1, height: '100%', backgroundColor: '#eee' },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

    section: { paddingHorizontal: 24, marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
    sectionText: { color: '#666', lineHeight: 22 },
    readMore: { color: '#00B0FF', marginTop: 8, fontWeight: '500' },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    viewAll: { color: '#00B0FF', fontSize: 14 },

    reviewCard: { width: 280, backgroundColor: '#fff', padding: 16, borderRadius: 16, marginRight: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
    reviewName: { fontSize: 14, fontWeight: 'bold' },
    reviewDate: { fontSize: 10, color: '#999' },
    reviewText: { color: '#666', fontSize: 12, lineHeight: 18, fontStyle: 'italic' },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 24, paddingBottom: 40, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    chatButton: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    bookButton: { flex: 1, height: 50, backgroundColor: '#03A9F4', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
