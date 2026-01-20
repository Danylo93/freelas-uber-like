import React, { useState, useRef, useCallback } from 'react';
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
  Dimensions,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- TYPES & DATA ---
type AuthView = 'login' | 'provider_welcome' | 'provider_register' | 'provider_documents' | 'provider_pending';

const PROFESSIONS = [
  { id: 'plumbing', name: 'Encanador', icon: 'tint', lib: 'FontAwesome5' },
  { id: 'electrical', name: 'Eletricista', icon: 'bolt', lib: 'FontAwesome5' },
  { id: 'cleaning', name: 'Limpeza', icon: 'cleaning-services', lib: 'MaterialIcons' },
  { id: 'hvac', name: 'Climatização', icon: 'fan', lib: 'FontAwesome5' },
  { id: 'pest_control', name: 'Controle de Pragas', icon: 'bug', lib: 'Ionicons' },
  { id: 'painting', name: 'Pintura', icon: 'paint-roller', lib: 'FontAwesome5' },
  { id: 'handyman', name: 'Marido de Aluguel', icon: 'tools', lib: 'FontAwesome5' },
  { id: 'moving', name: 'Mudanças', icon: 'truck', lib: 'FontAwesome5' },
];

// --- SUB-COMPONENTS ---

const LoginView = ({ formData, handleEmailChange, handlePasswordChange, handleLogin, loading, setCurrentView }: any) => {
  const passwordInputRef = useRef<TextInput>(null);

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1000&auto=format&fit=crop' }}
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>

          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>Login do Profissional</Text>
            <Text style={styles.loginSubtitle}>Entre para gerenciar seus serviços</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                blurOnSubmit={false}
                editable={true}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#999"
                secureTextEntry
                value={formData.password}
                onChangeText={handlePasswordChange}
                returnKeyType="done"
                blurOnSubmit={false}
                editable={true}
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              <TouchableOpacity style={styles.forgotPass}>
                <Text style={styles.forgotPassText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU CONTINUE COM</Text>
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
              <Text style={styles.footerText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => setCurrentView('provider_register')}>
                <Text style={styles.linkText}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>

        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
};

const ProviderWelcomeView = ({ setCurrentView, setFormData }: any) => (
  <View style={styles.whiteContainer}>
    <TouchableOpacity style={styles.closeButton} onPress={() => setCurrentView('login')}>
      <Ionicons name="close" size={24} color="#333" />
    </TouchableOpacity>

    <View style={styles.welcomeContent}>
      <View style={styles.logoBadge}>
        <Ionicons name="briefcase" size={40} color="#007AFF" />
      </View>
      <Text style={styles.welcomeTitle}>Junte-se à nossa rede de profissionais</Text>
      <Text style={styles.welcomeSubtitle}>Expanda seu negócio, gerencie sua agenda e receba instantaneamente.</Text>

      <View style={styles.illustrationPlace}>
        <FontAwesome5 name="tools" size={80} color="#E3F2FD" />
      </View>
    </View>

    <View style={styles.bottomActions}>
      <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentView('provider_register')}>
        <Text style={styles.primaryButtonText}>Cadastre-se como Profissional</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => {
        // Reset form for login
        setFormData((prev: any) => ({ ...prev, name: '', email: '', phone: '', password: '', confirmPassword: '', profession: '' }));
        setCurrentView('login');
      }}>
        <Text style={styles.secondaryButtonText}>Entrar</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        Ao continuar você concorda com nossos Termos de Serviço e Política de Privacidade.
      </Text>
    </View>
  </View>
);

