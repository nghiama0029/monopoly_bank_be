import { TTransactionType } from '@/entity';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { log } from 'console';
import { Server, Socket } from 'socket.io';

type JoinRoomPayload = { roomId: number; userId: number };
type BalanceUpdatedPayload = {
  roomId: number;
  userId: number;
  balance: number;
};
type NextTurnPayload = { roomId: number; currentTurnUserId: number };
type TxPayload = {
  roomId: number;
  id: number; // transaction id
  type: TTransactionType;
  amount: number;
  fromUserId?: number;
  toUserId?: number;
  createdAt: string;
};

@WebSocketGateway({
  namespace: '/ws',
  cors: { origin: '*' },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;

  handleConnection(client: Socket) {
    log(client);
    // Bạn có thể log token ở đây nếu cần auth
    // console.log('connected', client.id);
  }

  handleDisconnect(client: Socket) {
    log(client);
    // console.log('disconnected', client.id);
  }

  // client join kênh theo roomId (socket.io room)
  @SubscribeMessage('room:join')
  async onJoin(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room:${payload.roomId}`;
    await client.join(roomName);
    // Thông báo cho các client khác trong room
    this.io.to(roomName).emit('room:joined', { userId: payload.userId });
    return { ok: true, joined: roomName };
  }

  // emit helpers
  emitRoomCreated(roomId: number, room: any) {
    this.io.emit('room:created', { roomId, room });
  }
  emitRoomListUpdated() {
    this.io.emit('rooms:updated'); // để FE tự fetch lại trang list
  }
  emitRoomJoined(roomId: number, userId: number) {
    this.io.to(`room:${roomId}`).emit('room:user_joined', { userId });
  }
  emitRoomLeave(roomId: number, userId: number) {
    this.io.to(`room:${roomId}`).emit('room:user_leave', { userId });
  }
  emitGameStarted(roomId: number, currentTurnUserId: number) {
    this.io.to(`room:${roomId}`).emit('game:started', { currentTurnUserId });
  }
  emitGameEnded(roomId: number) {
    this.io.to(`room:${roomId}`).emit('game:ended');
  }
  emitNextTurn(payload: NextTurnPayload) {
    this.io.to(`room:${payload.roomId}`).emit('game:next_turn', payload);
  }
  emitBalanceUpdated(payload: BalanceUpdatedPayload) {
    this.io.to(`room:${payload.roomId}`).emit('user:balance_updated', payload);
  }
  emitTransaction(payload: TxPayload) {
    this.io.to(`room:${payload.roomId}`).emit('tx:created', payload);
  }
}
