import { Room, RoomUser, Transaction, TTransactionType } from '@/entity';
import { GameGateway } from '@/gateway';
import {
  Controller,
  Patch,
  Post,
  Get,
  Param,
  Body,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

class TransactionDto {
  fromUserId?: number;
  toUserId?: number;
  amount: number;
  type: TTransactionType;
}

@Controller('game')
export class GameController {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(RoomUser)
    private readonly roomUserRepo: Repository<RoomUser>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private readonly ws: GameGateway,
  ) {}

  // 🔄 Next turn
  @Patch(':roomId/next-turn')
  async nextTurn(@Param('roomId') roomId: number) {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['roomUsers', 'roomUsers.user'],
    });
    if (!room) throw new NotFoundException('Room not found');

    const currentIndex = room.roomUsers.findIndex(
      (u) => u.id === room.currentTurnUserId,
    );
    const nextIndex = (currentIndex + 1) % room.roomUsers.length;
    room.currentTurnUserId = room.roomUsers[nextIndex].id;

    await this.roomRepo.save(room);

    this.ws.emitNextTurn({
      roomId: +roomId,
      currentTurnUserId: nextIndex,
    });

    return { message: 'Next turn set', nextUserId: room.currentTurnUserId };
  }

  // 💰 Transaction (mua đất, trả tiền thuê, chuyển tiền, thuế)
  @Post(':roomId/transaction')
  async transaction(
    @Param('roomId') roomId: number,
    @Body() body: TransactionDto,
  ) {
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

  // 📜 Lịch sử giao dịch
  @Get(':roomId/logs')
  async getTransactions(
    @Param('roomId') roomId: number,
    @Query('page') page = 1,
  ) {
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
