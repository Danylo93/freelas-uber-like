import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import AuthScreen from './auth/index';
import ClientHome from './client/index';
// import ProviderHome from './provider/index'; // Não deve ser acessível aqui

export default function Index() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Animações da splash - usando useRef para evitar recriação a cada render
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Se não está carregando e já temos dados de auth, esconder splash
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000); // 2 segundos de splash
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    // Animação da splash screen (simplificada)
    if (showSplash) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSplash]);

  const SplashScreen = () => {
    return (
      <View style={styles.splashContainer} testID="customer-splash-screen">
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name="construct" size={80} color="#007AFF" />
        </Animated.View>
        
        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.appName} testID="customer-splash-title">Freelas Cliente</Text>
          <Text style={styles.tagline} testID="customer-splash-tagline">🔧 Conectando você aos melhores profissionais</Text>
        </Animated.View>
      </View>
    );
  };

  // Mostrar splash screen enquanto está carregando ou durante animação
  if (isLoading || showSplash) {
    return <SplashScreen />;
  }

  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  // Redirect based on user type
  if (user.user_type === 1) { // PROVIDER
    return (
      <View style={styles.container}>
        <Ionicons name="warning" size={64} color="#F44336" />
        <Text style={styles.errorTitle}>Acesso Restrito</Text>
        <Text style={styles.errorText}>Esta conta é de prestador de serviços.</Text>
        <Text style={styles.errorText}>Por favor, use o aplicativo Freelas Profissional.</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (user.user_type === 2) { // CUSTOMER
    return <ClientHome />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Erro: Tipo de usuário inválido</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    backgroundColor: '#E3F2FD',
    borderRadius: 60,
    marginBottom: 40,
    elevation: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
