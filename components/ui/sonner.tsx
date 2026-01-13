import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react-native';

// Event bus for toasts
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

// Simple event emitter
const listeners = new Set<(toast: ToastMessage) => void>();

const emit = (toast: ToastMessage) => {
  listeners.forEach(listener => listener(toast));
};

export const toast = {
  success: (message: string, options?: { description?: string }) => {
    emit({ id: Math.random().toString(), type: 'success', message, description: options?.description });
  },
  error: (message: string, options?: { description?: string }) => {
    emit({ id: Math.random().toString(), type: 'error', message, description: options?.description });
  },
  info: (message: string, options?: { description?: string }) => {
    emit({ id: Math.random().toString(), type: 'info', message, description: options?.description });
  },
  warning: (message: string, options?: { description?: string }) => {
    emit({ id: Math.random().toString(), type: 'warning', message, description: options?.description });
  },
};

export const Toaster = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (newToast: ToastMessage) => {
      setToasts(prev => [...prev, newToast]);
      // Auto dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View style={styles.toastArea} pointerEvents="box-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </View>
    </SafeAreaView>
  );
};

const ToastItem = ({ toast, onDismiss }: { toast: ToastMessage, onDismiss: () => void }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle size={20} color="#166534" />;
      case 'error': return <XCircle size={20} color="#991b1b" />;
      case 'warning': return <AlertTriangle size={20} color="#854d0e" />;
      default: return <Info size={20} color="#1e40af" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success': return { bg: '#f0fdf4', border: '#bbf7d0' };
      case 'error': return { bg: '#fef2f2', border: '#fecaca' };
      case 'warning': return { bg: '#fefce8', border: '#fef08a' };
      default: return { bg: '#eff6ff', border: '#bfdbfe' };
    }
  };

  const style = getStyles();

  return (
    <Animated.View exiting={FadeOutUp} entering={FadeInUp} style={[styles.toast, { backgroundColor: style.bg, borderColor: style.border }]}>
      <View style={styles.icon}>{getIcon()}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{toast.message}</Text>
        {toast.description && <Text style={styles.desc}>{toast.description}</Text>}
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.close}>
        <X size={16} color="#94a3b8" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // High z-index for web
    alignItems: 'center',
  },
  toastArea: {
    width: '100%',
    maxWidth: 400,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    width: '100%',
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  desc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  close: {
    marginLeft: 12,
  }
});
