import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// 회원가입 라우트
router.post(
  '/',
  [
    body('email').isEmail().withMessage('유효한 이메일 주소를 입력하세요.'),
    body('password')
      .isLength({ min: 6 })
      .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
      .withMessage('비밀번호는 최소 6자 이상이며 문자와 숫자를 포함해야 합니다.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, nickname } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname,
        },
      });
      res.status(201).json({ message: '회원가입 성공', user: newUser });
    } catch (error) {
      console.error('회원가입 오류:', error);
      res.status(400).json({ error: '회원가입 실패', details: '입력 정보를 확인하세요.' });
    }
  },
);

// 로그인 라우트
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
      res.status(200).json({ message: '로그인 성공', token });
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
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
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
router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('유효한 이메일 주소를 입력하세요.'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
      .withMessage('비밀번호는 최소 6자 이상이며 문자와 숫자를 포함해야 합니다.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { email, password, nickname } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { email, password: hashedPassword, nickname },
      });
      res.status(200).json(user);
    } catch (error) {
      console.error('사용자 업데이트 오류:', error);
      res.status(400).json({ error: '사용자 업데이트 실패', details: error.message });
    }
  },
);

// 사용자 삭제
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(400).json({ error: '사용자 삭제 실패', details: error.message });
  }
});

export default router;
