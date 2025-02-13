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

/**
 * @swagger
 * /api/board/{id}:
 *   get:
 *     summary: "특정 게시판을 조회합니다."
 *     tags: [Board]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "게시판 조회 성공"
 *       404:
 *         description: "게시판을 찾을 수 없습니다."
 */

// 게시판 조회
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const board = await prisma.board.findUnique({
      where: { id: parseInt(id) },
    });

    if (!board) {
      return res.status(404).json({ error: '게시판을 찾을 수 없습니다.' });
    }

    res.status(200).json(board);
  } catch (error) {
    console.error('게시판 조회 오류:', error);
    res.status(500).json({ error: '게시판 조회 실패', details: error.message });
  }
});

/**
 * @swagger
 * /api/board/{id}:
 *   put:
 *     summary: "게시판 정보를 수정합니다."
 *     tags: [Board]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *       200:
 *         description: "게시판 수정 성공"
 *       400:
 *         description: "게시판 수정 실패"
 */

// 게시판 수정
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: '게시판 이름이 필요합니다.' });
  }

  try {
    const updatedBoard = await prisma.board.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.status(200).json(updatedBoard);
  } catch (error) {
    console.error('게시판 수정 오류:', error);
    res.status(400).json({ error: '게시판 수정 실패', details: error.message });
  }
});

/**
 * @swagger
 * /api/board/{id}:
 *   delete:
 *     summary: "게시판을 삭제합니다."
 *     tags: [Board]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: "게시판 삭제 성공"
 *       400:
 *         description: "게시판 삭제 실패"
 */

// 게시판 삭제
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.board.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('게시판 삭제 오류:', error);
    res.status(400).json({ error: '게시판 삭제 실패', details: error.message });
  }
});

export default router;
