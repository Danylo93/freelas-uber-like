import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
                    <Ionicons name="apps" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Ionicons name="construct-outline" size={80} color="#ccc" />
                <Text style={styles.title}>Admin Panel</Text>
                <Text style={styles.subtitle}>
                    This area is reserved for administrators to manage users, disputes, and settings.
                </Text>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>1,204</Text>
                        <Text style={styles.statLabel}>Users</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>85</Text>
                        <Text style={styles.statLabel}>Active Jobs</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: Platform.OS === 'android' ? 30 : 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    backButton: { padding: 8, backgroundColor: '#fff', borderRadius: 12 },

    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginTop: 24, marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40, lineHeight: 22 },

    statsRow: { flexDirection: 'row', gap: 20 },
    statCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', width: 120, shadowColor: '#000', shadowOpacity: 0.05, elevation: 5 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#00B0FF' },
    statLabel: { fontSize: 12, color: '#999', marginTop: 4 }
});
