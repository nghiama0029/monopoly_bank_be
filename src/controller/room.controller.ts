import { RoomService } from '@/service';
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Query,
} from '@nestjs/common';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // 🏠 Tạo phòng mới
  @Post('create')
  async createRoom(@Body() body: { userId: number; name: string }) {
    return this.roomService.createRoom(body);
  }

  // 📋 Lấy danh sách phòng
  @Get()
  async getRooms(@Query('page') page = 1) {
    return this.roomService.getRooms(page);
  }

  @Get(':id')
  async getRoomDetails(@Param('id') roomId: string) {
    return this.roomService.getRoomDetails(+roomId);
  }

  // ➕ Tham gia phòng
  @Post(':roomId/join')
  async joinRoom(
    @Param('roomId') roomId: number,
    @Body() body: { userId: number },
  ) {
    return this.roomService.joinRoom(roomId, body);
  }

  // 🔄 Update balance của user hoặc room
  @Patch(':roomId/balance')
  async updateBalance(
    @Param('roomId') roomId: number,
    @Body() body: { userId?: number; balance: number },
  ) {
    return this.roomService.updateBalance(roomId, body);
  }

  @Post(':roomId/start')
  async startGame(@Param('roomId') roomId: number) {
    return this.roomService.startGame(roomId);
  }

  @Post(':roomId/end')
  async endGame(@Param('roomId') roomId: number) {
    return this.roomService.endGame(roomId);
  }

  @Patch(':roomId/users/:userId/color')
  async changeUserColor(
    @Param('roomId') roomId: string,
    @Param('userId') targetUserId: string,
    @Body() body: { requesterUserId: number; color: any },
  ) {
    return this.roomService.changeUserColor(+roomId, +targetUserId, body);
  }

  // user thoát phòng
  @Post(':roomId/leave')
  async leaveRoom(
    @Param('roomId') roomId: number,
    @Body('userId') userId: number,
  ) {
    return this.roomService.leaveRoom(roomId, userId);
  }
}
