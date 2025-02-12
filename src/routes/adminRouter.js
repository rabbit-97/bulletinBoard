import express from 'express';
import { deleteUser, findUserById, updateUser } from '../db/userDb.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';
import { deletePost, updatePost } from '../db/postDb.js';
import { createAdminUser } from '../db/userDb.js';
import { hashPassword, generateToken, generateRefreshToken } from '../utils/auth.js';

const router = express.Router();

// 관리자 회원가입
router.post('/signup', async (req, res) => {
  const { email, password, nickname } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    const newAdmin = await createAdminUser({ email, password: hashedPassword, nickname });
    const aToken = generateToken(newAdmin.id);
    const rToken = await generateRefreshToken(newAdmin.id);
    res.cookie('AccessToken', aToken, {
      httpOnly: true,
      maxAge: process.env.A_TOKEN_EXPIRES * 1000,
    });
    res.cookie('RefreshToken', rToken, {
      httpOnly: true,
      maxAge: process.env.R_TOKEN_EXPIRES * 1000,
    });
    res.status(201).json({ message: '관리자 회원가입 성공', user: newAdmin });
  } catch (error) {
    console.error('관리자 회원가입 오류:', error);
    res.status(400).json({ error: '관리자 회원가입 실패', details: error.message });
  }
});

/////////////////////////////////////////// 계정 관련 어드민 권한 api/admin/account //////////////////////////////////////////////////////
// 사용자 정보 조회
router.get('/account/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await findUserById(id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({ error: '사용자 조회 실패', details: error.message });
  }
});

// 사용자 정보 업데이트
router.put('/account/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { email, password, nickname, role } = req.body;
  try {
    const user = await updateUser(id, { email, password, nickname, role });
    res.status(200).json(user);
  } catch (error) {
    console.error('사용자 업데이트 오류:', error);
    res.status(400).json({ error: '사용자 업데이트 실패', details: error.message });
  }
});

// 사용자 삭제
router.delete('/account/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await deleteUser(id);
    res.status(204).send();
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(400).json({ error: '사용자 삭제 실패', details: error.message });
  }
});

/////////////////////////////////////////// 게시글 관련 권한 api/admin/post //////////////////////////////////////////////////////
// 게시글 정보 업데이트
router.put('/post/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const post = await updatePost(id, { title, content });
    res.status(200).json(post);
  } catch (error) {
    console.error('게시글 업데이트 오류:', error);
    res.status(400).json({ error: '게시글 업데이트 실패', details: error.message });
  }
});

// 게시글 삭제
router.delete('/post/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await deletePost(id);
    res.status(204).send();
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    res.status(400).json({ error: '게시글 삭제 실패', details: error.message });
  }
});

export default router;
