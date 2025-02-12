import express from 'express';
import accountRouter from './routes/accountRouter.js';
import postRouter from './routes/postRouter.js';
import commentRouter from './routes/commentRouter.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocs } from './swagger/swaggerDocs.js';
import dotenv from 'dotenv';
import adminRouter from './routes/adminRouter.js';

dotenv.config();

const app = express();

export default app;

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use(express.json());

app.use('/api/account', accountRouter);
app.use('/api/post', postRouter);
app.use('/api/comment', commentRouter);
app.use('/api/admin', adminRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 댓글 기능 관리자 기능 추가

// 환경변수에서 뎁스를 칼럼에 표시 일정 이상이상으로 못넘어가게
