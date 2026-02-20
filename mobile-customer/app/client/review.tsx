import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/services/api';

const TAGS = ['Punctual', 'Professional', 'Clean work', 'Fair price', 'Great communication'];

export default function ReviewScreen() {
    const router = useRouter();
    const { requestId, providerName, providerAvatar } = useLocalSearchParams();
    const [rating, setRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const activeStar = (index: number) => {
        setRating(index);
    };

    const handleSubmit = async () => {
        if (rating === 0) return;

        try {
            setSubmitting(true);
            if (requestId) {
                await api.put(`/requests/${requestId}/review`, {
                    rating,
                    tags: selectedTags,
                    comment
                });
            }

            // Navigate back to history or home
            router.replace({
                pathname: '/client',
                params: {
                    payment_confirmed: 'true',
                    completed_request_id: String(requestId || '')
                }
            });
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Service</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Success Icon */}
                <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={40} color="#fff" />
                </View>

                <Text style={styles.title}>Job Completed!</Text>
                <Text style={styles.subtitle}>Everything went smoothly</Text>

                {/* Provider Info */}
                <View style={styles.providerCard}>
                    <Image
                        source={{ uri: (providerAvatar as string) || `https://ui-avatars.com/api/?name=${providerName || 'Provider'}&background=007AFF&color=fff` }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{providerName || 'Provider Name'}</Text>
                    <Text style={styles.profession}>Service Provider</Text>
                </View>

                <Text style={styles.question}>How was your experience?</Text>

                {/* Stars */}
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => activeStar(star)}>
                            <Ionicons
                                name="star"
                                size={40}
                                color={star <= rating ? "#00E676" : "#E0E0E0"}
                                style={{ marginHorizontal: 8 }}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Feedback */}
                <Text style={styles.sectionLabel}>QUICK FEEDBACK</Text>
                <View style={styles.tagsContainer}>
                    {TAGS.map(tag => (
                        <TouchableOpacity
                            key={tag}
                            style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
                            onPress={() => toggleTag(tag)}
                        >
                            <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Comment */}
                <Text style={styles.sectionLabel}>WRITE A COMMENT</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Tell us more about the service (optional)..."
                    multiline
                    numberOfLines={4}
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                />

                <TouchableOpacity
                    style={[styles.submitButton, rating === 0 && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={rating === 0 || submitting}
                >
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Feedback</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() =>
                        router.replace({
                            pathname: '/client',
                            params: {
                                payment_confirmed: 'true',
                                completed_request_id: String(requestId || '')
                            }
                        })
                    }
                >
                    <Text style={styles.skipText}>Skip for now</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60 },
    headerTitle: { fontSize: 16, fontWeight: 'bold' },

    content: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 40 },

    successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00E676', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: '#EAFAEF' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
    subtitle: { color: '#999', fontSize: 14, marginBottom: 32 },

    providerCard: { backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 24, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, marginBottom: 32 },
    avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 16 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    profession: { color: '#00E676', fontWeight: '500', marginTop: 4 },

    question: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 24 },
    starsRow: { flexDirection: 'row', marginBottom: 40 },

    sectionLabel: { alignSelf: 'flex-start', fontSize: 11, fontWeight: 'bold', color: '#999', marginBottom: 12, marginTop: 12 },

    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
    tagSelected: { borderColor: '#00E676', backgroundColor: '#E8F5E9' },
    tagText: { fontSize: 12, color: '#666' },
    tagTextSelected: { color: '#00E676', fontWeight: '600' },

    input: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', height: 120, textAlignVertical: 'top', color: '#333', borderWidth: 1, borderColor: '#eee' },

    submitButton: { width: '100%', backgroundColor: '#00E676', paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 32 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    disabledButton: { backgroundColor: '#ccc' },

    skipButton: { marginTop: 16, padding: 8 },
    skipText: { color: '#999', fontSize: 14 }
});
