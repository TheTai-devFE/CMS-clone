import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[SyncGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[SyncGateway] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, payload: { playlistId: string; deviceId: string }) {
    const { playlistId, deviceId } = payload;
    if (!playlistId) return;
    client.join(playlistId);
    console.log(`[SyncGateway] Device ${deviceId} (Socket ${client.id}) joined room: ${playlistId}`);
  }

  @SubscribeMessage('master_time_update')
  handleMasterTimeUpdate(
    client: Socket,
    payload: {
      playlistId: string;
      deviceId: string;
      mediaId: string;
      currentTime: number;
      timestamp: number;
    },
  ) {
    const { playlistId, mediaId, currentTime, timestamp } = payload;
    if (!playlistId) return;

    // Broadcast sync signal to all other clients in the playlist room (slaves)
    client.to(playlistId).emit('slave_sync', {
      mediaId,
      currentTime,
      timestamp,
    });
  }
}
