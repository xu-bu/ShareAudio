import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";

export interface WebRTCConfig {
  iceServers: {
    urls: string[];
    username?: string;
    credential?: string;
  }[];
}

export interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "join" | "leave";
  roomId: string;
  senderId: string;
  data?: any;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private ws: WebSocket | null = null;
  private roomId: string = "";
  private peerId: string = "";
  private onRemoteStream?: (stream: MediaStream) => void;
  private onConnectionStateChange?: (state: string) => void;
  private onListenerCountChange?: (count: number) => void;

  private config: WebRTCConfig = {
    iceServers: [
      // STUN servers
      { urls: ["stun:stun.l.google.com:19302"] },
      { urls: ["stun:stun1.l.google.com:19302"] },

      // Free TURN servers (for NAT traversal)
      {
        urls: ["turn:openrelay.metered.ca:80"],
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: ["turn:openrelay.metered.ca:443"],
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: ["turn:openrelay.metered.ca:443?transport=tcp"],
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    ],
  };

  constructor() {
    this.peerId = this.generateId();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Connect to signaling server
  connectSignaling(signalingServerUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(signalingServerUrl);

        this.ws.onopen = () => {
          console.log("Connected to signaling server");
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleSignalingMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("Disconnected from signaling server");
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Start sharing audio as host
  async startSharing(roomId: string): Promise<string> {
    try {
      this.roomId = roomId;

      // Get audio stream from microphone
      // For system audio, you might need additional native modules
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.localStream = stream;

      // Create peer connection
      this.createPeerConnection();

      // Add audio track to peer connection
      stream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, stream);
      });

      // Send join message to signaling server
      this.sendSignalingMessage({
        type: "join",
        roomId: this.roomId,
        senderId: this.peerId,
        data: { role: "host" },
      });

      return roomId;
    } catch (error) {
      console.error("Error starting audio share:", error);
      throw error;
    }
  }

  // Join room as listener
  async joinRoom(roomId: string): Promise<void> {
    try {
      this.roomId = roomId;

      // Create peer connection
      this.createPeerConnection();

      // Send join message
      this.sendSignalingMessage({
        type: "join",
        roomId: this.roomId,
        senderId: this.peerId,
        data: { role: "listener" },
      });

      // Create offer
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await this.peerConnection!.setLocalDescription(offer);

      // Send offer to signaling server
      this.sendSignalingMessage({
        type: "offer",
        roomId: this.roomId,
        senderId: this.peerId,
        data: offer,
      });
    } catch (error) {
      console.error("Error joining room:", error);
      throw error;
    }
  }

  // Create peer connection
  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection(this.config);
    this.peerConnection._registerEvents();

    // Cast to the proper EventTarget type
    const pc = this.peerConnection as RTCPeerConnection & {
      addEventListener<K extends keyof RTCPeerConnectionEventMap>(
        type: K,
        listener: (event: RTCPeerConnectionEventMap[K]) => void
      ): void;
    };

    // Handle ICE candidates
    pc.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: "ice-candidate",
          roomId: this.roomId,
          senderId: this.peerId,
          data: event.candidate,
        });
      }
    });

    // Handle remote stream
    pc.addEventListener('track', (event) => {
      console.log("Received remote track");
      if (event.streams && event.streams[0]) {
        // Cast through unknown to avoid type conflict
        this.onRemoteStream?.(event.streams[0] as unknown as MediaStream);
      }
    });

    // Handle connection state changes
    pc.addEventListener('connectionstatechange', () => {
      const state = this.peerConnection?.connectionState || "unknown";
      console.log("Connection state:", state);
      this.onConnectionStateChange?.(state);
    });

    // Handle ICE connection state
    pc.addEventListener('iceconnectionstatechange', () => {
      console.log(
        "ICE connection state:",
        this.peerConnection?.iceConnectionState
      );
    });
  }

  // Handle signaling messages
  private async handleSignalingMessage(
    message: SignalingMessage
  ): Promise<void> {
    try {
      switch (message.type) {
        case "offer":
          if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(
              new RTCSessionDescription(message.data)
            );
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            this.sendSignalingMessage({
              type: "answer",
              roomId: this.roomId,
              senderId: this.peerId,
              data: answer,
            });
          }
          break;

        case "answer":
          if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(
              new RTCSessionDescription(message.data)
            );
          }
          break;

        case "ice-candidate":
          if (this.peerConnection && message.data) {
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(message.data)
            );
          }
          break;

        default:
          console.log("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Error handling signaling message:", error);
    }
  }

  // Send message through signaling server
  private sendSignalingMessage(message: SignalingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }

  // Mute/unmute audio
  toggleMute(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  // Stop sharing and cleanup
  stopSharing(): void {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Send leave message
    if (this.roomId) {
      this.sendSignalingMessage({
        type: "leave",
        roomId: this.roomId,
        senderId: this.peerId,
      });
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.roomId = "";
  }

  // Set callback for remote stream
  setOnRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStream = callback;
  }

  // Set callback for connection state changes
  setOnConnectionStateChange(callback: (state: string) => void): void {
    this.onConnectionStateChange = callback;
  }

  // Set callback for listener count changes
  setOnListenerCountChange(callback: (count: number) => void): void {
    this.onListenerCountChange = callback;
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}

export default new WebRTCService();
