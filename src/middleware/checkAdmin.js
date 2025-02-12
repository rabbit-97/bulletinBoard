import { findUserById } from '../db/userDb.js';

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

export default checkAdmin;
