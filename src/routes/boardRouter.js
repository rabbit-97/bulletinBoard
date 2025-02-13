import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/board:
 *   post:
 *     summary: "새로운 게시판을 생성합니다."
 *     tags: [Board]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: "게시판 생성 성공"
 *       400:
 *         description: "게시판 생성 실패"
 */

// 게시판 생성
router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: '게시판 이름이 필요합니다.' });
  }

  try {
    const newBoard = await prisma.board.create({
      data: { name },
    });
    res.status(201).json(newBoard);
  } catch (error) {
    console.error('게시판 생성 오류:', error);
    res.status(400).json({ error: '게시판 생성 실패', details: error.message });
  }
});

export default router;
