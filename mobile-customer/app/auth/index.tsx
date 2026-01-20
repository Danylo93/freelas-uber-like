import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- TYPES & DATA ---
type AuthView = 'client_login' | 'client_register';

// --- SUB-COMPONENTS (Defined outside to prevent re-renders/keyboard issues) ---

const ClientLoginView = ({
  formData,
  handleEmailChange,
  handlePasswordChange,
  handleLogin,
  loading,
  setCurrentView
}: any) => {
  const passwordInputRef = useRef<TextInput>(null);

  return (
    <View style={styles.backgroundImage}>
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 50 }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>Ajuda a um toque de distância</Text>
            <Text style={styles.loginSubtitle}>Entre para acessar serviços sob demanda</Text>

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
              <TouchableOpacity onPress={() => setCurrentView('client_register')}>
                <Text style={styles.linkText}>Criar uma conta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const ClientRegisterView = ({
  formData,
  handleNameChange,
  handleEmailChange,
  handlePhoneChange,
  handlePasswordChange,
  handleConfirmPasswordChange,
  handleRegister,
  loading,
  setCurrentView
}: any) => {
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
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
          <TouchableOpacity onPress={() => setCurrentView('client_login')}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Criar Conta</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardDismissMode="none"
        >
        <Text style={styles.stepTitle}>Junte-se como Cliente</Text>
        <Text style={styles.stepSubtitle}>Encontre os melhores profissionais para suas necessidades.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput 
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
            onSubmitEditing={() => phoneInputRef.current?.focus()}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput 
            ref={phoneInputRef}
            style={styles.input} 
            value={formData.phone} 
            onChangeText={handlePhoneChange} 
            keyboardType="phone-pad"
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

        <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Cadastrar</Text>}
        </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

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

  const handleRegister = async () => {
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
        role: 'CUSTOMER'
      });
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Cadastro Falhou', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentView === 'client_login') {
    return (
      <ClientLoginView
        formData={formData}
        handleEmailChange={handleEmailChange}
        handlePasswordChange={handlePasswordChange}
        handleLogin={handleLogin}
        loading={loading}
        setCurrentView={setCurrentView}
      />
    );
  }
  if (currentView === 'client_register') {
    return (
      <ClientRegisterView
        formData={formData}
        handleNameChange={handleNameChange}
        handleEmailChange={handleEmailChange}
        handlePhoneChange={handlePhoneChange}
        handlePasswordChange={handlePasswordChange}
        handleConfirmPasswordChange={handleConfirmPasswordChange}
        handleRegister={handleRegister}
        loading={loading}
        setCurrentView={setCurrentView}
      />
    );
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

  // GENERIC & SHARED
  whiteContainer: { flex: 1, backgroundColor: '#fff' },
  navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  navTitle: { fontSize: 18, fontWeight: '600' },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#1a1a1a' },
  stepSubtitle: { fontSize: 15, color: '#666', marginBottom: 24, lineHeight: 22 },
});