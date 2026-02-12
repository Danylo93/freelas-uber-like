import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  TextInput,
  Image,
  SafeAreaView,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSocket } from '../../src/contexts/SocketContext';
import api from '@/src/services/api';

// Components
import CustomMapView, { LatLng } from '@/src/components/CustomMapView';

const { width, height } = Dimensions.get('window');

// Types
interface ServiceRequest {
  id: string; // Request id
  job_id?: string;
  provider_id?: string;
  client_name: string;
  client_phone: string;
  category: string;
  description: string;
  price: number;
  distance?: number;
  client_address: string;
  status: string;
  client_latitude: number;
  client_longitude: number;
  created_at: string;
}

const ACTIVE_REQUEST_STATUSES = ['accepted', 'in_progress', 'near_client', 'started'];

export default function ProviderScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  // Data State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [servicePhoto, setServicePhoto] = useState<string | null>(null);
  const [serviceDescription, setServiceDescription] = useState('');

  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Active Request Ref for location watcher
  const activeRequestRef = useRef<ServiceRequest | null>(null);

  useEffect(() => {
    activeRequestRef.current = activeRequest;
  }, [activeRequest]);

  useEffect(() => {
    getCurrentLocation();
    setupSocketListeners();
    loadRequests();

    // Fade in intro
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Slide up animation for incoming requests
    if (selectedRequest) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
    }
  }, [user?.id]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const current = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      } as any);

      // Start watcher
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 2000, distanceInterval: 10 },
        async (loc) => {
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;

          // Update local state if needed or just sync to backend
          try {
            // Send to Socket if Active Request (for real-time tracking)
            const jobId = activeRequestRef.current?.job_id;
            if (jobId && socket) {
              console.log('???? [PROVIDER] Sending location ping via socket');
              socket.emit('location_ping', {
                jobId,
                lat,
                lng
              });
            }

            // Sync with DB if online
            if (isOnline) {
              try {
                console.log('📍 [PROVIDER] Atualizando localização no backend...');
                await api.put('/provider/location', {
                  lat: lat,
                  lng: lng,
                  isOnline: isOnline
                });
                console.log('✅ [PROVIDER] Localização atualizada');
              } catch (error: any) {
                console.error('❌ [PROVIDER] Erro ao atualizar localização:', error.message);
                // Não mostrar alerta - erro não crítico
              }
            }
          } catch (e: any) {
             console.error('❌ [PROVIDER] Erro geral na atualização de localização:', e.message);
          }
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    // Updated Event Name: request_offer (from backend)
    socket.on('request_offer', (data) => {
      console.log('🔔 [SOCKET] request_offer received:', data);
      loadRequests();
      // Auto-select the first new request for the "Incoming" UI flow
      // In a real app, we might queue them.
      // For now, we assume one request comes in and we show it.

      // If we received a request_offer, we might want to fetch it directly or rely on loadRequests
      // For better UX, we could construct a partial request object from data if API is slow
    });

    socket.on('request_cancelled', (data) => {
      loadRequests();
      if (activeRequest?.id === data.request_id) {
        setActiveRequest(null);
        Alert.alert('Cancelado', 'O cliente cancelou a solicitação.');
      }
      if (selectedRequest?.id === data.request_id) {
        setSelectedRequest(null);
      }
    });

    socket.on('job_accepted', (data) => {
       // Confirmation that job was accepted
       console.log('✅ [SOCKET] Job accepted confirmed:', data);
    });
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      console.log('📋 [PROVIDER] Carregando requests...');
      const response = await api.get('/requests', true); // requiresAuth = true
      console.log('✅ [PROVIDER] Requests carregados:', response.data?.length || 0);
      
      const normalized = (response.data || []).map((r: ServiceRequest) => ({
        ...r,
        status: (r.status || '').toLowerCase(),
        job_id: (r as any).job_id ?? (r as any).jobId,
        provider_id: (r as any).provider_id ?? (r as any).providerId
      }));

      const pending = normalized.filter((r: ServiceRequest) => r.status === 'pending');
      const active = normalized.find((r: ServiceRequest) =>
        ACTIVE_REQUEST_STATUSES.includes(r.status) &&
        !!user?.id &&
        String(r.provider_id || '') === String(user.id)
      );

      setRequests(pending);
      setActiveRequest(active || null);

      if (active) {
        // Join the job room
        if (socket && active.job_id) socket.emit('join_job', active.job_id);
      } else {
        setShowServiceModal(false);
      }

      setSelectedRequest((prev) => {
        if (active || !isOnline || pending.length === 0) return null;
        if (!prev) return pending[0];
        return pending.find((r) => r.id === prev.id) || pending[0];
      });

    } catch (e: any) {
      console.error('❌ [PROVIDER] Erro ao carregar requests:', e.message);
      // Não mostrar alerta - pode ser que não haja requests ainda
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    const nextOnline = !isOnline;
    setIsOnline(nextOnline);
    if (!nextOnline) setSelectedRequest(null);
    if (nextOnline) loadRequests();

    if (!userLocation) return;

    try {
      await api.put('/provider/location', {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        isOnline: nextOnline
      });
    } catch (e: any) {
      console.error('[PROVIDER] Failed to update online status:', e.message);
    }
  };

  const handleAccept = async () => {
    if (!selectedRequest) return;
    try {
      const response = await api.put(`/requests/${selectedRequest.id}/accept`, {});
      const jobId = response.data?.job_id ?? response.data?.jobId;
      setActiveRequest({ ...selectedRequest, status: 'accepted', job_id: jobId });
      // Join job room
      if (socket && jobId) socket.emit('join_job', jobId);

      setSelectedRequest(null);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível aceitar.');
    }
  };

  const handleDecline = () => {
    setSelectedRequest(null);
    // Logic to hide this specific request or inform backend
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!activeRequest) return;
    try {
      await api.put(`/requests/${activeRequest.id}/update-status`, { status: newStatus });
      setActiveRequest(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteService = async () => {
    if (!activeRequest || !servicePhoto) {
      Alert.alert('Foto necessária', 'Tire uma foto do serviço realizado.');
      return;
    }
    try {
      await api.put(`/requests/${activeRequest.id}/update-status`, {
        status: 'completed',
        photo_url: servicePhoto,
        message: serviceDescription || 'Concluído'
      });
      setActiveRequest(null);
      setShowServiceModal(false);
      setServicePhoto(null);
      setServiceDescription('');
      Alert.alert('Sucesso', 'Serviço finalizado!');
      loadRequests();
    } catch (e) {
      Alert.alert('Erro', 'Falha ao finalizar serviço.');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setServicePhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // --- RENDER HELPERS ---

  const renderIdleOverlay = () => (
    <>
      {/* Top Status Card */}
      <View style={styles.topCardContainer}>
        <View style={styles.topCard}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.welcomeText}>Bem-vindo,</Text>
              <Text style={styles.userName}>{user?.name || 'Prestador'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            {requests.length > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>

        <View style={styles.systemStatusCard}>
          <View>
            <Text style={styles.systemStatusTitle}>Status do Sistema</Text>
            <Text style={styles.systemStatusSubtitle}>
              {isOnline ? 'Você está online e visível' : 'Você está offline'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleButton, isOnline ? styles.toggleOn : styles.toggleOff]}
            onPress={handleToggleOnline}
          >
            <Text style={[styles.toggleText, isOnline ? styles.toggleTextOn : styles.toggleTextOff]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Earnings/Waiting Card */}
      <View style={styles.bottomCardContainer}>
        <View style={styles.statsCard}>
          <TouchableOpacity style={styles.statsRow} onPress={() => router.push('/provider/wallet')}>
            <View>
              <Text style={styles.statsLabel}>Ganhos de Hoje</Text>
              <Text style={styles.statsValue}>R$ 145,00</Text>
            </View>
            <View style={styles.statsBadge}>
              <Text style={styles.statsBadgeText}>+12%</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {isOnline ? (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 10 }} />
              <Text style={styles.waitingText}>Procurando solicitações...</Text>
            </View>
          ) : (
            <Text style={styles.offlineText}>Fique online para receber pedidos</Text>
          )}

          <TouchableOpacity style={styles.refreshButton} onPress={loadRequests}>
            <Text style={styles.refreshButtonText}>Atualizar Area</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderIncomingRequest = () => (
    <Animated.View style={[styles.incomingContainer, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.incomingCard}>
        <View style={styles.incomingHeader}>
          <Ionicons name="notifications" size={24} color="#000" />
          <Text style={styles.incomingTitle}>Nova Solicitação</Text>
        </View>

        {/* Mini map preview placeholder - in real app could be a static map image */}
        <View style={styles.mapPreview}>
          <View style={styles.mapPin}>
            <Ionicons name="location" size={32} color="#007AFF" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.requestInfoContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.requestCategory}>{selectedRequest?.category}</Text>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>4.9</Text>
            <View style={{ flexDirection: 'row' }}>
              {[1, 2, 3, 4, 5].map(i => <Ionicons key={i} name="star" size={12} color="#FFD700" />)}
            </View>
            <Text style={styles.clientNamePreview}>Cliente: {selectedRequest?.client_name}</Text>
          </View>

          <View style={styles.tripDetailsRow}>
            <View style={styles.tripDetailItem}>
              <Ionicons name="paper-plane-outline" size={20} color="#666" />
              <Text style={styles.tripDetailValue}>{selectedRequest?.distance} km</Text>
              <Text style={styles.tripDetailLabel}>Distância</Text>
            </View>
            <View style={styles.tripDetailItem}>
              <Ionicons name="wallet-outline" size={20} color="#666" />
              <Text style={styles.tripDetailValue}>R$ {selectedRequest?.price}</Text>
              <Text style={styles.tripDetailLabel}>Valor</Text>
            </View>
            {/* Circular Accept Button */}
            <TouchableOpacity style={styles.acceptCircle} onPress={handleAccept}>
              <Text style={styles.acceptText}>ACEITAR</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.proposeLink}
            onPress={() => router.push({ pathname: '/provider/propose', params: { requestId: selectedRequest?.id, suggestedPrice: selectedRequest?.price?.toString() || '' } })}
          >
            <Text style={styles.proposeText}>Propor valor</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declineLink} onPress={handleDecline}>
            <Text style={styles.declineText}>Recusar Solicitação</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderActiveService = () => (
    <>
      <SafeAreaView style={styles.navHeader} pointerEvents="box-none">
        {/* Top Info Pills */}
        <View style={styles.navStatsPill}>
          <View style={styles.navStatItem}>
            <Text style={styles.navStatLabel}>CHEGADA</Text>
            <Text style={styles.navStatValue}>10:15</Text>
          </View>
          <View style={styles.navStatDivider} />
          <View style={styles.navStatItem}>
            <Text style={styles.navStatLabel}>DURAÇÃO</Text>
            <Text style={styles.navStatValueBlue}>8 min</Text>
          </View>
          <View style={styles.navStatDivider} />
          <View style={styles.navStatItem}>
            <Text style={styles.navStatLabel}>DIST</Text>
            <Text style={styles.navStatValue}>2.4 km</Text>
          </View>
        </View>

        {/* Turn Instruction */}
        <View style={styles.turnCard}>
          <View style={styles.turnIconBox}>
            <Ionicons name="arrow-forward" size={32} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.turnDist}>PRÓXIMA CURVA EM 450M</Text>
            <Text style={styles.turnInstruction}>Vire à direita na Rua Principal</Text>
          </View>
          <TouchableOpacity><Ionicons name="volume-high" size={24} color="#666" /></TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Right Controls */}
      <View style={styles.rightNavControls}>
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn}><Ionicons name="add" size={24} color="#333" /></TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity style={styles.zoomBtn}><Ionicons name="remove" size={24} color="#333" /></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.recenterBtn}><Ionicons name="navigate" size={24} color="#00B0FF" /></TouchableOpacity>
      </View>

      <View style={styles.bottomClientCard}>
        <View style={styles.dragHandle} />

        <View style={styles.clientRowMock}>
          <Image source={{ uri: `https://ui-avatars.com/api/?name=${activeRequest?.client_name}` }} style={styles.clientAvatarMock} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.clientNameMock}>{activeRequest?.client_name}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={12} color="#666" />
              <Text style={styles.clientAddressMock}>{activeRequest?.client_address || '123 Maple Avenue'}</Text>
            </View>
          </View>
          <View style={styles.clientActionsMock}>
            <TouchableOpacity style={styles.smallActionBtn}><Ionicons name="chatbubble" size={20} color="#00B0FF" /></TouchableOpacity>
            <TouchableOpacity style={styles.smallActionBtn}><Ionicons name="call" size={20} color="#00B0FF" /></TouchableOpacity>
          </View>
        </View>

        {/* Slider Button Placeholder (Visual only for now) */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderKnob}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </View>
          <Text style={styles.sliderText} onPress={() => {
            // Determine next status and call update
            const nextStatus = activeRequest?.status === 'accepted' ? 'in_progress'
              : activeRequest?.status === 'in_progress' ? 'near_client'
                : activeRequest?.status === 'near_client' ? 'started' : '';

            if (activeRequest?.status === 'started') setShowServiceModal(true);
            else if (nextStatus) handleStatusUpdate(nextStatus);
          }}>
            {activeRequest?.status === 'started' ? 'DESLIZE PARA FINALIZAR' : 'DESLIZE PARA CHEGAR'}
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background Map - Always Visible */}
      <CustomMapView
        style={StyleSheet.absoluteFillObject}
        origin={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : undefined}
        destination={activeRequest ? { latitude: activeRequest.client_latitude, longitude: activeRequest.client_longitude } : undefined}
        showsUserLocation={true}
        initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.015, longitudeDelta: 0.015 } : undefined}
      />

      {/* Overlay UI Layer */}
      <SafeAreaView style={styles.uiLayer} pointerEvents="box-none">
        {!activeRequest && !selectedRequest && renderIdleOverlay()}
        {selectedRequest && !activeRequest && renderIncomingRequest()}
        {activeRequest && renderActiveService()}
      </SafeAreaView>

      {/* Service Completion Modal */}
      <Modal visible={showServiceModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.serviceModal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.serviceModalTitle}>Concluir Serviço</Text>
              <Text style={styles.serviceModalSubtitle}>Adicione uma foto do trabalho realizado</Text>

              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                {servicePhoto ? (
                  <Image source={{ uri: servicePhoto }} style={{ width: '100%', height: 150, borderRadius: 12 }} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={40} color="#007AFF" />
                    <Text style={styles.photoPlaceholderText}>Adicionar Foto</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.descriptionInput}
                placeholder="Descrição (opcional)"
                value={serviceDescription}
                onChangeText={setServiceDescription}
                multiline
              />

              <View style={styles.serviceModalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowServiceModal(false)}>
                  <Text style={styles.cancelButtonText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.completeServiceButton} onPress={handleCompleteService}>
                  <Text style={styles.completeServiceButtonText}>Finalizar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  uiLayer: { flex: 1 },

  // --- TOP IDLE CARD ---
  topCardContainer: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  topCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  welcomeText: { fontSize: 12, color: '#888' },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  bellButton: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 20 },
  badge: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' },

  systemStatusCard: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5
  },
  systemStatusTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  systemStatusSubtitle: { fontSize: 11, color: '#888', marginTop: 2 },
  toggleButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  toggleOn: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  toggleOff: { backgroundColor: 'transparent', borderColor: '#ccc' },
  toggleText: { fontSize: 12, fontWeight: '600' },
  toggleTextOn: { color: '#fff' },
  toggleTextOff: { color: '#888' },

  // --- BOTTOM IDLE CARD ---
  bottomCardContainer: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statsLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  statsValue: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  statsBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statsBadgeText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
  waitingContainer: { flexDirection: 'row', alignItems: 'center' },
  waitingText: { color: '#666', fontSize: 14 },
  offlineText: { color: '#999', fontSize: 14, fontStyle: 'italic' },
  refreshButton: { marginTop: 16, backgroundColor: '#E3F2FD', paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  refreshButtonText: { color: '#007AFF', fontWeight: '600' },

  // --- INCOMING REQUEST ---
  incomingContainer: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16
  },
  incomingCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 20,
    paddingBottom: 20
  },
  incomingHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'center' },
  incomingTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  mapPreview: { height: 200, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },
  mapPin: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, elevation: 5 },
  requestInfoContainer: { padding: 20, alignItems: 'center' },
  requestCategory: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  ratingContainer: { alignItems: 'center', marginBottom: 20 },
  ratingText: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  clientNamePreview: { fontSize: 12, color: '#888', marginTop: 4 },

  tripDetailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  tripDetailItem: { alignItems: 'center', flex: 1 },
  tripDetailValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  tripDetailLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase' },

  acceptCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10
  },
  acceptText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  proposeLink: { marginTop: 12 },
  proposeText: { color: '#007AFF', fontWeight: '600' },

  declineLink: { marginTop: 24 },
  declineText: { color: '#f44336', fontWeight: '600' },

  // --- ACTIVE SERVICE NAV (NEW) ---
  navHeader: { position: 'absolute', top: 50, left: 16, right: 16, alignItems: 'center' },

  navStatsPill: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 30, paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 5, marginBottom: 16 },
  navStatItem: { alignItems: 'center' },
  navStatLabel: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  navStatValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  navStatValueBlue: { fontSize: 16, fontWeight: 'bold', color: '#00B0FF' },
  navStatDivider: { width: 1, height: 20, backgroundColor: '#eee', marginHorizontal: 20 },

  turnCard: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 5 },
  turnIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#00B0FF', alignItems: 'center', justifyContent: 'center' },
  turnDist: { fontSize: 10, color: '#999', fontWeight: 'bold', marginBottom: 2 },
  turnInstruction: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', width: '90%' },

  rightNavControls: { position: 'absolute', top: 250, right: 16, alignItems: 'center', gap: 16 },
  zoomControls: { backgroundColor: '#fff', borderRadius: 12, width: 48, alignItems: 'center', paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
  zoomBtn: { padding: 8 },
  zoomDivider: { width: 24, height: 1, backgroundColor: '#eee' },
  recenterBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },

  bottomClientCard: { position: 'absolute', bottom: 30, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, elevation: 15 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#eee', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  clientRowMock: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  clientAvatarMock: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  clientNameMock: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  clientAddressMock: { fontSize: 13, color: '#666', marginLeft: 4 },

  clientActionsMock: { flexDirection: 'row', gap: 12 },
  smallActionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f8ff', alignItems: 'center', justifyContent: 'center' },

  sliderContainer: { height: 60, backgroundColor: '#f5f5f5', borderRadius: 30, flexDirection: 'row', alignItems: 'center', padding: 6, position: 'relative' },
  sliderKnob: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00B0FF', alignItems: 'center', justifyContent: 'center', zIndex: 2, shadowColor: '#000', shadowOpacity: 0.2, elevation: 3 },
  sliderText: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontWeight: 'bold', color: '#999', letterSpacing: 1 },

  // --- MODAL ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  serviceModal: { width: width - 40, backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  serviceModalTitle: { fontSize: 20, fontWeight: 'bold' },
  serviceModalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  photoButton: { width: '100%', marginBottom: 16 },
  photoPlaceholder: { height: 120, borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { marginTop: 8, color: '#007AFF' },
  descriptionInput: { width: '100%', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16, height: 80, marginBottom: 20 },
  serviceModalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelButton: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelButtonText: { color: '#666' },
  completeServiceButton: { flex: 2, backgroundColor: '#4CAF50', padding: 14, borderRadius: 12, alignItems: 'center' },
  completeServiceButtonText: { color: '#fff', fontWeight: 'bold' },
});
