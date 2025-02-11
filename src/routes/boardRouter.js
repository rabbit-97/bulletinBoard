import express from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

// 파일 업로드 함수
async function uploadFileToS3(file) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${Date.now()}_${file.originalname}`,
    Body: file.buffer,
  };

  try {
    const command = new PutObjectCommand(params);
    const data = await s3.send(command);
    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
  } catch (error) {
    console.error('S3 업로드 오류:', error);
    throw new Error('파일 업로드 실패');
  }
}

// 게시글 생성
router.post('/', async (req, res) => {
  const { title, content, authorId, attachments } = req.body;
  if (attachments.length > 3) {
    return res.status(400).json({ error: '첨부파일은 최대 3개까지 첨부할 수 있습니다.' });
  }
  try {
    const attachmentUrls = await Promise.all(attachments.map(uploadFileToS3));
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId,
        attachments: {
          create: attachmentUrls.map((url) => ({ url })),
        },
      },
    });
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
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { title, content },
    });
    res.status(200).json(post);
  } catch (error) {
    console.error('게시글 업데이트 오류:', error);
    res.status(400).json({ error: '게시글 업데이트 실패', details: error.message });
  }
});

// 게시글 삭제
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
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
