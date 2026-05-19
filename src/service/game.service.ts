import {
  Room,
  RoomUser,
  RoomProperty,
  Transaction,
  TTransactionType,
} from '@/entity';
import { GameGateway } from '@/gateway';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class TransactionDto {
  fromUserId?: number;
  toUserId?: number;
  amount: number;
  type: TTransactionType;
}

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(RoomUser)
    private readonly roomUserRepo: Repository<RoomUser>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(RoomProperty)
    private readonly roomPropertyRepo: Repository<RoomProperty>,
    private readonly ws: GameGateway,
  ) {}

  async nextTurn(roomId: number) {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['roomUsers', 'roomUsers.user'],
    });
    if (!room) throw new NotFoundException('Room not found');

    const currentIndex = room.roomUsers.findIndex(
      (u) => u.id === room.currentTurnUserId,
    );

    // Tìm người chơi tiếp theo chưa đầu hàng
    let nextIndex = currentIndex;
    for (let i = 1; i <= room.roomUsers.length; i++) {
      const checkIndex = (currentIndex + i) % room.roomUsers.length;
      if (!room.roomUsers[checkIndex].hasSurrendered) {
        nextIndex = checkIndex;
        break;
      }
    }

    room.currentTurnUserId = room.roomUsers[nextIndex].id;
    await this.roomRepo.save(room);

    this.ws.emitNextTurn({
      roomId: +roomId,
      currentTurnUserId: room.currentTurnUserId,
    });

    return { message: 'Next turn set', nextUserId: room.currentTurnUserId };
  }

  async transaction(roomId: number, body: TransactionDto) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    // Trừ tiền từ fromUser (nếu có)
    let from: RoomUser | null = null;
    if (body.fromUserId) {
      from = await this.roomUserRepo.findOne({
        where: { room: { id: roomId }, user: { id: body.fromUserId } },
        relations: ['user'],
      });
      if (!from) throw new NotFoundException('From user not in room');
      if (from.hasSurrendered) {
        throw new BadRequestException(
          'User đã đầu hàng và không thể thực hiện giao dịch',
        );
      }
      from.balance =
        body.type === 'pass_start'
          ? from.balance + body.amount
          : from.balance - body.amount;
      await this.roomUserRepo.save(from);
    }

    // Cộng tiền cho toUser (nếu có)
    let to: RoomUser | null = null;
    if (body.toUserId) {
      to = await this.roomUserRepo.findOne({
        where: { room: { id: roomId }, user: { id: body.toUserId } },
        relations: ['user'],
      });
      if (!to) throw new NotFoundException('To user not in room');
      if (to.hasSurrendered) {
        throw new BadRequestException(
          'User đã đầu hàng và không thể nhận giao dịch',
        );
      }
      to.balance += body.amount;
      await this.roomUserRepo.save(to);
    }

    // Log transaction
    const tx = this.txRepo.create({
      room,
      fromUser: from?.user,
      toUser: to?.user,
      amount: body.amount,
      type: body.type,
    });
    await this.txRepo.save(tx);

    let fromUserName = '';
    let toUserName = '';

    if (body.type === 'pass_start') {
      fromUserName = 'Bank';
      toUserName = tx.fromUser?.nickname;
    } else {
      fromUserName = tx.fromUser?.nickname || 'Bank';
      toUserName = tx.toUser?.nickname || 'Bank';
    }

    this.ws.emitTransaction({
      roomId: +roomId,
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      fromUserId: tx.fromUser?.id,
      toUserId: tx.toUser?.id,
      fromUserName,
      toUserName,
      createdAt: tx.createdAt.toISOString(),
    });

    return { message: 'Transaction successful', tx };
  }

  async surrender(roomId: number, userId: number) {
    // 1. Tìm Room cùng danh sách roomUsers
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['createdBy', 'roomUsers', 'roomUsers.user'],
    });
    if (!room) throw new NotFoundException('Phòng không tồn tại');
    if (room.status !== 'playing') {
      throw new BadRequestException('Game chưa bắt đầu hoặc đã kết thúc');
    }

    // 2. Tìm RoomUser của người đầu hàng
    const roomUser = await this.roomUserRepo.findOne({
      where: { room: { id: roomId }, user: { id: userId } },
      relations: ['room', 'user'],
    });
    if (!roomUser) {
      throw new NotFoundException('Người chơi không ở trong phòng này');
    }
    if (roomUser.hasSurrendered) {
      throw new BadRequestException('Bạn đã đầu hàng trước đó rồi');
    }

    // 3. Giải phóng toàn bộ đất đai của user đó về Ngân hàng (chuyển owner = null, mortgaged = false)
    const userProperties = await this.roomPropertyRepo.find({
      where: { room: { id: roomId }, owner: { id: userId } },
    });
    if (userProperties.length > 0) {
      userProperties.forEach((prop) => {
        prop.owner = null;
        prop.mortgaged = false;
      });
      await this.roomPropertyRepo.save(userProperties);
    }

    // 4. Cập nhật hasSurrendered = true
    roomUser.hasSurrendered = true;
    await this.roomUserRepo.save(roomUser);

    // Phát socket thông báo người chơi đầu hàng
    this.ws.emitPlayerSurrendered(roomId, userId);

    // 5. Kiểm tra xem ván đấu có bị kết thúc không (số người chơi hoạt động còn lại <= 1)
    const activePlayers = room.roomUsers.filter(
      (u) => u.id !== roomUser.id && !u.hasSurrendered,
    );

    if (activePlayers.length <= 1) {
      // Reset số dư của tất cả người chơi về mặc định phòng
      const allRoomUsers = await this.roomUserRepo.find({
        where: { room: { id: roomId } },
        relations: ['room', 'user'],
      });

      allRoomUsers.forEach((ru) => {
        ru.balance = room.balance;
        ru.hasSurrendered = false; // Reset trạng thái để ván sau chơi tiếp
      });
      await this.roomUserRepo.save(allRoomUsers);

      // Xoá lịch sử giao dịch
      await this.txRepo.delete({ room: { id: roomId } });

      // Thu hồi toàn bộ tài sản về Ngân hàng
      const properties = await this.roomPropertyRepo.find({
        where: { room: { id: roomId } },
      });
      if (properties.length > 0) {
        properties.forEach((prop) => {
          prop.owner = null;
          prop.mortgaged = false;
        });
        await this.roomPropertyRepo.save(properties);
      }

      // Đổi trạng thái phòng về waiting
      room.status = 'waiting';
      room.currentTurnUserId = null;
      await this.roomRepo.save(room);

      // Phát socket kết thúc game
      this.ws.emitGameEnded(roomId);

      return {
        success: true,
        gameEnded: true,
        message: 'Game kết thúc do người chơi khác đã đầu hàng hết.',
      };
    }

    // 6. Nếu ván chơi vẫn tiếp tục và người vừa đầu hàng đang là người giữ lượt chơi
    if (room.currentTurnUserId === roomUser.id) {
      await this.nextTurn(roomId);
    }

    return {
      success: true,
      gameEnded: false,
      message: 'Đầu hàng thành công. Bạn đã rút lui khỏi ván game.',
    };
  }

  async getTransactions(roomId: number, page = 1) {
    const take = 20;
    const skip = (page - 1) * take;

    const [txs, total] = await this.txRepo.findAndCount({
      where: { room: { id: roomId } },
      relations: ['fromUser', 'toUser'],
      take,
      skip,
      order: { createdAt: 'DESC' },
    });

    return {
      data: txs,
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }
}
