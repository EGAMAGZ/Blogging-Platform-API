import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
import postsRoutes from './routes/posts.ts';
import '@std/dotenv/load';
import { errorHandler } from '@/middlewares/error-handler.ts';

const app = new Hono().basePath('/api');

app.use(logger());
app.use(cors());
app.use(compress());

app.use(errorHandler);

app.route('/posts', postsRoutes);

Deno.serve(app.fetch);
