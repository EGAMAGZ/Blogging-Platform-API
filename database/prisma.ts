import '@std/dotenv/load';
import { PrismaClient } from '@/generated/prisma/client.ts';

const prisma = new PrismaClient();

export default prisma;
