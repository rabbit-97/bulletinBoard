import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { signupValidation, updateValidation } from '../utils/validation.js';
import { generateToken, hashPassword } from '../utils/auth.js';
import authenticateToken from '../middleware/authenticateToken.js';
import { generateRefreshToken, verifyToken } from '../utils/tokenUtils.js';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import { createUser, findUserByEmail, findUserById, updateUser, deleteUser } from '../db/userDb.js';

const router = express.Router();
const prisma = new PrismaClient();

// 회원가입 라우트
router.post('/', signupValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password, nickname } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    const newUser = await createUser({
      email,
      password: hashedPassword,
      nickname,
    });
    res.status(201).json({ message: '회원가입 성공', user: newUser });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(400).json({ error: '회원가입 실패', details: '입력 정보를 확인하세요.' });
  }
});

// 로그인 라우트
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const aToken = generateToken(user.id); // access token
      const rToken = await generateRefreshToken(user.id); // refresh token

      res.cookie('AccessToken', aToken, {
        httpOnly: true,
        maxAge: process.env.A_TOKEN_EXPIRES * 1000,
      });
      res.cookie('RefreshToken', rToken, {
        httpOnly: true,
        maxAge: process.env.R_TOKEN_EXPIRES * 1000,
      });

      // 리프레시 토큰을 데이터베이스에 저장
      await updateUser(user.id, { refreshToken: rToken });

      res.status(200).json({ message: '로그인 성공' });
    } else {
      res
        .status(401)
        .json({ error: '로그인 실패', details: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '서버 오류', details: '잠시 후 다시 시도하세요.' });
  }
});

// 사용자 정보 조회
router.get('/:id', async (req, res) => {
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
router.put('/:id', authenticateToken, updateValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { id } = req.params;
  const { email, password, nickname } = req.body;
  try {
    if (req.user.userId !== parseInt(id)) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    const hashedPassword = await hashPassword(password);
    const user = await updateUser(id, { email, password: hashedPassword, nickname });
    res.status(200).json(user);
  } catch (error) {
    console.error('사용자 업데이트 오류:', error);
    res.status(400).json({ error: '사용자 업데이트 실패', details: error.message });
  }
});

// 사용자 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.userId !== parseInt(id)) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    await deleteUser(id);
    res.status(204).send();
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(400).json({ error: '사용자 삭제 실패', details: error.message });
  }
});

// 새로운 액세스 토큰 발급
router.post('/refresh-token', async (req, res) => {
  const token = req.cookies.RefreshToken;
  if (!token) {
    return res.status(401).json({ error: '리프레시 토큰이 필요합니다.' });
  }

  try {
    const payload = verifyToken(token);
    const userId = payload.userId;
    const user = await findUserById(userId);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ error: '유효하지 않은 리프레시 토큰입니다.' });
    }

    const aToken = generateToken(userId);
    res.cookie('AccessToken', aToken, {
      httpOnly: true,
      maxAge: parseInt(process.env.A_TOKEN_EXPIRES) * 1000,
    });

    const exp = moment(payload.exp * 1000);
    const nowAdd1Day = moment().add(1, 'days');

    if (exp < nowAdd1Day) {
      const rToken = await generateRefreshToken(userId);
      await updateUser(userId, { refreshToken: rToken });
      res.cookie('RefreshToken', rToken, {
        httpOnly: true,
        maxAge: parseInt(process.env.R_TOKEN_EXPIRES) * 1000,
      });
    }

    res.status(200).json({ message: '새로운 액세스 토큰이 발급되었습니다.' });
  } catch (err) {
    res.status(403).json({ error: '유효하지 않은 리프레시 토큰입니다.' });
  }
});

// 로그아웃
router.post('/logout', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    res.clearCookie('AccessToken');
    res.clearCookie('RefreshToken');
    res.status(200).json({ message: '로그아웃 성공' });
  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({ error: '로그아웃 실패', details: error.message });
  }
});

export default router;
