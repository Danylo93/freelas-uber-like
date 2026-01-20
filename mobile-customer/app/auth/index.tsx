import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Image,
  Dimensions,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// --- TYPES & DATA ---
type AuthView = 'client_login' | 'provider_welcome' | 'provider_register' | 'client_register' | 'provider_documents' | 'provider_pending';

const PROFESSIONS = [
  { id: 'plumbing', name: 'Plumber', icon: 'tint', lib: 'FontAwesome5' },
  { id: 'electrical', name: 'Electrical', icon: 'bolt', lib: 'FontAwesome5' },
  { id: 'cleaning', name: 'Cleaning', icon: 'cleaning-services', lib: 'MaterialIcons' },
  { id: 'hvac', name: 'HVAC', icon: 'fan', lib: 'FontAwesome5' },
  { id: 'pest_control', name: 'Pest Control', icon: 'bug', lib: 'Ionicons' },
  { id: 'painting', name: 'Painting', icon: 'paint-roller', lib: 'FontAwesome5' },
  { id: 'handyman', name: 'Handyman', icon: 'tools', lib: 'FontAwesome5' },
  { id: 'moving', name: 'Moving', icon: 'truck', lib: 'FontAwesome5' },
];

export default function AuthScreen() {
  const [currentView, setCurrentView] = useState<AuthView>('client_login');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    profession: '' as string,
  });

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Login Falhou', error.message || 'Verifique suas credenciais');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (isProvider: boolean) => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '000000000',
        password: formData.password,
        user_type: isProvider ? 1 : 2,
        category: isProvider ? formData.profession : undefined
      });
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Cadastro Falhou', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SUB-COMPONENTS ---

  const ClientLoginView = () => (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1000&auto=format&fit=crop' }}
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>

          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>Help is just a tap away</Text>
            <Text style={styles.loginSubtitle}>Log in to access on-demand services</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={t => setFormData({ ...formData, email: t })}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry
                value={formData.password}
                onChangeText={t => setFormData({ ...formData, password: t })}
              />
              <TouchableOpacity style={styles.forgotPass}>
                <Text style={styles.forgotPassText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Login</Text>}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="logo-google" size={20} color="#333" />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="logo-apple" size={20} color="#333" />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => setCurrentView('client_register')}>
                <Text style={styles.linkText}>Create an account</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setCurrentView('provider_welcome')}>
              <Text style={[styles.linkText, { fontSize: 12, textAlign: 'center' }]}>Are you a Service Pro?</Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );

  const ProviderWelcomeView = () => (
    <View style={styles.whiteContainer}>
      <TouchableOpacity style={styles.closeButton} onPress={() => setCurrentView('client_login')}>
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.welcomeContent}>
        <View style={styles.logoBadge}>
          <Ionicons name="briefcase" size={40} color="#007AFF" />
        </View>
        <Text style={styles.welcomeTitle}>Join our network of professionals</Text>
        <Text style={styles.welcomeSubtitle}>Grow your business, manage your schedule, and get paid instantly.</Text>

        <View style={styles.illustrationPlace}>
          <FontAwesome5 name="tools" size={80} color="#E3F2FD" />
        </View>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentView('provider_register')}>
          <Text style={styles.primaryButtonText}>Sign Up as a Pro</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => setCurrentView('client_login')}>
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );

  const ProviderRegisterView = () => (
    <View style={styles.whiteContainer}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => setCurrentView('provider_welcome')}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Registration</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: formData.profession ? '80%' : '40%' }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {!formData.profession ? (
          <>
            <Text style={styles.stepTitle}>What is your specialty?</Text>
            <Text style={styles.stepSubtitle}>Choose the service category that best describes the work you do.</Text>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput style={{ flex: 1, marginLeft: 10 }} placeholder="Search professions..." />
            </View>

            <View style={styles.gridContainer}>
              {PROFESSIONS.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.professionCard, formData.profession === p.name && styles.professionCardSelected]}
                  onPress={() => setFormData({ ...formData, profession: p.name })}
                >
                  {formData.profession === p.name && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}

                  <View style={[styles.professionIcon, formData.profession === p.name && { backgroundColor: '#fff' }]}>
                    {p.lib === 'FontAwesome5' && <FontAwesome5 name={p.icon as any} size={24} color={formData.profession === p.name ? "#007AFF" : "#666"} />}
                    {p.lib === 'Ionicons' && <Ionicons name={p.icon as any} size={24} color={formData.profession === p.name ? "#007AFF" : "#666"} />}
                    {p.lib === 'MaterialIcons' && <MaterialIcons name={p.icon as any} size={24} color={formData.profession === p.name ? "#007AFF" : "#666"} />}
                  </View>
                  <Text style={[styles.professionName, formData.profession === p.name && styles.professionNameSelected]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.stepTitle}>Create your credentials</Text>
            <Text style={styles.stepSubtitle}>Step 2 of 2</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })} autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} value={formData.password} onChangeText={t => setFormData({ ...formData, password: t })} secureTextEntry />
            </View>
          </>
        )}
      </ScrollView>
      <TouchableOpacity
        style={[styles.primaryButton, (!formData.profession || (!!formData.profession && !formData.name)) && styles.disabledBtn]}
        disabled={!formData.profession}
        onPress={() => {
          if (formData.profession && formData.name && formData.email) {
            setCurrentView('provider_documents');
          } else if (formData.profession) {
            // The view automatically updates to show form inputs if profession is selected
            // This is a simplified flow; in real app we'd have explicit step state
            Alert.alert('Continue', 'Please fill in your details above.');
          }
        }}
      >
        {loading ? <ActivityIndicator color="#fff" /> :
          <Text style={styles.primaryButtonText}>
            {formData.profession && formData.email ? 'Continue' : 'Continue'}
          </Text>
        }
      </TouchableOpacity>
    </View>
  );

  const ProviderDocumentsView = () => (
    <View style={styles.whiteContainer}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => setCurrentView('provider_register')}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Registration</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '60%' }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.stepTitle}>Document Upload</Text>
        <Text style={styles.stepSubtitle}>We need a few documents to verify your identity and professional background.</Text>

        <Text style={styles.docSectionTitle}>National ID or Passport</Text>
        <TouchableOpacity style={styles.uploadCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="document-text" size={32} color="#4CAF50" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.fileName}>ID_Front_Scan.jpg</Text>
              <Text style={styles.fileSize}>1.2 MB</Text>
            </View>
          </View>
          <Text style={styles.replaceLink}>Replace</Text>
        </TouchableOpacity>

        <Text style={styles.docSectionTitle}>Professional License/Certification</Text>
        <TouchableOpacity style={styles.uploadPlaceholder}>
          <Ionicons name="camera" size={32} color="#007AFF" />
          <Text style={styles.uploadText}>Upload photo or PDF</Text>
          <Text style={styles.uploadSubtext}>Maximum file size: 5MB</Text>
        </TouchableOpacity>

        <Text style={styles.docSectionTitle}>Criminal Record Check</Text>
        <TouchableOpacity style={styles.uploadPlaceholder}>
          <Ionicons name="document" size={32} color="#007AFF" />
          <Text style={styles.uploadText}>Upload photo or PDF</Text>
          <Text style={styles.uploadSubtext}>Issued within the last 3 months</Text>
        </TouchableOpacity>

      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentView('provider_pending')}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit for Review</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  const ProviderPendingView = () => (
    <View style={styles.whiteContainer}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => setCurrentView('provider_documents')}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Application Status</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <View style={styles.statusCard}>
          <View style={styles.statusIconCircle}>
            <Ionicons name="clipboard" size={50} color="#007AFF" />
            <View style={styles.statusBadge}>
              <Ionicons name="time" size={16} color="#fff" />
            </View>
          </View>

          <Text style={styles.statusTitle}>Everything is set! We are reviewing your profile</Text>
          <Text style={styles.statusDesc}>
            Our team is currently verifying your documents to ensure the safety of our community. This process usually takes <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>24-48 hours</Text>.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Next Steps</Text>

        <View style={styles.stepItem}>
          <View style={styles.stepIcon}>
            <Ionicons name="hourglass" size={20} color="#007AFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.stepTitleSmall}>Document validation</Text>
            <Text style={styles.stepDescSmall}>We're checking your ID and background</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.primaryButton}>
          <Ionicons name="headset" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => router.replace('/')}>
          <Text style={styles.secondaryButtonText}>Browse App as Guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ClientRegisterView = () => (
    <View style={styles.whiteContainer}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => setCurrentView('client_login')}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Create Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.stepTitle}>Join as a Customer</Text>
        <Text style={styles.stepSubtitle}>Find the best professionals for your needs.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })} autoCapitalize="none" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={formData.phone} onChangeText={t => setFormData({ ...formData, phone: t })} keyboardType="phone-pad" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={formData.password} onChangeText={t => setFormData({ ...formData, password: t })} secureTextEntry />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => handleRegister(false)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign Up</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <>
      {currentView === 'client_login' && <ClientLoginView />}
      {currentView === 'provider_welcome' && <ProviderWelcomeView />}
      {currentView === 'provider_register' && <ProviderRegisterView />}
      {currentView === 'provider_documents' && <ProviderDocumentsView />}
      {currentView === 'provider_pending' && <ProviderPendingView />}
      {currentView === 'client_register' && <ClientRegisterView />}
    </>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },

  // LOGIN CARD
  loginCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    flex: 1,
    marginTop: 150, // Pushes card down
    marginBottom: -50, // Extends below screen
    paddingBottom: 80
  },
  loginTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center' },
  loginSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 30 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16
  },
  forgotPass: { alignSelf: 'flex-end', marginTop: 8 },
  forgotPassText: { color: '#007AFF', fontSize: 12, fontWeight: '600' },

  primaryButton: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledBtn: { backgroundColor: '#ccc' },

  secondaryButton: { backgroundColor: '#f5f5f5', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { marginHorizontal: 12, color: '#999', fontSize: 10, fontWeight: 'bold' },

  socialButtons: { flexDirection: 'row', gap: 16 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingVertical: 12
  },
  socialBtnText: { marginLeft: 8, fontWeight: '600', color: '#333' },

  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#666' },
  linkText: { color: '#007AFF', fontWeight: 'bold' },

  // PROVIDER WELCOME
  whiteContainer: { flex: 1, backgroundColor: '#fff' },
  closeButton: { position: 'absolute', top: 50, left: 24, zIndex: 10 },
  welcomeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, paddingTop: 100 },
  logoBadge: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  welcomeTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#1a1a1a', marginBottom: 12 },
  welcomeSubtitle: { fontSize: 16, textAlign: 'center', color: '#666', lineHeight: 24 },
  illustrationPlace: { marginTop: 60, opacity: 0.5 },
  bottomActions: { padding: 24, paddingBottom: 50 },
  termsText: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 16 },

  // REGISTER
  navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  navTitle: { fontSize: 18, fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: '#f0f0f0', marginHorizontal: 24, borderRadius: 2, marginBottom: 24 },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#1a1a1a' },
  stepSubtitle: { fontSize: 15, color: '#666', marginBottom: 24, lineHeight: 22 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 12, marginBottom: 24 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  professionCard: {
    width: (width - 48 - 12) / 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 0
  },
  professionCardSelected: { borderColor: '#007AFF', backgroundColor: '#F0F9FF' },
  professionIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  professionName: { fontSize: 14, fontWeight: '600', color: '#333' },
  professionNameSelected: { color: '#007AFF' },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },

  // DOCUMENTS
  docSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12, marginTop: 24 },
  uploadCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0F9FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#B3E5FC'
  },
  fileName: { fontWeight: '600', color: '#333' },
  fileSize: { fontSize: 12, color: '#666' },
  replaceLink: { color: '#007AFF', fontWeight: '600', fontSize: 13 },
  uploadPlaceholder: {
    height: 120, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 12, backgroundColor: '#fafafa'
  },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#007AFF', marginTop: 8 },
  uploadSubtext: { fontSize: 12, color: '#999', marginTop: 4 },

  // PENDING APPROVAL
  statusCard: {
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 30, marginBottom: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0'
  },
  statusIconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#E3F2FD',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24
  },
  statusBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#007AFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff'
  },
  statusTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#1a1a1a', marginBottom: 12 },
  statusDesc: { fontSize: 14, textAlign: 'center', color: '#666', lineHeight: 22 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  stepItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 16, borderRadius: 16, marginBottom: 16 },
  stepIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },
  stepTitleSmall: { fontSize: 14, fontWeight: '600', color: '#333' },
  stepDescSmall: { fontSize: 12, color: '#666' }
});