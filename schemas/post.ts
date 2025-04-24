import { z } from 'zod';

export const PostSchema = z.object({
  id: z.coerce.number(),
  title: z.string().nonempty(),
  content: z.string().nonempty(),
  category: z.string().nonempty(),
  tags: z.array(z.string().nonempty()).min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Post = z.infer<typeof PostSchema>;

export const CreatePostSchema = PostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreatePost = z.infer<typeof CreatePostSchema>;

export const UpdatePostSchema = PostSchema.omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});

export type UpdatePost = z.infer<typeof UpdatePostSchema>;
