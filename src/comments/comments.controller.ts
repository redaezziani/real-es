import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('manga/:mangaId')
  async createComment(
    @Param('mangaId') mangaId: string,
    @Body() data: { content: string; parentId?: string },
    @Query('userId') userId: string,
  ) {
    return this.commentsService.createComment(
      mangaId,
      userId,
      data.content,
      data.parentId,
    );
  }

  @Get('manga/:mangaId')
  async getComments(
    @Param('mangaId') mangaId: string,
    @Query('userId') userId: string,
  ) {
    return this.commentsService.getComments(mangaId, userId);
  }

  @Post(':commentId/like')
  async toggleLike(
    @Param('commentId') commentId: string,
    @Query('userId') userId: string,
  ) {
    return this.commentsService.toggleLike(commentId, userId);
  }

  @Delete(':commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @Query('userId') userId: string,
  ) {
    return this.commentsService.deleteComment(commentId, userId);
  }
}
