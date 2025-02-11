import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 회원가입 라우트
router.post('/signup', async (req, res) => {
  const { email, password, nickname } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        password,
        nickname,
      },
    });
    res.status(201).json({ message: '회원가입 성공', user: newUser });
  } catch (error) {
    res.status(400).json({ error: '회원가입 실패', details: error.message });
  }
});

// 로그인 라우트
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.password === password) {
      res.status(200).json({ message: '로그인 성공', user });
    } else {
      res
        .status(401)
        .json({ error: '로그인 실패', details: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }
  } catch (error) {
    res.status(500).json({ error: '서버 오류', details: error.message });
  }
});

export default router;
