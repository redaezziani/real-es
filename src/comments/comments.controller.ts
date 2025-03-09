import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentAuthGuard } from './guards/auth.guard';

@Controller('comments')
@UseGuards(CommentAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('manga/:mangaId')
  async createComment(
    @Param('mangaId') mangaId: string,
    @Body() data: { content: string; parentId?: string },
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.commentsService.createComment(
      mangaId,
      userId,
      data.content,
      data.parentId,
    );
  }

  @Get('manga/:mangaId')
  async getComments(@Param('mangaId') mangaId: string, @Request() req) {
    const userId = req.user.sub;
    return this.commentsService.getComments(mangaId, userId);
  }

  @Post(':commentId/like')
  async toggleLike(@Param('commentId') commentId: string, @Request() req) {
    const userId = req.user.sub;
    return this.commentsService.toggleLike(commentId, userId);
  }

  @Delete(':commentId')
  async deleteComment(@Param('commentId') commentId: string, @Request() req) {
    const userId = req.user.sub;
    return this.commentsService.deleteComment(commentId, userId);
  }
}
