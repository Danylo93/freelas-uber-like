import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Alert,
  ActivityIndicator, Animated, Dimensions, StatusBar, TextInput, Image,
  Platform, ScrollView
} from 'react-native';
import CustomMapView, { LatLng } from '@/src/components/CustomMapView';
import CarMarker from '@/src/components/CarMarker';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSocket } from '../../src/contexts/SocketContext';
import api from '@/src/services/api';
import { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// --- TYPES ---
interface Provider {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
  rating: number;
  distance: number;
  user_id: string;
  phone?: string;
}

interface ServiceRequest {
  id: string;
  job_id?: string;
  provider_id: string;
  status: string;
  provider_name: string;
  provider_phone: string;
  category: string;
  price: number;
  estimated_time?: number;
  provider_latitude?: number;
  provider_longitude?: number;
  created_at?: string;
}

// Mock Categories for UI
const CATEGORIES = [
  { id: '1', name: 'Canalizador', icon: 'water', lib: 'Ionicons' },
  { id: '2', name: 'Eletricista', icon: 'bolt', lib: 'FontAwesome5' },
  { id: '3', name: 'Limpeza', icon: 'cleaning-services', lib: 'MaterialIcons' },
  { id: '4', name: 'Mudanças', icon: 'truck', lib: 'FontAwesome5' },
  { id: '5', name: 'Pintura', icon: 'format-paint', lib: 'MaterialIcons' },
  { id: '6', name: 'Jardinagem', icon: 'leaf', lib: 'Ionicons' },
];

const ACTIVE_REQUEST_STATUSES = new Set([
  'pending',
  'offered',
  'accepted',
  'in_progress',
  'near_client',
  'started',
]);

export default function ClientScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const paymentConfirmed = params.payment_confirmed === 'true';
  const completedRequestId = typeof params.completed_request_id === 'string' ? params.completed_request_id : undefined;
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  // --- STATE ---
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // UI State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Animations
  const searchBarAnim = useRef(new Animated.Value(-100)).current;
  const categoriesAnim = useRef(new Animated.Value(200)).current;
  const providerListAnim = useRef(new Animated.Value(height)).current;
  const activeRequestAnim = useRef(new Animated.Value(height)).current;
  const currentRequestRef = useRef<ServiceRequest | null>(null);
  const hasNavigatedToPaymentRef = useRef(false);

  useEffect(() => {
    currentRequestRef.current = currentRequest;
  }, [currentRequest]);

  const joinJobRoom = useCallback((jobId?: string) => {
    if (socket && jobId) {
      socket.emit('join_job', jobId);
    }
  }, [socket]);

  const navigateToPayment = useCallback((request: ServiceRequest | null) => {
    if (!request || hasNavigatedToPaymentRef.current) return;
    hasNavigatedToPaymentRef.current = true;
    router.push({
      pathname: '/client/payment',
      params: {
        request_id: request.id,
        amount: String(request.price || 0),
        provider_name: request.provider_name || '',
      }
    });
  }, [router]);

  const loadActiveRequest = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await api.get(`/requests/client/${user.id}`, true);
      const requests = Array.isArray(response.data) ? response.data : [];
      const normalizedRequests: ServiceRequest[] = requests.map((r: any) => ({
        id: r.id,
        job_id: r.job_id ?? r.jobId,
        provider_id: r.provider_id ?? r.providerId ?? '',
        status: (r.status || '').toLowerCase(),
        provider_name: r.provider_name || '',
        provider_phone: r.provider_phone || '',
        category: r.category || '',
        price: Number(r.price || 0),
        provider_latitude: r.provider_latitude,
        provider_longitude: r.provider_longitude,
        created_at: r.created_at,
      }));

      const active = normalizedRequests.find((r) => ACTIVE_REQUEST_STATUSES.has((r.status || '').toLowerCase()));
      if (!active) {
        const current = currentRequestRef.current;
        if (current && !ACTIVE_REQUEST_STATUSES.has((current.status || '').toLowerCase())) {
          setCurrentRequest(null);
        }
        return;
      }

      setCurrentRequest((prev) => prev ? { ...prev, ...active } : active);
      if (active.job_id) {
        joinJobRoom(active.job_id);
      }
    } catch (error) {
      console.error('Failed to load active request:', error);
    }
  }, [joinJobRoom, user?.id]);

  useEffect(() => {
    getCurrentLocation();
    loadProviders();
    void loadActiveRequest();

    // Intro Animation
    Animated.parallel([
      Animated.spring(searchBarAnim, { toValue: 0, useNativeDriver: true }),
      Animated.spring(categoriesAnim, { toValue: 0, useNativeDriver: true, delay: 100 }),
    ]).start();
  }, []);

  // Filter providers when category changes
  useEffect(() => {
    if (selectedCategory) {
      const filtered = providers.filter(p => {
        if (!p.category) return false;
        const categoryLower = p.category.toLowerCase();
        const selectedLower = selectedCategory.toLowerCase();

        // Map category names (provider uses "Encanador", customer uses "Canalizador")
        const categoryMappings: Record<string, string[]> = {
          'canalizador': ['canalizador', 'encanador', 'plumber', 'plumbing'],
          'eletricista': ['eletricista', 'electrical', 'electric'],
          'limpeza': ['limpeza', 'cleaning', 'clean'],
          'pintura': ['pintura', 'painting', 'paint'],
          'mudanças': ['mudanças', 'moving', 'move'],
          'jardinagem': ['jardinagem', 'gardening', 'garden']
        };

        // Check direct match
        if (categoryLower.includes(selectedLower) || selectedLower.includes(categoryLower)) {
          return true;
        }

        // Check mapped categories
        const mappings = categoryMappings[selectedLower];
        if (mappings) {
          return mappings.some(m => categoryLower.includes(m));
        }

        return false;
      });
      setFilteredProviders(filtered);

      // Animate Provider List Up
      Animated.spring(providerListAnim, { toValue: 0, useNativeDriver: true }).start();
      Animated.timing(categoriesAnim, { toValue: 200, useNativeDriver: true }).start(); // Hide categories
    } else {
      setFilteredProviders([]);
      Animated.spring(providerListAnim, { toValue: height, useNativeDriver: true }).start();
      Animated.timing(categoriesAnim, { toValue: 0, useNativeDriver: true }).start(); // Show categories
    }
  }, [selectedCategory, providers]);

  // Request State Animations
  useEffect(() => {
    if (currentRequest) {
      Animated.spring(activeRequestAnim, { toValue: 0, useNativeDriver: true }).start();
      Animated.timing(searchBarAnim, { toValue: -100, useNativeDriver: true }).start();
      Animated.timing(categoriesAnim, { toValue: 200, useNativeDriver: true }).start();
      Animated.timing(providerListAnim, { toValue: height, useNativeDriver: true }).start();
    } else {
      Animated.spring(activeRequestAnim, { toValue: height, useNativeDriver: true }).start();
      if (!selectedCategory) {
        Animated.timing(searchBarAnim, { toValue: 0, useNativeDriver: true }).start();
        Animated.timing(categoriesAnim, { toValue: 0, useNativeDriver: true }).start();
      }
    }
  }, [currentRequest]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (error) { console.error(error); }
  };

  const loadProviders = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const response = await api.get('/providers');
      console.log('📋 [PROVIDERS] Resposta do backend:', response);
      // Map backend response to app format
      const mappedProviders = (response.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || 'Geral',
        price: p.price || 50,
        description: p.description || `Serviço profissional`,
        latitude: p.latitude || p.currentLat || 0,
        longitude: p.longitude || p.currentLng || 0,
        address: p.address || '',
        status: p.status || (p.isOnline ? 'online' : 'offline'),
        rating: p.rating || 0,
        distance: 0, // Will be calculated based on user location
        user_id: p.user_id,
        phone: p.phone || ''
      }));
      console.log('📋 [PROVIDERS] Providers mapeados:', mappedProviders.length);
      setProviders(mappedProviders);
    } catch (e: any) {
      console.error('❌ [PROVIDERS] Erro ao carregar:', e);
      const status = e.response?.status;
      if (status === 503) {
        setErrorMsg('Servidor indisponível temporariamente (503). Tente novamente.');
      } else {
        setErrorMsg('Não foi possível carregar os prestadores. Verifique sua conexão.');
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!socket) return;

    const onOfferReceived = (data: any) => {
      const activeRequest = currentRequestRef.current;
      const status = (activeRequest?.status || '').toLowerCase();
      if (status && status !== 'pending' && status !== 'offered') return;
      if (data.requestId && activeRequest && data.requestId !== activeRequest.id) return;
      const requestId = activeRequest?.id || data.requestId;
      if (!requestId) return;
      router.push({ pathname: '/client/offers', params: { requestId } });
    };

    const onJobAccepted = (data: any) => {
      const jobId = data.jobId || data.job_id;
      const providerId = data.providerId || data.provider_id;
      setCurrentRequest((prev) => prev ? {
        ...prev,
        status: 'accepted',
        job_id: jobId || prev.job_id,
        provider_id: providerId || prev.provider_id
      } : prev);
      if (jobId) {
        joinJobRoom(jobId);
      }
    };

    const onLocationUpdate = (data: any) => {
      const activeRequest = currentRequestRef.current;
      if (!activeRequest) return;
      const currentJobId = activeRequest.job_id || activeRequest.id;
      if (data.jobId && data.jobId !== currentJobId) return;
      setCurrentRequest((prev) => prev ? {
        ...prev,
        provider_latitude: data.lat,
        provider_longitude: data.lng,
      } : prev);
    };

    const onJobStatusUpdate = (data: any) => {
      const activeRequest = currentRequestRef.current;
      if (!activeRequest) return;
      const currentJobId = activeRequest.job_id || activeRequest.id;
      if (data.jobId && data.jobId !== currentJobId) return;
      const nextStatus = (data.status || '').toLowerCase();
      setCurrentRequest((prev) => prev ? { ...prev, status: nextStatus } : prev);
      if (nextStatus === 'completed') {
        navigateToPayment({ ...activeRequest, status: nextStatus });
      }
    };

    socket.on('offer_received', onOfferReceived);
    socket.on('job_accepted', onJobAccepted);
    socket.on('location_update', onLocationUpdate);
    socket.on('job_status_update', onJobStatusUpdate);

    return () => {
      socket.off('offer_received', onOfferReceived);
      socket.off('job_accepted', onJobAccepted);
      socket.off('location_update', onLocationUpdate);
      socket.off('job_status_update', onJobStatusUpdate);
    };
  }, [joinJobRoom, navigateToPayment, router, socket]);

  useEffect(() => {
    if (socket && currentRequest?.job_id) {
      joinJobRoom(currentRequest.job_id);
    }
  }, [currentRequest?.job_id, joinJobRoom, socket, isConnected]);

  useEffect(() => {
    if (!user?.id) return;
    void loadActiveRequest();
    const interval = setInterval(() => {
      void loadActiveRequest();
    }, 7000);
    return () => clearInterval(interval);
  }, [loadActiveRequest, user?.id]);

  useEffect(() => {
    if (currentRequest?.status === 'completed') {
      navigateToPayment(currentRequest);
      return;
    }
    if (currentRequest && ACTIVE_REQUEST_STATUSES.has((currentRequest.status || '').toLowerCase())) {
      hasNavigatedToPaymentRef.current = false;
    }
  }, [currentRequest, navigateToPayment]);

  useEffect(() => {
    if (!paymentConfirmed) return;
    const current = currentRequestRef.current;
    if (!current) return;
    if (!completedRequestId || completedRequestId === current.id) {
      setCurrentRequest(null);
      hasNavigatedToPaymentRef.current = false;
    }
  }, [completedRequestId, paymentConfirmed]);

  const handleRequestService = async (provider: Provider) => {
    if (!userLocation) { Alert.alert('Erro', 'Localização necessária'); return; }
    setRequestLoading(true);
    try {
      const response = await api.post('/requests', {
        categoryId: provider.category || selectedCategory || 'general',
        description: 'Solicitacao via App',
        pickupLat: userLocation.latitude,
        pickupLng: userLocation.longitude,
        price: provider.price,
        address: ''
      });

      setCurrentRequest({
        id: response.data.id,
        provider_id: provider.user_id,
        status: 'pending',
        provider_name: provider.name,
        provider_phone: provider.phone || '',
        category: provider.category,
        price: provider.price,
        estimated_time: undefined
      });
      hasNavigatedToPaymentRef.current = false;

      setSelectedProvider(null);
      setSelectedCategory(null);
    } catch (e) {
      Alert.alert('Erro', 'Falha ao solicitar serviço');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!currentRequest) return;
    try {
      await api.put(`/requests/${currentRequest.id}/review`, { rating, comment: ratingComment });
      Alert.alert('Obrigado!', 'Avaliação enviada.');
      setShowRatingModal(false);
      setCurrentRequest(null);
      setRating(5);
    } catch (e) { Alert.alert('Erro', 'Falha ao enviar avaliação'); }
  };

  // --- RENDERERS ---

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => setSelectedCategory(item.name === selectedCategory ? null : item.name)}
    >
      <View style={[styles.categoryIconCircle, selectedCategory === item.name && styles.categoryIconCircleSelected]}>
        {item.lib === 'Ionicons' && <Ionicons name={item.icon} size={24} color={selectedCategory === item.name ? "#fff" : "#007AFF"} />}
        {item.lib === 'MaterialIcons' && <MaterialIcons name={item.icon} size={24} color={selectedCategory === item.name ? "#fff" : "#007AFF"} />}
        {item.lib === 'FontAwesome5' && <FontAwesome5 name={item.icon} size={20} color={selectedCategory === item.name ? "#fff" : "#007AFF"} />}
      </View>
      <Text style={[styles.categoryName, selectedCategory === item.name && styles.categoryNameSelected]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProviderCard = ({ item }: { item: Provider }) => (
    <TouchableOpacity
      style={styles.providerCard}
      onPress={() => router.push({ pathname: '/client/provider_profile', params: { providerId: item.id } })}
    >
      <View style={styles.providerRow}>
        <Image source={{ uri: `https://ui-avatars.com/api/?name=${item.name}&background=random` }} style={styles.providerAvatar} />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)} (120 reviews)</Text>
          </View>
          <Text style={styles.etaText}>Chega em ~15 mins</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceLabel}>Inicia em</Text>
          <Text style={styles.priceValue}>R$ {item.price}</Text>
        </View>
      </View>

      <View style={styles.providerActions}>
        <TouchableOpacity style={styles.viewProfileBtn}>
          <Text style={styles.viewProfileText}>Ver Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.requestBtn} onPress={() => handleRequestService(item)}>
          <Text style={styles.requestBtnText}>Solicitar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} testID="customer-home-screen">
      <StatusBar barStyle="dark-content" />

      {/* BACKGROUND MAP */}
      <CustomMapView
        style={StyleSheet.absoluteFillObject}
        origin={currentRequest?.provider_latitude && currentRequest?.provider_longitude ? { latitude: currentRequest.provider_latitude, longitude: currentRequest.provider_longitude } : undefined}
        destination={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : undefined}
        showsUserLocation={true}
        initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 } : undefined}
      >
        {/* Render Providers Pins if Category Selected */}
        {selectedCategory && filteredProviders.map(p => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.name}
            description={`R$ ${p.price}`}
          >
            <View style={styles.markerContainer}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          </Marker>
        ))}

        {/* Active Provider Car Marker */}
        {currentRequest && currentRequest.provider_latitude && currentRequest.provider_longitude && (
          <CarMarker
            position={{ latitude: currentRequest.provider_latitude, longitude: currentRequest.provider_longitude }}
          />
        )}
      </CustomMapView>

      {/* --- HOME OVERLAYS --- */}

      {/* Tracking Top Bar (Visible only when request active) */}
      {currentRequest && (
        <>
          <View style={styles.floatingTopBar}>
            <TouchableOpacity style={styles.roundBtnSmall}><Ionicons name="chevron-back" size={24} color="#333" /></TouchableOpacity>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: '#007AFF' }]} />
              <Text style={styles.statusPillText}>{currentRequest.provider_name.split(' ')[0]} está a 2km</Text>
            </View>
            <TouchableOpacity style={styles.roundBtnSmall}><Ionicons name="help-circle-outline" size={24} color="#333" /></TouchableOpacity>
          </View>

          <View style={styles.rightFloatButtons}>
            <TouchableOpacity style={styles.fabButton}><Ionicons name="call" size={24} color="#fff" /></TouchableOpacity>
            <TouchableOpacity style={styles.fabButtonWhite}><Ionicons name="locate" size={24} color="#333" /></TouchableOpacity>
            <View style={styles.zoomControls}>
              <TouchableOpacity style={styles.zoomBtn}><Ionicons name="add" size={24} color="#333" /></TouchableOpacity>
              <View style={styles.zoomDivider} />
              <TouchableOpacity style={styles.zoomBtn}><Ionicons name="remove" size={24} color="#333" /></TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Search Bar - Hidden if request active */}
      {!currentRequest && (
        <Animated.View style={[styles.searchContainer, { transform: [{ translateY: searchBarAnim }] }]}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() =>
              Alert.alert(
                'Menu',
                undefined,
                [
                  { text: 'Perfil', onPress: () => router.push('/profile') },
                  { text: 'Histórico', onPress: () => router.push('/client/history') },
                  __DEV__ ? { text: 'Debug', onPress: () => router.push('/debug') } : null,
                  { text: 'Sair', style: 'destructive', onPress: logout },
                  { text: 'Cancelar', style: 'cancel' },
                ].filter(Boolean) as any
              )
            }
          >
            <Ionicons name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <Text style={styles.placeholderText}>De qual serviço você precisa?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
            <Image source={{ uri: `https://ui-avatars.com/api/?name=${user?.name}` }} style={styles.profileAvatar} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Categories List */}
      <Animated.View style={[styles.categoriesContainer, { transform: [{ translateY: categoriesAnim }] }]}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <FlatList
          horizontal
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
      </Animated.View>

      {/* --- PROVIDER LIST OVERLAY --- */}
      <Animated.View style={[styles.providerListContainer, { transform: [{ translateY: providerListAnim }] }]}>
        <View style={styles.handleBar} />
        <View style={styles.providerListHeader}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.listTitle}>{selectedCategory}s Disponíveis</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredProviders}
            renderItem={renderProviderCard}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
                <Text style={{ color: errorMsg ? '#F44336' : '#666', textAlign: 'center', marginBottom: 10 }}>
                  {errorMsg || 'Nenhum profissional encontrado.'}
                </Text>
                {errorMsg && (
                  <TouchableOpacity onPress={loadProviders} style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#E3F2FD', borderRadius: 8 }}>
                    <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Tentar Novamente</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
      </Animated.View>

      {/* --- ACTIVE REQUEST TRAKING OVERLAY --- */}
      <Animated.View style={[styles.activeRequestCard, { transform: [{ translateY: activeRequestAnim }] }]}>
        <View style={styles.dragHandle} />

        {paymentConfirmed && (
            <View style={styles.paymentConfirmedBadge}>
                 <Text style={styles.paymentConfirmedText}>PAGAMENTO CONFIRMADO</Text>
            </View>
        )}

        {/* Arriving Header */}
        <View style={styles.arrivingHeader}>
          <Text style={styles.arrivingLabel}>CHEGANDO EM</Text>
          <View style={styles.arrivingRow}>
            <Text style={styles.arrivingTime}>8 mins</Text>
            <Text style={styles.arrivingDistance}>2 km</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Provider Profile Row - Styled like mockup */}
        <View style={styles.proInfoRowNew}>
          <Image source={{ uri: `https://ui-avatars.com/api/?name=${currentRequest?.provider_name}` }} style={styles.proAvatarMock} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.proNameMock}>{currentRequest?.provider_name}</Text>
            <Text style={styles.proJobMock}>Licenciado em {currentRequest?.category}</Text>
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color="#00E676" />
              <Text style={styles.verifiedText}>Profissional Verificado</Text>
            </View>
          </View>
          <View style={styles.ratingBadgeMock}>
            <Text style={styles.ratingTextMock}>4.9</Text>
            <Ionicons name="star" size={10} color="#fff" />
          </View>
        </View>

        {/* Big Action Buttons */}
        <View style={styles.actionButtonsRowNew}>
          <TouchableOpacity style={styles.messageButtonMain}>
            <Ionicons name="chatbubble" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.messageButtonText}>Mensagem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.offersButton}
          onPress={() => router.push({ pathname: '/client/offers', params: { requestId: currentRequest?.id } })}
        >
          <Text style={styles.offersButtonText}>Ver propostas</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* RATING MODAL */}
      <Modal visible={showRatingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModal}>
            <Text style={styles.ratingTitle}>Avalie o Serviço</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Ionicons name={i <= rating ? "star" : "star-outline"} size={32} color="#FFD700" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.commentInput} placeholder="Comentário..." value={ratingComment} onChangeText={setRatingComment} />
            <TouchableOpacity style={styles.submitRatingBtn} onPress={handleRatingSubmit}>
              <Text style={styles.submitRatingText}>Enviar Avaliação</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Search Bar
  searchContainer: {
    position: 'absolute', top: 50, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  menuButton: { width: 44, height: 44, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
  searchBar: {
    flex: 1, marginHorizontal: 12, height: 44, backgroundColor: '#fff', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.1, elevation: 4
  },
  placeholderText: { color: '#999', marginLeft: 8 },
  profileButton: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
  profileAvatar: { width: '100%', height: '100%' },

  // Categories
  categoriesContainer: {
    position: 'absolute', bottom: 30, left: 0, right: 0,
    backgroundColor: 'transparent' // visualmente flutuando ou com fundo branco se preferir
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 10, color: '#333', textShadowColor: '#fff', textShadowRadius: 4 },
  categoryCard: {
    marginRight: 16, alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3, width: 100
  },
  categoryIconCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8
  },
  categoryIconCircleSelected: { backgroundColor: '#007AFF' },
  categoryName: { fontSize: 12, fontWeight: '600', color: '#666' },
  categoryNameSelected: { color: '#007AFF' },

  // Provider List Overlay
  providerListContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.65,
    backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 20, paddingBottom: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, elevation: 20
  },
  handleBar: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  providerListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { padding: 4 },
  listTitle: { fontSize: 18, fontWeight: 'bold' },
  filterButton: { padding: 4 },

  providerCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f0f0f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, elevation: 2
  },
  providerRow: { flexDirection: 'row', marginBottom: 16 },
  providerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  providerInfo: { flex: 1, marginLeft: 12 },
  providerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, color: '#666', marginLeft: 4 },
  etaText: { fontSize: 12, color: '#999', marginTop: 2 },
  priceTag: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 10, color: '#999' },
  priceValue: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  providerActions: { flexDirection: 'row', gap: 12 },
  viewProfileBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  viewProfileText: { color: '#666', fontWeight: '600' },
  requestBtn: { flex: 1, backgroundColor: '#007AFF', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  requestBtnText: { color: '#fff', fontWeight: '600' },

  // Active Request (Mockup Style)
  activeRequestCard: {
    position: 'absolute', bottom: 30, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, elevation: 15
  },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#eee', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  arrivingHeader: { marginBottom: 20 },
  arrivingLabel: { fontSize: 10, color: '#00B0FF', fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  arrivingRow: { flexDirection: 'row', alignItems: 'baseline' },
  arrivingTime: { fontSize: 32, fontWeight: 'bold', color: '#1a1a1a', marginRight: 8 },
  arrivingDistance: { fontSize: 16, color: '#999', fontWeight: '500' },

  proInfoRowNew: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  proAvatarMock: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  proNameMock: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  proJobMock: { fontSize: 12, color: '#666', marginTop: 2 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  verifiedText: { fontSize: 10, color: '#00E676', fontWeight: 'bold', marginLeft: 4 },

  ratingBadgeMock: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 'auto' },
  ratingTextMock: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginRight: 4 },

  actionButtonsRowNew: { flexDirection: 'row', marginTop: 24, gap: 12 },
  messageButtonMain: { flex: 1, backgroundColor: '#00B0FF', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56 },
  messageButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  shareButton: { width: 56, height: 56, backgroundColor: '#f5f5f5', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  offersButton: { marginTop: 12, backgroundColor: '#E3F2FD', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  offersButtonText: { color: '#007AFF', fontWeight: '600' },

  // Floating Controls
  floatingTopBar: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  roundBtnSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, height: 40, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
  statusPillText: { marginLeft: 8, fontWeight: '600', fontSize: 13 },

  rightFloatButtons: { position: 'absolute', top: 120, right: 20, alignItems: 'center', gap: 12, zIndex: 10 },
  fabButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00B0FF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, elevation: 5 },
  fabButtonWhite: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
  zoomControls: { backgroundColor: '#fff', borderRadius: 12, width: 48, alignItems: 'center', paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
  zoomBtn: { padding: 8 },
  zoomDivider: { width: 24, height: 1, backgroundColor: '#eee' },

  // Markers
  markerContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },

  // Rating Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  ratingModal: { width: width - 60, backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center' },
  ratingTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  starsContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  commentInput: { width: '100%', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, height: 80, textAlignVertical: 'top', marginBottom: 20 },
  submitRatingBtn: { backgroundColor: '#007AFF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  submitRatingText: { color: '#fff', fontWeight: 'bold' },

  paymentConfirmedBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4CAF50'
  },
  paymentConfirmedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1
  }
});

// Fixing TouchableOpity Typo
const TouchableOpity = TouchableOpacity;
