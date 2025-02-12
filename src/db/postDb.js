import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findPostById = async (id) => {
  return prisma.post.findUnique({ where: { id: parseInt(id) } });
};

export const updatePost = async (id, data) => {
  return prisma.post.update({ where: { id: parseInt(id) }, data });
};

export const deletePost = async (id) => {
  return prisma.post.delete({ where: { id: parseInt(id) } });
};
