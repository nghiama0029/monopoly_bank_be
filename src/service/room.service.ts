import {
  Room,
  RoomUser,
  RoomProperty,
  TColor,
  Transaction,
  User,
} from '@/entity';
import { GameGateway } from '@/gateway';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RoomUser)
    private readonly roomUserRepo: Repository<RoomUser>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(RoomProperty)
    private readonly roomPropertyRepo: Repository<RoomProperty>,
    private readonly ws: GameGateway,
  ) {}

  async createRoom(body: { userId: number; name: string }) {
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

  async getRooms(page = 1) {
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

  async getRoomDetails(roomId: number) {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['createdBy', 'roomUsers', 'roomUsers.user', 'roomProperties'],
    });

    if (!room) {
      throw new NotFoundException(`Room ${roomId} không tồn tại`);
    }

    // Lấy 20 giao dịch gần nhất
    const transactions = await this.txRepo.find({
      where: { room: { id: roomId } },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    // Gắn vào object room để trả về đúng cấu trúc cũ
    room.transactions = transactions;

    return {
      data: room,
    };
  }

  async joinRoom(roomId: number, body: { userId: number }) {
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
    const takenColors = room.roomUsers.map((ru) => ru.color);
    const availableColor =
      colors.find((color) => !takenColors.includes(color)) || 'red';

    const roomUser = this.roomUserRepo.create({
      room,
      user,
      balance: 2000,
      color: availableColor,
    });
    await this.roomUserRepo.save(roomUser);

    this.ws.emitRoomJoined(room.id, user.id);

    return { message: 'Join phòng thành công', roomId: room.id };
  }

  async updateBalance(
    roomId: number,
    body: { userId?: number; balance: number },
  ) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    if (body.userId) {
      // 1. Chỉ cập nhật số dư cho người chơi cụ thể
      const roomUser = await this.roomUserRepo.findOne({
        where: {
          room: { id: roomId },
          user: { id: body.userId },
        },
        relations: ['room', 'user'],
      });

      if (!roomUser) {
        throw new NotFoundException('User không tồn tại trong phòng');
      }

      roomUser.balance = body.balance;
      await this.roomUserRepo.save(roomUser);

      this.ws.emitBalanceUpdated({
        roomId,
        userId: body.userId,
        balance: body.balance,
      });

      return {
        message: 'Cập nhật balance thành công cho user',
        roomId,
        userId: body.userId,
        newBalance: body.balance,
      };
    } else {
      // 2. Cập nhật số dư khởi đầu của phòng và toàn bộ người chơi trong phòng
      const roomUsers = await this.roomUserRepo.find({
        where: { room: { id: roomId } },
        relations: ['room', 'user'],
      });

      roomUsers.forEach((user) => {
        user.balance = body.balance;
      });
      room.balance = body.balance;

      await this.roomRepo.save(room);
      if (roomUsers.length > 0) {
        await this.roomUserRepo.save(roomUsers);
      }

      // Phát sự kiện cập nhật cho từng user
      roomUsers.forEach((user) => {
        this.ws.emitBalanceUpdated({
          roomId,
          userId: user.user.id,
          balance: body.balance,
        });
      });

      return {
        message: 'Cập nhật balance mặc định thành công',
        roomId,
        newBalance: body.balance,
      };
    }
  }

  async startGame(roomId: number) {
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

    room.roomUsers.forEach((u) => {
      u.hasSurrendered = false;
    });
    await this.roomUserRepo.save(room.roomUsers);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    this.ws.emitGameStarted(room.id, room.currentTurnUserId!);

    return this.roomRepo.save(room);
  }

  async endGame(roomId: number) {
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
      user.hasSurrendered = false;
    });
    await this.roomUserRepo.save(roomUser);
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

    room.status = 'waiting';

    this.ws.emitGameEnded(room.id);

    return this.roomRepo.save(room);
  }

  async changeUserColor(
    roomId: number,
    targetUserId: number,
    body: { requesterUserId: number; color: TColor },
  ) {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['createdBy', 'roomUsers', 'roomUsers.user'],
    });

    if (!room) {
      throw new NotFoundException('Room không tồn tại');
    }

    const { requesterUserId, color } = body;

    const validColors: TColor[] = ['red', 'blue', 'green', 'yellow'];
    if (!validColors.includes(color)) {
      throw new BadRequestException('Màu sắc không hợp lệ');
    }

    const isHost = room.createdBy.id === requesterUserId;

    if (!isHost && requesterUserId !== targetUserId) {
      throw new ForbiddenException(
        'Bạn không có quyền thay đổi màu của người chơi này',
      );
    }

    if (!isHost) {
      // Người chơi thường: kiểm tra màu đã có ai dùng chưa
      const takenColors = room.roomUsers
        .filter((ru) => ru.user.id !== targetUserId)
        .map((ru) => ru.color);
      if (takenColors.includes(color)) {
        throw new BadRequestException('Màu này đã có người sử dụng');
      }
    }

    const targetRoomUser = room.roomUsers.find(
      (ru) => ru.user.id === targetUserId,
    );
    if (!targetRoomUser) {
      throw new NotFoundException('Người chơi không tồn tại trong phòng');
    }

    targetRoomUser.color = color;
    await this.roomUserRepo.save(targetRoomUser);

    this.ws.emitUserColorChanged(roomId, targetUserId, color);

    return {
      message: 'Thay đổi màu sắc thành công',
      roomId,
      userId: targetUserId,
      newColor: color,
    };
  }

  async leaveRoom(roomId: number, userId: number) {
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

    // Giải phóng tất cả đất đai của user đó trong phòng (chuyển về Bank) trước khi xóa
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

    await this.roomUserRepo.remove(roomUser);
    this.ws.emitRoomLeave(room.id, userId);

    return { success: true, message: 'Thoát phòng thành công' };
  }
}
