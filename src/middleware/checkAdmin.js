import { findUserById } from '../db/userDb.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAdmin = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }
    next();
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error);
    res.status(500).json({ error: '서버 오류', details: error.message });
  }
};

export function checkAdminPermission(req, res, next) {
  const { boardId } = req.body;
  const userRole = req.user.role; // 사용자 역할 가져오기

  // 환경 변수에서 관리자 권한이 필요한 boardId 목록 가져오기
  const adminBoards = process.env.ADMIN_BOARDS.split(',').map(Number);

  // boardId가 관리자 권한이 필요한 경우, 사용자 역할 확인
  if (adminBoards.includes(boardId) && userRole !== 'admin') {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  next();
}

export default checkAdmin;