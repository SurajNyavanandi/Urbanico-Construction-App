import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={32} color="#EF4444" />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred while rendering this section.'}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reloadButton}
                onPress={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                activeOpacity={0.8}
              >
                <Home size={16} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.reloadButtonText}>Reload App</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    minHeight: 300,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  reloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reloadButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
});
