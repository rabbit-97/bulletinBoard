import express from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client } from '@aws-sdk/client-s3';
import { createPost } from '../handlers/postHandler.js';
import authenticateToken from '../middleware/authenticateToken.js';
import { deletePost, findPostById, updatePost } from '../db/postDb.js';
import { checkAdminPermission } from '../middleware/checkAdmin.js';
import Redis from 'ioredis';

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

const redis = new Redis();

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
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     originalname:
 *                       type: string
 *                     buffer:
 *                       type: string
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
// board 테이블 생성 - boardId는 게시판 아이디를 의미 하며 boardId 가 만약에 1이 공지사항 같은 권한이 걸려있는 게시판이면 룰 타입이 유저인 계정은 이 게시판이 글을 못쓴다.
// 개선사항 - boardId를 환경 변수로 지정해서 관리자만 작성 하게 할 수 있지 않을까?
router.post('/', authenticateToken, checkAdminPermission, async (req, res) => {
  const { title, content, attachments, boardId } = req.body;
  const authorId = req.user.userId;

  if (!boardId) {
    return res.status(400).json({ error: 'boardId가 필요합니다.' });
  }

  try {
    const post = await createPost({ title, content, authorId, attachments, boardId });
    res.status(201).json(post);
  } catch (error) {
    console.error('게시글 생성 오류:', error);
    res.status(400).json({ error: '게시글 생성 실패', details: error.message });
  }
});

// 모든 게시글 조회
router.get('/', async (req, res) => {
  const { boardId } = req.query; // 쿼리 파라미터로 boardId 받기
  try {
    const posts = await prisma.post.findMany({
      where: boardId ? { boardId: parseInt(boardId) } : {}, // boardId가 있으면 필터링
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
router.put('/:id', authenticateToken, checkAdminPermission, async (req, res) => {
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
router.delete('/:id', authenticateToken, checkAdminPermission, async (req, res) => {
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

// 레디스를 로컬에서 사용하면 이렇게 적용하면 사용 가능한데
// 문제는 배포할때는 6379 포트를 열고 사용해야한다.
// 추가로 보완 설정 같은것도 지정을 해야해서 좀 더 찾아보기
// 검색 엔드포인트 추가
router.get('/search', async (req, res) => {
  const { title, authorId } = req.query;
  const searchKey = `search:${title || ''}:${authorId || ''}`;

  try {
    // Redis에서 캐시된 결과 확인
    const cachedResults = await redis.get(searchKey);
    if (cachedResults) {
      // 검색 횟수 기록
      await redis.zincrby('searchCounts', 1, searchKey);
      return res.status(200).json(JSON.parse(cachedResults));
    }

    // Redis에서 검색
    const keys = await redis.keys(`post:*`);
    const results = [];
    for (const key of keys) {
      const post = JSON.parse(await redis.get(key));
      if (
        (title && post.title.includes(title)) ||
        (authorId && post.authorId === parseInt(authorId))
      ) {
        results.push(post);
      }
    }

    // 검색 결과 캐싱
    await redis.set(searchKey, JSON.stringify(results), 'EX', 3600); // 1시간 캐시

    // 검색 횟수 기록
    await redis.zincrby('searchCounts', 1, searchKey);

    res.status(200).json(results);
  } catch (error) {
    console.error('검색 오류:', error);
    res.status(500).json({ error: '검색 실패', details: error.message });
  }
});

// 인기 검색어 반환 엔드포인트 추가
router.get('/search/top', async (req, res) => {
  try {
    const topSearches = await redis.zrevrange('searchCounts', 0, 9, 'WITHSCORES');
    const formattedResults = [];
    for (let i = 0; i < topSearches.length; i += 2) {
      formattedResults.push({ query: topSearches[i], count: parseInt(topSearches[i + 1]) });
    }
    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('인기 검색어 조회 오류:', error);
    res.status(500).json({ error: '인기 검색어 조회 실패', details: error.message });
  }
});

export default router;
