import { CreatePost, Post, UpdatePost } from '../schemas/post.ts';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import prisma from '@/database/prisma.ts';
import { DatabaseData, DatabaseError } from '@/schemas/database-data.ts';
import { Prisma } from '@/generated/prisma/client.ts';

export class PostsRepository {
  createPost(post: CreatePost): ResultAsync<DatabaseData<Post>, DatabaseError> {
    return ResultAsync.fromPromise(
      prisma.$transaction(async (tx) => {
        let category = await tx.category.findFirst({
          where: { name: post.category },
        });

        if (!category) {
          category = await tx.category.create({
            data: { name: post.category },
          });
        }

        const tags = await Promise.all(
          post.tags.map((name) =>
            tx.tag.upsert({
              where: { name },
              create: { name },
              update: {},
            })
          ),
        );

        const createdPost = await tx.post.create({
          data: {
            categoryId: category.id,
            content: post.content,
            title: post.title,
            tags: {
              connect: tags.map((tag) => ({ id: tag.id })),
            },
          },
          include: {
            category: {
              select: {
                name: true,
              },
            },
            tags: {
              select: {
                name: true,
              },
            },
          },
        });

        return {
          data: {
            id: createdPost.id,
            title: createdPost.title,
            content: createdPost.content,
            category: createdPost.category.name,
            tags: createdPost.tags.map((tag) => tag.name),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString(),
          },
          message: 'Post created successfully',
        };
      }),
      (error) => ({
        type: 'DATABASE_ERROR',
        message: error instanceof Error
          ? error.message
          : 'Failed to create post',
      } as DatabaseError),
    );
  }

  getAllPosts(term?: string): ResultAsync<DatabaseData<Post[]>, DatabaseError> {
    return ResultAsync.fromPromise(
      prisma.post.findMany({
        where: term
          ? {
            OR: [
              { title: { contains: term } },
              { content: { contains: term } },
              { category: { name: { contains: term } } },
              {
                tags: {
                  some: {
                    name: {
                      contains: term,
                    }
                  }
                }
              }
            ],
          }
          : undefined,
        include: {
          category: true,
          tags: true,
        },
      }),
      (error) => ({
        type: 'DATABASE_ERROR',
        message: error instanceof Error
          ? error.message
          : 'Failed to search posts',
      } as DatabaseError),
    ).map((posts) => ({
      data: posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category.name,
        tags: post.tags.map((tag) => tag.name),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      })),
      message: term
        ? 'Posts found successfully'
        : 'All posts retrieved successfully',
    }));
  }
  async getPostById(
    id: number,
  ): Promise<Result<DatabaseData<Post>, DatabaseError>> {
    const result = ResultAsync.fromPromise(
      prisma.post.findUnique({
        where: { id },
        include: {
          category: true,
          tags: true,
        },
      }),
      (error) => ({
        type: 'DATABASE_ERROR',
        message: error instanceof Error
          ? error.message
          : 'Failed to retrieve post',
      } as DatabaseError),
    );

    const post = await result;
    if (post.isErr()) {
      return err(post.error);
    }

    if (!post.value) {
      return err({
        type: 'NOT_FOUND',
        message: 'Post not found',
      } as DatabaseError);
    }

    return ok({
      data: {
        id: post.value.id,
        title: post.value.title,
        content: post.value.content,
        category: post.value.category.name,
        tags: post.value.tags.map((tag) => tag.name),
        createdAt: post.value.createdAt.toISOString(),
        updatedAt: post.value.updatedAt.toISOString(),
      },
      message: 'Post retrieved successfully',
    });
  }
  async deletePost(
    id: number,
  ): Promise<Result<DatabaseData<Post>, DatabaseError>> {
    const result = ResultAsync.fromPromise(
      prisma.post.delete({
        where: { id },
        include: {
          category: true,
          tags: true,
        },
      }),
      (error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return {
              type: 'NOT_FOUND',
              message: 'Post not found',
            } as DatabaseError;
          }
        }

        return {
          type: 'DATABASE_ERROR',
          message: error instanceof Error
            ? error.message
            : 'Failed to delete post',
        } as DatabaseError;
      },
    );

    const deletedPost = await result;

    if (deletedPost.isErr()) {
      return err(deletedPost.error);
    }

    if (!deletedPost.value) {
      return err({
        message: 'Post not found',
        type: 'NOT_FOUND',
      } as DatabaseError);
    }
    return ok({
      data: {
        id: deletedPost.value.id,
        title: deletedPost.value.title,
        content: deletedPost.value.content,
        category: deletedPost.value.category.name,
        tags: deletedPost.value.tags.map((tag) => tag.name),
        createdAt: deletedPost.value.createdAt.toISOString(),
        updatedAt: deletedPost.value.updatedAt.toISOString(),
      },
      message: 'Post deleted successfully',
    });
  }
  updatePost(
    id: number,
    post: UpdatePost,
  ): ResultAsync<DatabaseData<Post>, DatabaseError> {
    return ResultAsync.fromPromise(
      prisma.$transaction(async (tx) => {
        let categories = await tx.category.findFirst({
          where: { name: post.category },
        });

        if (!categories) {
          categories = await tx.category.create({
            data: { name: post.category },
          });
        }

        const tags = await Promise.all(
          post.tags.map((name) =>
            tx.tag.upsert({
              where: { name },
              create: { name },
              update: {},
            })
          ),
        );

        const updatedPost = await tx.post.update({
          where: { id },
          data: {
            title: post.title,
            content: post.content,
            categoryId: categories.id,
            tags: {
              set: [],
              connect: tags.map((tag) => ({ id: tag.id })),
            },
          },
        });

        return {
          data: {
            id: updatedPost.id,
            title: updatedPost.title,
            content: updatedPost.content,
            category: categories.name,
            tags: tags.map((tag) => tag.name),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString(),
          },
          message: 'Post updated successfully',
        };
      }),
      (error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return {
              type: 'NOT_FOUND',
              message: 'Post not found',
            } as DatabaseError;
          }
        }

        return {
          type: 'DATABASE_ERROR',
          message: error instanceof Error
            ? error.message
            : 'Failed to update post',
        } as DatabaseError;
      },
    );
  }
}
