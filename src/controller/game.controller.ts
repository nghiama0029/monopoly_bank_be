import { GameService, TransactionDto } from '@/service';
import {
  Controller,
  Patch,
  Post,
  Get,
  Param,
  Body,
  Query,
} from '@nestjs/common';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // 🔄 Next turn
  @Patch(':roomId/next-turn')
  async nextTurn(@Param('roomId') roomId: number) {
    return this.gameService.nextTurn(roomId);
  }

  // 💰 Transaction (mua đất, trả tiền thuê, chuyển tiền, thuế)
  @Post(':roomId/transaction')
  async transaction(
    @Param('roomId') roomId: number,
    @Body() body: TransactionDto,
  ) {
    return this.gameService.transaction(roomId, body);
  }

  // 🏳️ Đầu hàng (Surrender)
  @Post(':roomId/surrender')
  async surrender(
    @Param('roomId') roomId: number,
    @Body('userId') userId: number,
  ) {
    return this.gameService.surrender(roomId, userId);
  }

  // 📜 Lịch sử giao dịch
  @Get(':roomId/logs')
  async getTransactions(
    @Param('roomId') roomId: number,
    @Query('page') page = 1,
  ) {
    return this.gameService.getTransactions(roomId, page);
  }
}
