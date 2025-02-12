import express from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createPost, uploadFileToS3 } from '../handlers/postHandler.js';
import authenticateToken from '../middleware/authenticateToken.js';
import { findPostById, updatePost, deletePost } from '../db/postDb.js';

const router = express.Router();
const prisma = new PrismaClient();

// AWS S3 설정
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * @swagger
 * /api/post:
 *   post:
 *     summary: "게시글을 생성합니다."
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               authorId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: "게시글 생성 성공"
 *       400:
 *         description: "게시글 생성 실패"
 */

/**
 * @swagger
 * /api/post:
 *   get:
 *     summary: "모든 게시글을 조회합니다."
 *     tags: [Post]
 *     responses:
 *       200:
 *         description: "게시글 목록 조회 성공"
 *       500:
 *         description: "게시글 목록 조회 실패"
 */

// 게시글 생성
router.post('/', authenticateToken, async (req, res) => {
  const { title, content, attachments } = req.body;
  const authorId = req.user.userId; // 토큰에서 추출한 사용자 ID
  try {
    const post = await createPost({ title, content, authorId, attachments });
    res.status(201).json(post);
  } catch (error) {
    console.error('게시글 생성 오류:', error);
    res.status(400).json({ error: '게시글 생성 실패', details: error.message });
  }
});

// 모든 게시글 조회
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: { attachments: true },
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error('게시글 조회 오류:', error);
    res.status(500).json({ error: '게시글 조회 실패', details: error.message });
  }
});

/**
 * @swagger
 * /api/post/{id}:
 *   get:
 *     summary: "특정 게시글을 조회합니다."
 *     tags: [Post]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "게시글 조회 성공"
 *       404:
 *         description: "게시글을 찾을 수 없습니다."
 *
 *   put:
 *     summary: "게시글을 수정합니다."
 *     tags: [Post]
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: "게시글 수정 성공"
 *       400:
 *         description: "게시글 수정 실패"
 *
 *   delete:
 *     summary: "게시글을 삭제합니다."
 *     tags: [Post]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: "게시글 삭제 성공"
 *       400:
 *         description: "게시글 삭제 실패"
 */

// 특정 게시글 조회
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await findPostById(id);
    if (post) {
      if (post.authorId !== req.user.userId) {
        return res.status(403).json({ error: '권한이 없습니다.' });
      }
      res.status(200).json(post);
    } else {
      res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('게시글 조회 오류:', error);
    res.status(500).json({ error: '게시글 조회 실패', details: error.message });
  }
});

// 게시글 업데이트
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const post = await findPostById(id);
    if (!post || post.authorId !== req.user.userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    const updatedPost = await updatePost(id, { title, content });
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('게시글 업데이트 오류:', error);
    res.status(400).json({ error: '게시글 업데이트 실패', details: error.message });
  }
});

// 게시글 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const post = await findPostById(id);
    if (!post || post.authorId !== req.user.userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    await deletePost(id);
    res.status(204).send();
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    res.status(400).json({ error: '게시글 삭제 실패', details: error.message });
  }
});

export default router;
