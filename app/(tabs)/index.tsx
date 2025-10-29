import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, PermissionsAndroid, Platform } from 'react-native';
import { Bluetooth, Wifi } from 'lucide-react';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import type { Device } from '../types';

export default function BluetoothAudioShare() {
  const [isSharing, setIsSharing] = useState(false);
  const [availableDevice, setAvailableDevice] = useState<Device>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    requestPermissions();

    const discoverDevices = async () => {
      try {
        // Start discovering unpaired devices
        const devices = await RNBluetoothClassic.startDiscovery();

        // Filter for devices that are running your app and sharing audio
        // You'd identify them by a specific service UUID or device name pattern
        const sharingDevices = devices.filter(device =>
          device.name?.startsWith('AudioShare_') // Your app's prefix
        );

        if (sharingDevices.length > 0) {
          setAvailableDevice({
            name: sharingDevices[0].name,
            id: sharingDevices[0].address
          });
        } else {
          setAvailableDevice(null);
        }
      } catch (error) {
        console.error('Discovery error:', error);
      }
    };

    // Discover devices periodically
    const interval = setInterval(() => {
      if (!isSharing && !isConnected) {
        discoverDevices();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      RNBluetoothClassic.cancelDiscovery();
    };
  }, [isSharing, isConnected]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert('Permissions Required', 'Please grant all permissions to use this app');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleShare = () => {
    Alert.alert(
      'Start Sharing',
      'Your phone will start broadcasting audio. Other devices will be able to connect to you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            setIsSharing(true);
            // Here you would initialize Bluetooth server and audio capture
            Alert.alert('Sharing Started', 'Your audio is now being broadcast');
          }
        }
      ]
    );
  };

  const handleStopSharing = () => {
    setIsSharing(false);
    Alert.alert('Stopped', 'Audio sharing has been stopped');
  };

  const handleConnect = () => {
    if (!availableDevice) return;

    Alert.alert(
      'Connect to Device',
      `Connect to ${availableDevice.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: () => {
            setIsConnected(true);
            // Here you would establish Bluetooth connection and audio playback
            Alert.alert('Connected', `Now playing audio from ${availableDevice.name}`);
          }
        }
      ]
    );
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    Alert.alert('Disconnected', 'Audio stream stopped');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bluetooth size={48} color="#4A90E2" />
        <Text style={styles.title}>Bluetooth Audio Share</Text>
        <Text style={styles.subtitle}>Real-time Audio Streaming</Text>
      </View>

      <View style={styles.content}>
        {isSharing ? (
          <View style={styles.statusCard}>
            <View style={styles.pulseContainer}>
              <View style={styles.pulse} />
              <Wifi size={32} color="#4CAF50" />
            </View>
            <Text style={styles.statusText}>Sharing Audio</Text>
            <Text style={styles.statusSubtext}>Other devices can now connect to you</Text>
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStopSharing}
            >
              <Text style={styles.buttonText}>Stop Sharing</Text>
            </TouchableOpacity>
          </View>
        ) : isConnected ? (
          <View style={styles.statusCard}>
            <View style={styles.pulseContainer}>
              <View style={styles.pulse} />
              <Bluetooth size={32} color="#4CAF50" />
            </View>
            <Text style={styles.statusText}>Connected</Text>
            <Text style={styles.statusSubtext}>Playing audio from {availableDevice?.name}</Text>
            <TouchableOpacity
              style={[styles.button, styles.disconnectButton]}
              onPress={handleDisconnect}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : availableDevice ? (
          <View style={styles.deviceCard}>
            <Bluetooth size={40} color="#4A90E2" />
            <Text style={styles.deviceName}>{availableDevice.name}</Text>
            <Text style={styles.deviceSubtext}>Device is sharing audio</Text>
            <TouchableOpacity
              style={[styles.button, styles.connectButton]}
              onPress={handleConnect}
            >
              <Text style={styles.buttonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Bluetooth size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No devices found</Text>
            <Text style={styles.emptySubtext}>Start sharing or wait for nearby devices</Text>
            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={handleShare}
            >
              <Text style={styles.buttonText}>Share Audio</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Expected latency: 150-200ms</Text>
        <Text style={styles.footerNote}>Requires Bluetooth and microphone permissions</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyState: {
    alignItems: 'center',
    width: '100%',
  },
  pulseContainer: {
    position: 'relative',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    opacity: 0.2,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  deviceSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#4A90E2',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#FF5252',
  },
  disconnectButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  footerNote: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});