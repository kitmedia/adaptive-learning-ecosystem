import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface StudyRoomData {
  roomId: string;
  userId: string;
  userName?: string;
}

interface StudyProgressData {
  roomId: string;
  lessonId: string;
  progress: number;
  timestamp: number;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RealtimeGateway');
  private activeRooms = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    this.logger.log(`🔗 Client connected: ${client.id}`);
    
    // Enviar información de bienvenida
    client.emit('connected', {
      clientId: client.id,
      timestamp: Date.now(),
      message: 'Connected to Adaptive Learning real-time server',
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
    
    // Limpiar cliente de todas las salas
    this.activeRooms.forEach((clients, roomId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        client.to(roomId).emit('user-left', {
          userId: client.id,
          roomId,
          timestamp: Date.now(),
        });
        
        // Si la sala queda vacía, eliminarla
        if (clients.size === 0) {
          this.activeRooms.delete(roomId);
        }
      }
    });
  }

  @SubscribeMessage('join-study-room')
  handleJoinStudyRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: StudyRoomData,
  ) {
    const { roomId, userId, userName } = data;
    
    this.logger.log(`👥 User ${userId} joining study room: ${roomId}`);
    
    // Unirse a la sala
    client.join(roomId);
    
    // Trackear en memoria
    if (!this.activeRooms.has(roomId)) {
      this.activeRooms.set(roomId, new Set());
    }
    this.activeRooms.get(roomId)?.add(client.id);
    
    // Notificar a otros usuarios en la sala
    client.to(roomId).emit('user-joined', {
      userId,
      userName: userName || `User_${userId.slice(-4)}`,
      roomId,
      timestamp: Date.now(),
    });
    
    // Responder al cliente que se unió
    return {
      success: true,
      roomId,
      message: `Successfully joined study room: ${roomId}`,
      activeUsers: this.activeRooms.get(roomId)?.size || 1,
    };
  }

  @SubscribeMessage('leave-study-room')
  handleLeaveStudyRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: StudyRoomData,
  ) {
    const { roomId, userId } = data;
    
    this.logger.log(`👋 User ${userId} leaving study room: ${roomId}`);
    
    // Salir de la sala
    client.leave(roomId);
    
    // Remover del tracking
    const roomClients = this.activeRooms.get(roomId);
    if (roomClients) {
      roomClients.delete(client.id);
      if (roomClients.size === 0) {
        this.activeRooms.delete(roomId);
      }
    }
    
    // Notificar a otros usuarios
    client.to(roomId).emit('user-left', {
      userId,
      roomId,
      timestamp: Date.now(),
    });
    
    return {
      success: true,
      roomId,
      message: `Left study room: ${roomId}`,
    };
  }

  @SubscribeMessage('study-progress')
  handleStudyProgress(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: StudyProgressData,
  ) {
    const { roomId, lessonId, progress } = data;
    
    // Emitir progreso a todos los usuarios en la sala
    client.to(roomId).emit('progress-update', {
      userId: client.id,
      lessonId,
      progress,
      roomId,
      timestamp: Date.now(),
    });
    
    return {
      success: true,
      message: 'Progress shared with study group',
    };
  }

  @SubscribeMessage('study-chat-message')
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      roomId: string;
      message: string;
      userId: string;
      userName?: string;
    },
  ) {
    const { roomId, message, userId, userName } = data;
    
    // Validar mensaje
    if (!message || message.trim().length === 0) {
      return { success: false, error: 'Message cannot be empty' };
    }
    
    // Emitir mensaje a todos en la sala
    this.server.to(roomId).emit('chat-message', {
      userId,
      userName: userName || `User_${userId.slice(-4)}`,
      message: message.trim(),
      roomId,
      timestamp: Date.now(),
    });
    
    return {
      success: true,
      message: 'Message sent to study group',
    };
  }

  @SubscribeMessage('request-room-info')
  handleRoomInfo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const roomClients = this.activeRooms.get(roomId);
    
    return {
      roomId,
      activeUsers: roomClients?.size || 0,
      isActive: roomClients ? roomClients.has(client.id) : false,
      timestamp: Date.now(),
    };
  }

  // Método para obtener estadísticas globales
  @SubscribeMessage('get-global-stats')
  handleGlobalStats() {
    const totalRooms = this.activeRooms.size;
    const totalUsers = Array.from(this.activeRooms.values())
      .reduce((total, room) => total + room.size, 0);
    
    return {
      totalActiveRooms: totalRooms,
      totalActiveUsers: totalUsers,
      averageUsersPerRoom: totalRooms > 0 ? totalUsers / totalRooms : 0,
      timestamp: Date.now(),
    };
  }
}