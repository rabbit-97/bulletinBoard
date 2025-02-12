import express from 'express';
import { PrismaClient } from '@prisma/client';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();
const prisma = new PrismaClient();

// 댓글 생성
router.post('/', authenticateToken, async (req, res) => {
  const { content, postId, parentId } = req.body;
  const authorId = req.user.userId;
  try {
    // 1. parentComment 변수 설정:
    //   parentId가 존재하는 경우, 즉 대댓글인 경우, prisma.comment.findUnique를 사용하여 parentId에 해당하는 부모 댓글을 데이터베이스에서 찾습니다.
    //   parentId가 없는 경우, 즉 일반 댓글인 경우, parentComment는 null로 설정됩니다.
    //   depth 계산:
    //   parentComment가 존재하면, 즉 대댓글인 경우, 부모 댓글의 깊이(depth)에 1을 더하여 현재 댓글의 깊이를 계산합니다.
    //   parentComment가 null이면, 즉 일반 댓글인 경우, 깊이는 0으로 설정됩니다.
    // 3. 깊이 제한 검사:
    //   계산된 depth가 환경 변수 MAX_COMMENT_DEPTH로 설정된 최대 깊이를 초과하는지 확인합니다.
    //   초과할 경우, 400 Bad Request 상태 코드와 함께 "댓글 깊이 제한을 초과했습니다."라는 오류 메시지를 반환합니다.

    // parentId가 존재하는 경우에는 데이터베이스에서 부모 댓글을 찾아 대댓글로 입력
    // null 값인경우 최상위 댓글로 입력
    const parentComment = parentId
      ? await prisma.comment.findUnique({ where: { id: parentId } })
      : null;
    // 깊이가 0일 경우 최상위 댓글로 판단
    // 깊이가 1 이상일 경우 대댓글로 판단
    // 깊이의 최대치를 환경 변수로 정의하여 실시간 수정 가능
    const depth = parentComment ? (parentComment.depth || 0) + 1 : 0;
    if (depth > parseInt(process.env.MAX_COMMENT_DEPTH)) {
      return res.status(400).json({ error: '댓글 깊이 제한을 초과했습니다.' });
    }
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId,
        postId,
        parentId,
      },
    });
    res.status(201).json(comment);
  } catch (error) {
    console.error('댓글 생성 오류:', error);
    res.status(400).json({ error: '댓글 생성 실패', details: error.message });
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
