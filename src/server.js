import express from 'express';
import accountRouter from './routes/accountRouter.js';
import postRouter from './routes/postRouter.js';

const app = express();

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use(express.json());

app.use('/api/account', accountRouter);
app.use('/api/board', postRouter);
