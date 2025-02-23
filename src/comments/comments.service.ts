// src/comments/comments.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma.service';
import { Comment } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(
    mangaId: string,
    userId: string,
    content: string,
    parentId?: string,
  ): Promise<Comment> {
    if (parentId) {
      const parentExists = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentExists) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    return this.prisma.comment.create({
      data: {
        content,
        mangaId,
        userId,
        parentId,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async getComments(mangaId: string, userId?: string) {
    const comments = await this.prisma.comment.findMany({
      where: {
        mangaId,
        parentId: null, // Get only top-level comments
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        replies: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
            replies: true,
            likes: true,
            _count: {
              select: { replies: true },
            },
          },
        },
        likes: true,
        _count: {
          select: { replies: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add liked status for the current user if userId is provided
    if (userId) {
      return comments.map((comment) => ({
        ...comment,
        isLiked: comment.likes.some((like) => like.userId === userId),
        replies: comment.replies.map((reply) => ({
          ...reply,
          isLiked: reply.likes.some((like) => like.userId === userId),
        })),
      }));
    }

    return comments;
  }

  async toggleLike(commentId: string, userId: string): Promise<void> {
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.commentLike.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      await this.prisma.commentLike.create({
        data: {
          commentId,
          userId,
        },
      });
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this comment');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
