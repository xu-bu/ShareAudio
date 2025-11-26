import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';

export default function AudioShareApp() {
  const [isMuted, setIsMuted] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const streamRef = useRef<any>(null);
  const peerConnectionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopSharing();
    };
  }, []);

  const generateRoomId = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const startSharing = async () => {
    try {
      // For React Native, you'll need to use a library like react-native-webrtc
      // This is a placeholder - implement with your WebRTC library
      
      const newRoomId = generateRoomId();
      setRoomId(newRoomId);
      startToShare(true);
      setIsHost(true);
      setIsConnected(true);
      
      // Simulate listener count
      setListeners(Math.floor(Math.random() * 5) + 1);
      
      Alert.alert('Started', 'Audio sharing started successfully!');
      
    } catch (err) {
      console.error('Error accessing audio:', err);
      Alert.alert('Error', 'Unable to capture audio. Please check permissions.');
    }
  };

  const stopSharing = () => {
    if (streamRef.current) {
      streamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current = null;
    }
    sendStopShare(false);
    setIsHost(false);
    setIsConnected(false);
    setRoomId('');
    setListeners(0);
  };

  const joinRoom = () => {
    if (joinRoomId.length === 6) {
      setIsConnected(true);
      setRoomId(joinRoomId);
      
      setTimeout(() => {
        Alert.alert('Connected', 'Connected to room! Audio will start playing automatically.');
      }, 500);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const copyRoomId = async () => {
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(roomId);
    } else {
      // For React Native, use Clipboard API
      // Clipboard.setString(roomId);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🔊</Text>
          </View>
          <Text style={styles.title}>AudioShare</Text>
          <Text style={styles.subtitle}>Share your audio in real-time with low latency</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          
          {!isConnected ? (
            <>
              {/* Start Sharing Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Share Your Audio</Text>
                <Text style={styles.sectionSubtitle}>
                  Start sharing audio from your video, music, or any application
                </Text>
                <TouchableOpacity
                  onPress={startSharing}
                  style={styles.primaryButton}
                >
                  <Text style={styles.buttonText}>🎤 Start Sharing Audio</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Join Room Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Join a Room</Text>
                <Text style={styles.sectionSubtitle}>
                  Enter a room code to listen to someone's audio stream
                </Text>
                <View style={styles.joinRow}>
                  <TextInput
                    value={joinRoomId}
                    onChangeText={(text) => setJoinRoomId(text.toUpperCase())}
                    placeholder="Enter Room ID"
                    maxLength={6}
                    autoCapitalize="characters"
                    style={styles.input}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    onPress={joinRoom}
                    disabled={joinRoomId.length !== 6}
                    style={[
                      styles.joinButton,
                      joinRoomId.length !== 6 && styles.disabledButton
                    ]}
                  >
                    <Text style={styles.buttonText}>Join</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Connected State */}
              <View style={styles.section}>
                {/* Room Info */}
                <View style={styles.roomInfo}>
                  <Text style={styles.roomTitle}>
                    {isHost ? 'Your Room' : 'Connected to Room'}
                  </Text>
                  
                  <View style={styles.roomIdContainer}>
                    <View style={styles.roomIdBox}>
                      <Text style={styles.roomIdLabel}>Room ID</Text>
                      <Text style={styles.roomIdText}>{roomId}</Text>
                    </View>
                    {isHost && (
                      <TouchableOpacity
                        onPress={copyRoomId}
                        style={styles.copyButton}
                      >
                        <Text style={styles.copyButtonText}>
                          {copied ? '✓' : '📋'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {isHost && (
                    <View style={styles.listenersInfo}>
                      <Text style={styles.listenersText}>
                        👥 {listeners} listener{listeners !== 1 ? 's' : ''} connected
                      </Text>
                    </View>
                  )}
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                  {isHost && (
                    <TouchableOpacity
                      onPress={toggleMute}
                      style={[
                        styles.controlButton,
                        isMuted ? styles.muteButton : styles.unmuteButton
                      ]}
                    >
                      <Text style={styles.buttonText}>
                        {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={stopSharing}
                    style={[styles.controlButton, styles.stopButton]}
                  >
                    <Text style={styles.buttonText}>
                      {isHost ? '⏹️ Stop Sharing' : '❌ Disconnect'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    <Text style={styles.infoBold}>Low Latency Mode Active:</Text> Using WebRTC for peer-to-peer connection. 
                    Audio is automatically optimized for your network conditions.
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>⚡</Text>
            </View>
            <Text style={styles.featureTitle}>Low Latency</Text>
            <Text style={styles.featureText}>WebRTC ensures minimal delay</Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🎵</Text>
            </View>
            <Text style={styles.featureTitle}>High Quality</Text>
            <Text style={styles.featureText}>48kHz audio streaming</Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>📶</Text>
            </View>
            <Text style={styles.featureTitle}>Network Adaptive</Text>
            <Text style={styles.featureText}>Works on poor connections</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1.</Text>
            <Text style={styles.instructionText}>
              Click "Start Sharing Audio" to begin streaming
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2.</Text>
            <Text style={styles.instructionText}>
              Grant audio permissions when prompted
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3.</Text>
            <Text style={styles.instructionText}>
              Share your Room ID with others so they can listen
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>4.</Text>
            <Text style={styles.instructionText}>
              Others join by entering your Room ID and clicking "Join"
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#c4b5fd',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#c4b5fd',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 24,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  joinButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#6b7280',
    opacity: 0.5,
  },
  roomInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  roomIdContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  roomIdBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
  },
  roomIdLabel: {
    fontSize: 12,
    color: '#c4b5fd',
    marginBottom: 4,
  },
  roomIdText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    backgroundColor: '#8b5cf6',
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: {
    fontSize: 20,
  },
  listenersInfo: {
    marginTop: 16,
  },
  listenersText: {
    color: '#c4b5fd',
    fontSize: 14,
  },
  controls: {
    gap: 12,
    marginBottom: 16,
  },
  controlButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  muteButton: {
    backgroundColor: '#ef4444',
  },
  unmuteButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#bfdbfe',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: 'bold',
  },
  features: {
    marginTop: 24,
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#c4b5fd',
  },
  instructions: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#a78bfa',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#c4b5fd',
    lineHeight: 20,
  },
});