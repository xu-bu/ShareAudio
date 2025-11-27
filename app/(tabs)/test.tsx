import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import { mediaDevices, MediaStream } from 'react-native-webrtc';
import RNFS from 'react-native-fs';

const AudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedFilePath, setRecordedFilePath] = useState<string>('');
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Request audio permission (Android)
    const requestAudioPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Audio Recording Permission',
                        message: 'This app needs access to your microphone to record audio.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    // Start recording
    const startRecording = async () => {
        try {
            // Request permission
            const hasPermission = await requestAudioPermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Audio recording permission is required');
                return;
            }

            // Get audio stream from microphone
            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });

            mediaStreamRef.current = stream;
            audioChunksRef.current = [];

            // Note: react-native-webrtc doesn't have MediaRecorder
            // You'll need to use a different approach for actual recording
            // This is a conceptual implementation

            // For actual implementation, consider using:
            // - react-native-audio-recorder-player
            // - react-native-recording
            // - or native modules

            console.log('Recording started');
            setIsRecording(true);
            Alert.alert('Recording', 'Audio recording started');

        } catch (error: any) {
            console.error('Error starting recording:', error);
            Alert.alert('Error', 'Failed to start recording: ' + error.message);
        }
    };

    // Stop recording
    const stopRecording = async () => {
        try {
            if (mediaStreamRef.current) {
                // Stop all tracks
                mediaStreamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });
                mediaStreamRef.current = null;
            }

            // Save the recording
            const fileName = `recording_${Date.now()}.wav`;
            const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

            setRecordedFilePath(filePath);
            setIsRecording(false);

            console.log('Recording stopped');
            Alert.alert(
                'Recording Saved',
                `File saved to: ${filePath}`,
                [
                    {
                        text: 'OK',
                        onPress: () => console.log('File path:', filePath),
                    },
                ]
            );

        } catch (error: any) {
            console.error('Error stopping recording:', error);
            Alert.alert('Error', 'Failed to stop recording: ' + error.message);
        }
    };

    // Toggle recording
    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Audio Recorder</Text>

            <TouchableOpacity
                style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                ]}
                onPress={toggleRecording}
            >
                <View style={[styles.innerCircle, isRecording && styles.innerSquare]} />
            </TouchableOpacity>

            <Text style={styles.statusText}>
                {isRecording ? 'Recording...' : 'Tap to Record'}
            </Text>

            {recordedFilePath ? (
                <View style={styles.fileInfo}>
                    <Text style={styles.fileLabel}>Last Recording:</Text>
                    <Text style={styles.filePath} numberOfLines={2}>
                        {recordedFilePath}
                    </Text>
                </View>
            ) : null}

            <View style={styles.note}>
                <Text style={styles.noteTitle}>⚠️ Important Note:</Text>
                <Text style={styles.noteText}>
                    react-native-webrtc doesn't support audio recording to file.
                    {'\n\n'}
                    For actual audio recording, please use:
                    {'\n'}• react-native-audio-recorder-player
                    {'\n'}• @react-native-community/audio-toolkit
                    {'\n'}• expo-av (if using Expo)
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 50,
        color: '#333',
    },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ff4444',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    recordButtonActive: {
        backgroundColor: '#cc0000',
    },
    innerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    innerSquare: {
        borderRadius: 8,
        width: 40,
        height: 40,
    },
    statusText: {
        fontSize: 18,
        marginTop: 30,
        color: '#666',
        fontWeight: '500',
    },
    fileInfo: {
        marginTop: 40,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    fileLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    filePath: {
        fontSize: 12,
        color: '#666',
    },
    note: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#fff3cd',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    noteTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 8,
    },
    noteText: {
        fontSize: 12,
        color: '#856404',
        lineHeight: 18,
    },
});

export default AudioRecorder;