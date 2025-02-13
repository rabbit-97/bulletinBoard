import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createBoards() {
  try {
    const board1 = await prisma.board.create({
      data: {
        id: 1, // boardId 1번
        name: '공지사항',
      },
    });

    const board2 = await prisma.board.create({
      data: {
        id: 2, // boardId 2번
        name: '게시판',
      },
    });

    console.log('Boards created:', board1, board2);
  } catch (error) {
    console.error('Error creating boards:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBoards();
