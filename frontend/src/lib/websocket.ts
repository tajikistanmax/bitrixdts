import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit:', event);
    }
  }

  // Notification events
  onNotification(callback: (notification: Notification) => void) {
    this.on('notification', callback);
  }

  onTaskAssigned(callback: (task: any) => void) {
    this.on('task_assigned', callback);
  }

  onTaskStatusChanged(callback: (task: any) => void) {
    this.on('task_status_changed', callback);
  }

  onTaskComment(callback: (comment: any) => void) {
    this.on('task_comment', callback);
  }

  onWorkflowApproval(callback: (workflow: any) => void) {
    this.on('workflow_approval', callback);
  }

  // Join room for user-specific events
  joinUserRoom(userId: string) {
    this.emit('join_user_room', { userId });
  }

  // Leave room
  leaveUserRoom(userId: string) {
    this.emit('leave_user_room', { userId });
  }
}

export const websocketService = new WebSocketService();
