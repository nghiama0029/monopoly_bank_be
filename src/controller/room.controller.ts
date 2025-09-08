import { Room, RoomUser, TColor, Transaction, User } from '@/entity';
import { GameGateway } from '@/gateway';
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  Patch,
  Query,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('rooms')
export class RoomController {
  private readonly logger = new Logger(RoomController.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RoomUser)
    private readonly roomUserRepo: Repository<RoomUser>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private readonly ws: GameGateway,
  ) {}

  // 🏠 Tạo phòng mới
  @Post('create')
  async createRoom(@Body() body: { userId: number; name: string }) {
    const user = await this.userRepo.findOne({ where: { id: body.userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    const room = this.roomRepo.create({
      name: body.name,
      createdBy: user,
      status: 'waiting',
    });
    await this.roomRepo.save(room);

    // auto add creator vào room
    const roomUser = this.roomUserRepo.create({
      room,
      user,
      balance: 2000,
    });
    await this.roomUserRepo.save(roomUser);

    this.ws.emitRoomCreated(room.id, room);
    this.ws.emitRoomListUpdated();

    return { message: 'Tạo phòng thành công', room };
  }

  // 📋 Lấy danh sách phòng
  // GET /rooms?page=1
  @Get()
  async getRooms(@Query('page') page = 1) {
    const take = 20;
    const skip = (page - 1) * take;

    const [rooms, total] = await this.roomRepo.findAndCount({
      take,
      skip,
      order: { createdAt: 'DESC' },
      relations: ['createdBy', 'roomUsers'],
      where: { isDeleted: false },
    });

    return {
      data: rooms,
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  @Get(':id')
  async getRoomDetails(@Param('id') roomId: string) {
    const room = await this.roomRepo.findOne({
      where: { id: +roomId },
      relations: [
        'createdBy',
        'roomUsers',
        'roomUsers.user',
        'roomProperties',
        'transactions',
      ],
    });

    if (!room) {
      throw new NotFoundException(`Room ${roomId} không tồn tại`);
    }

    return {
      data: room,
    };
  }

  // ➕ Tham gia phòng
  @Post(':roomId/join')
  async joinRoom(
    @Param('roomId') roomId: number,
    @Body() body: { userId: number },
  ) {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['roomUsers', 'roomUsers.user'],
    });
    if (!room) throw new NotFoundException('Room không tồn tại');

    if (room.roomUsers.length >= 4) {
      throw new BadRequestException('Phòng đã đủ 4 người');
    }

    const user = await this.userRepo.findOne({ where: { id: body.userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    // check nếu user đã trong phòng
    const existed = room.roomUsers.find((ru) => ru.user.id === user.id);
    if (existed) {
      throw new BadRequestException('User đã ở trong phòng');
    }

    const colors: TColor[] = ['red', 'blue', 'green', 'yellow'];

    const roomUser = this.roomUserRepo.create({
      room,
      user,
      balance: 2000,
      color: colors[room.roomUsers.length],
    });
    await this.roomUserRepo.save(roomUser);

    this.ws.emitRoomJoined(room.id, user.id);

    return { message: 'Join phòng thành công', roomId: room.id };
  }

  // 🔄 Update balance của user trong room
  @Patch(':roomId/balance')
  async updateBalance(
    @Param('roomId') roomId: number,
    @Body() body: { userId: number; balance: number },
  ) {
    const roomUser = await this.roomUserRepo.find({
      where: {
        room: { id: roomId },
        // user: { id: body.userId },
      },
      relations: ['room', 'user'],
    });

    if (!roomUser.length) {
      throw new NotFoundException('User không tồn tại trong phòng');
    }

    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    roomUser.forEach((user) => {
      user.balance = body.balance;
    });
    room.balance = body.balance;

    await this.roomRepo.save(room);
    await this.roomUserRepo.save(roomUser);

    this.ws.emitBalanceUpdated({
      roomId,
      userId: body.userId,
      balance: body.balance,
    });

    return {
      message: 'Cập nhật balance thành công',
      roomId,
      newBalance: body.balance,
    };
  }

  @Post(':roomId/start')
  async startGame(@Param('roomId') roomId: number) {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['roomUsers'],
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.status !== 'waiting')
      throw new BadRequestException('Game already started or finished');
    if (room.roomUsers.length < 2)
      throw new BadRequestException('Need at least 2 players');

    // set first turn = user đầu tiên
    room.currentTurnUserId = room.roomUsers[0].id;
    room.status = 'playing';

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    this.ws.emitGameStarted(room.id, room.currentTurnUserId!);

    return this.roomRepo.save(room);
  }

  @Post(':roomId/end')
  async endGame(@Param('roomId') roomId: number) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.status !== 'playing')
      throw new BadRequestException('Game is not running');

    const roomUser = await this.roomUserRepo.find({
      where: {
        room: { id: roomId },
      },
      relations: ['room', 'user'],
    });

    roomUser.forEach((user) => {
      user.balance = room.balance;
    });
    await this.roomUserRepo.save(roomUser);
    await this.txRepo.delete({ room: { id: roomId } });

    room.status = 'waiting';

    this.ws.emitGameEnded(room.id);

    return this.roomRepo.save(room);
  }

  // user thoát phòng
  @Post(':roomId/leave')
  async leaveRoom(
    @Param('roomId') roomId: number,
    @Body('userId') userId: number, // lấy userId từ body
  ) {
    // Tìm room kèm createdBy
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['createdBy', 'roomUsers', 'roomProperties', 'transactions'],
    });

    if (!room) {
      throw new NotFoundException('Room không tồn tại');
    }

    // Nếu user là chủ phòng => xoá luôn phòng + roomUsers (nhờ onDelete: CASCADE)
    if (room.createdBy.id === userId) {
      await this.roomRepo.remove(room);
      this.ws.emitRoomLeave(room.id, userId);
      return { success: true, message: 'Chủ phòng đã thoát, phòng bị xoá' };
    }

    // Nếu user chỉ là thành viên => xoá khỏi roomUsers
    const roomUser = await this.roomUserRepo.findOne({
      where: { room: { id: roomId }, user: { id: userId } },
      relations: ['room', 'user'],
    });

    if (!roomUser) {
      throw new ForbiddenException('User không ở trong phòng này');
    }

    await this.roomUserRepo.remove(roomUser);
    this.ws.emitRoomLeave(room.id, userId);

    return { success: true, message: 'Thoát phòng thành công' };
  }
}
