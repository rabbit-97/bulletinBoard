import express from 'express';
import { PrismaClient } from '@prisma/client';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/comment:
 *   post:
 *     summary: "댓글을 생성합니다."
 *     tags: [Comment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               postId:
 *                 type: integer
 *               parentId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: "댓글 생성 성공"
 *       400:
 *         description: "댓글 생성 실패"
 */

/**
 * @swagger
 * /api/comment/{postId}:
 *   get:
 *     summary: "댓글을 조회합니다."
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "댓글 조회 성공"
 *       500:
 *         description: "댓글 조회 실패"
 */

/**
 * @swagger
 * /api/comment/{id}:
 *   put:
 *     summary: "댓글을 수정합니다."
 *     tags: [Comment]
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
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: "댓글 수정 성공"
 *       400:
 *         description: "댓글 수정 실패"
 *
 *   delete:
 *     summary: "댓글을 삭제합니다."
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: "댓글 삭제 성공"
 *       400:
 *         description: "댓글 삭제 실패"
 */

// 댓글 생성
router.post('/', authenticateToken, async (req, res) => {
  const { content, postId, parentId } = req.body;
  const authorId = req.user.userId;
  try {
    // 트랜잭션 시작
    await prisma.$transaction(async (prisma) => {
      // parentId 유효성 검사
      if (parentId) {
        const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
        if (!parentComment) {
          return res.status(400).json({ error: '유효하지 않은 parentId입니다.' });
        }
      }

      // 깊이 계산
      const depth = parentId
        ? (await prisma.comment.findUnique({ where: { id: parentId } })).depth + 1
        : 0;
      if (depth > parseInt(process.env.MAX_COMMENT_DEPTH)) {
        return res.status(400).json({ error: '댓글 깊이 제한을 초과했습니다.' });
      }

      // 댓글 생성
      const comment = await prisma.comment.create({
        data: {
          content,
          authorId,
          postId,
          parentId,
          depth,
        },
      });
      res.status(201).json(comment);
    });
  } catch (error) {
    if (error.code === 'P2003') {
      res.status(400).json({ error: '외래 키 제약 조건 위반: parentId가 유효하지 않습니다.' });
    } else {
      console.error('댓글 생성 오류:', error);
      res.status(500).json({ error: '댓글 생성 실패', details: error.message });
    }
  }
});

// 댓글 조회
router.get('/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(postId) },
      include: { children: true },
    });
    res.status(200).json(comments);
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    res.status(500).json({ error: '댓글 조회 실패', details: error.message });
  }
});

// 댓글 수정
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } });
    if (!comment || comment.authorId !== req.user.userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { content },
    });
    res.status(200).json(updatedComment);
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    res.status(400).json({ error: '댓글 수정 실패', details: error.message });
  }
});

// 댓글 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } });
    if (!comment || comment.authorId !== req.user.userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    await prisma.comment.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    res.status(400).json({ error: '댓글 삭제 실패', details: error.message });
  }
});

export default router;
