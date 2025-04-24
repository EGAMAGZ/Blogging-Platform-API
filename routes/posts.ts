import { Hono } from 'hono';
import { validateSchema } from '@/util/validator.ts';
import { CreatePostSchema, Post, UpdatePostSchema } from '../schemas/post.ts';
import { PostsRepository } from '@/repository/posts.ts';
import { ApiResponse } from '@/schemas/api-response.ts';
import { z } from 'zod';

const app = new Hono();

app.get(
  '/',
  validateSchema(
    'query',
    z.object({
      term: z.string().optional(),
    }),
  ),
  async (c) => {
    const { term } = c.req.valid('query');
    const repository = new PostsRepository();
    const posts = await repository.getAllPosts(term);

    if (posts.isErr()) {
      const apiResponse: ApiResponse = {
        error: {
          code: 'SERVER_ERROR',
          message: posts.error.message,
        },
        success: false,
      };

      return c.json(apiResponse);
    }

    const { data, message } = posts.value;

    const apiResponse: ApiResponse<Post[]> = {
      success: true,
      data,
      message,
    };

    return c.json(apiResponse);
  },
);
app.post(
  '/',
  validateSchema('json', CreatePostSchema),
  async (c) => {
    const post = c.req.valid('json');
    const repository = new PostsRepository();
    const createdPost = await repository.createPost(post);

    if (createdPost.isErr()) {
      const apiResponse: ApiResponse = {
        error: {
          code: 'SERVER_ERROR',
          message: createdPost.error.message,
        },
        success: false,
      };

      return c.json(apiResponse, 500);
    }

    const { data, message } = createdPost.value;
    const apiResponse: ApiResponse<Post> = {
      message,
      data,
      success: true,
    };

    return c.json(apiResponse, 201);
  },
);
app.put(
  '/:id',
  validateSchema(
    'param',
    z.object({
      id: z.coerce.number().positive().safe(),
    }),
  ),
  validateSchema('json', UpdatePostSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const post = c.req.valid('json');
    const repository = new PostsRepository();
    const updatedPost = await repository.updatePost(id, post);

    if (updatedPost.isErr()) {
      if (updatedPost.error.type === 'NOT_FOUND') {
        const apiResponse: ApiResponse = {
          error: {
            code: 'NOT_FOUND',
            message: updatedPost.error.message,
          },
          success: false,
        };

        return c.json(apiResponse, 404);
      }

      const apiResponse: ApiResponse = {
        error: {
          code: 'SERVER_ERROR',
          message: updatedPost.error.message,
        },
        success: false,
      };

      return c.json(apiResponse, 500);
    }

    const { data, message } = updatedPost.value;
    const apiResponse: ApiResponse<Post> = {
      message,
      data,
      success: true,
    };

    return c.json(apiResponse, 200);
  },
);
app.get(
  '/:id',
  validateSchema(
    'param',
    z.object({
      id: z.coerce.number().positive().safe(),
    }),
  ),
  async (c) => {
    const { id } = c.req.valid('param');
    const repository = new PostsRepository();
    const post = await repository.getPostById(id);

    if (post.isErr()) {
      if (post.error.type === 'NOT_FOUND') {
        const apiResponse: ApiResponse = {
          error: {
            code: 'NOT_FOUND',
            message: post.error.message,
          },
          success: false,
        };

        return c.json(apiResponse, 404);
      }
      const apiResponse: ApiResponse = {
        error: {
          code: 'SERVER_ERROR',
          message: post.error.message,
        },
        success: false,
      };

      return c.json(apiResponse, 500);
    }

    const { data, message } = post.value;
    const apiResponse: ApiResponse<Post> = {
      message,
      data,
      success: true,
    };

    return c.json(apiResponse);
  },
);

app.delete(
  '/:id',
  validateSchema(
    'param',
    z.object({
      id: z.coerce.number().positive().safe(),
    }),
  ),
  async (c) => {
    const { id } = c.req.valid('param');
    const repository = new PostsRepository();
    const deletedPost = await repository.deletePost(id);

    if (deletedPost.isErr()) {
      if (deletedPost.error.type === 'NOT_FOUND') {
        const apiResponse: ApiResponse = {
          error: {
            code: 'NOT_FOUND',
            message: deletedPost.error.message,
          },
          success: false,
        };

        return c.json(apiResponse, 404);
      }
      const apiResponse: ApiResponse = {
        error: {
          code: 'SERVER_ERROR',
          message: deletedPost.error.message,
        },
        success: false,
      };

      return c.json(apiResponse, 500);
    }

    return new Response(null, { status: 204 });
  },
);

export default app;