const ProviderRegisterView = ({ formData, setFormData, handleNameChange, handleEmailChange, handlePasswordChange, handleConfirmPasswordChange, setCurrentView, loading }: any) => {
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.whiteContainer}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => setCurrentView('provider_welcome')}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Cadastro</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: formData.profession ? '80%' : '40%' }]} />
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardDismissMode="none"
        >
        {!formData.profession ? (
          <>
            <Text style={styles.stepTitle}>Qual é a sua especialidade?</Text>
            <Text style={styles.stepSubtitle}>Escolha a categoria que melhor descreve seu trabalho.</Text>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput 
                style={{ flex: 1, marginLeft: 10 }} 
                placeholder="Buscar profissões..."
                blurOnSubmit={false}
                editable={true}
                returnKeyType="search"
              />
            </View>

            <View style={styles.gridContainer}>
              {PROFESSIONS.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.professionCard, formData.profession === p.name && styles.professionCardSelected]}
                  onPress={() => setFormData((prev: any) => ({ ...prev, profession: p.name }))}
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
            <Text style={styles.stepTitle}>Crie suas credenciais</Text>
            <Text style={styles.stepSubtitle}>Passo 2 de 2</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput 
                ref={nameInputRef}
                style={styles.input} 
                value={formData.name} 
                onChangeText={handleNameChange}
                returnKeyType="next"
                blurOnSubmit={false}
                editable={true}
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
          <TextInput 
            ref={emailInputRef}
            style={styles.input} 
            value={formData.email} 
            onChangeText={handleEmailChange} 
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            blurOnSubmit={false}
            editable={true}
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput 
                ref={passwordInputRef}
                style={styles.input} 
                value={formData.password} 
                onChangeText={handlePasswordChange} 
                secureTextEntry
                returnKeyType="next"
                blurOnSubmit={false}
                editable={true}
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <TextInput 
                ref={confirmPasswordInputRef}
                style={styles.input} 
                value={formData.confirmPassword} 
                onChangeText={handleConfirmPasswordChange} 
                secureTextEntry
                returnKeyType="done"
                blurOnSubmit={false}
                editable={true}
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </>
        )}
      </ScrollView>
      <TouchableOpacity
        style={[styles.primaryButton, (!formData.profession || (!!formData.profession && (!formData.name || !formData.email || !formData.password || !formData.confirmPassword))) && styles.disabledBtn]}
        disabled={!formData.profession || (!!formData.profession && (!formData.name || !formData.email || !formData.password || !formData.confirmPassword))}
        onPress={() => {
          if (formData.profession && formData.name && formData.email && formData.password && formData.confirmPassword) {
            if (formData.password !== formData.confirmPassword) {
              Alert.alert('Erro', 'As senhas não coincidem');
              return;
            }
            setCurrentView('provider_documents');
          } else if (formData.profession) {
            Alert.alert('Continue', 'Preencha todos os campos acima.');
          }
        }}
      >
        {loading ? <ActivityIndicator color="#fff" /> :
          <Text style={styles.primaryButtonText}>
            {formData.profession && formData.email && formData.password ? 'Continuar' : 'Continuar'}
          </Text>
        }
      </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const ProviderDocumentsView = ({ setCurrentView, handleRegister, loading }: any) => (
  <View style={styles.whiteContainer}>
    <View style={styles.navHeader}>
      <TouchableOpacity onPress={() => setCurrentView('provider_register')}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.navTitle}>Cadastro</Text>
      <View style={{ width: 24 }} />
    </View>

    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: '60%' }]} />
    </View>

    <ScrollView
      contentContainerStyle={{ padding: 24, flexGrow: 1 }}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="none"
    >
      <Text style={styles.stepTitle}>Envio de Documentos</Text>
      <Text style={styles.stepSubtitle}>Precisamos de alguns documentos para verificar sua identidade e experiência.</Text>

      <Text style={styles.docSectionTitle}>RG ou CNH</Text>
      <TouchableOpacity style={styles.uploadCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="document-text" size={32} color="#4CAF50" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.fileName}>Frente_Documento.jpg</Text>
            <Text style={styles.fileSize}>1.2 MB</Text>
          </View>
        </View>
        <Text style={styles.replaceLink}>Trocar</Text>
      </TouchableOpacity>

      <Text style={styles.docSectionTitle}>Licença/Certificação Profissional</Text>
      <TouchableOpacity style={styles.uploadPlaceholder}>
        <Ionicons name="camera" size={32} color="#007AFF" />
        <Text style={styles.uploadText}>Enviar foto ou PDF</Text>
        <Text style={styles.uploadSubtext}>Tamanho máximo: 5MB</Text>
      </TouchableOpacity>

      <Text style={styles.docSectionTitle}>Atestado de Antecedentes Criminais</Text>
      <TouchableOpacity style={styles.uploadPlaceholder}>
        <Ionicons name="document" size={32} color="#007AFF" />
        <Text style={styles.uploadText}>Enviar foto ou PDF</Text>
        <Text style={styles.uploadSubtext}>Emitido nos últimos 3 meses</Text>
      </TouchableOpacity>

    </ScrollView>

    <View style={styles.bottomActions}>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={async () => {
          try {
            await handleRegister(true);
          } catch (error) {
            // Error already handled in handleRegister
          }
        }}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Enviar para Análise</Text>}
      </TouchableOpacity>
    </View>
  </View>
);

