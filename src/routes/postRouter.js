import express from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createPost, uploadFileToS3 } from '../handlers/postHandler.js';
import authenticateToken from '../middleware/authenticateToken.js';

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

// 특정 게시글 조회
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: { attachments: true },
    });
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
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post || post.authorId !== req.user.userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    const updatedPost = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { title, content },
    });
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
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post || post.authorId !== req.user.userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    await prisma.post.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    res.status(400).json({ error: '게시글 삭제 실패', details: error.message });
  }
});

export default router;