const ProviderPendingView = ({ setCurrentView }: any) => (
  <View style={styles.whiteContainer}>
    <View style={styles.navHeader}>
      <TouchableOpacity onPress={() => setCurrentView('provider_documents')}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.navTitle}>Status da Inscrição</Text>
      <View style={{ width: 24 }} />
    </View>

    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 100, flexGrow: 1 }}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="none"
    >
      <View style={styles.statusCard}>
        <View style={styles.statusIconCircle}>
          <Ionicons name="clipboard" size={50} color="#007AFF" />
          <View style={styles.statusBadge}>
            <Ionicons name="time" size={16} color="#fff" />
          </View>
        </View>

        <Text style={styles.statusTitle}>Tudo pronto! Estamos analisando seu perfil</Text>
        <Text style={styles.statusDesc}>
          Nossa equipe está verificando seus documentos para garantir a segurança da comunidade. Este processo geralmente leva <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>24-48 horas</Text>.
        </Text>
      </View>

      <Text style={styles.sectionHeader}>Próximos Passos</Text>

      <View style={styles.stepItem}>
        <View style={styles.stepIcon}>
          <Ionicons name="hourglass" size={20} color="#007AFF" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.stepTitleSmall}>Validação de documentos</Text>
          <Text style={styles.stepDescSmall}>Estamos verificando sua identidade e antecedentes.</Text>
        </View>
      </View>
    </ScrollView>

    <View style={styles.bottomActions}>
      <TouchableOpacity style={styles.primaryButton}>
        <Ionicons name="headset" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>Falar com Suporte</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => router.replace('/')}>
        <Text style={styles.secondaryButtonText}>Navegar como Visitante</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function AuthScreen() {
  const [currentView, setCurrentView] = useState<AuthView>('provider_welcome');
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

  // Memoizar handlers para evitar re-renders
  const handleNameChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, name: text }));
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, email: text }));
  }, []);

  const handlePhoneChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, phone: text }));
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, password: text }));
  }, []);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, confirmPassword: text }));
  }, []);

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
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        password: formData.password,
        role: isProvider ? 'PROVIDER' : 'CUSTOMER',
        category: isProvider ? formData.profession : undefined
      });
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Cadastro Falhou', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentView === 'login') {
    return (
      <LoginView
        formData={formData}
        handleEmailChange={handleEmailChange}
        handlePasswordChange={handlePasswordChange}
        handleLogin={handleLogin}
        loading={loading}
        setCurrentView={setCurrentView}
      />
    );
  }
  if (currentView === 'provider_welcome') {
    return <ProviderWelcomeView setCurrentView={setCurrentView} setFormData={setFormData} />;
  }
  if (currentView === 'provider_register') {
    return (
      <ProviderRegisterView
        formData={formData}
        setFormData={setFormData}
        handleNameChange={handleNameChange}
        handleEmailChange={handleEmailChange}
        handlePasswordChange={handlePasswordChange}
        handleConfirmPasswordChange={handleConfirmPasswordChange}
        setCurrentView={setCurrentView}
        loading={loading}
      />
    );
  }
  if (currentView === 'provider_documents') {
    return <ProviderDocumentsView setCurrentView={setCurrentView} handleRegister={handleRegister} loading={loading} />;
  }
  if (currentView === 'provider_pending') {
    return <ProviderPendingView setCurrentView={setCurrentView} />;
  }

  return null;
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