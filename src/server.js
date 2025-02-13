import express from 'express';
import accountRouter from './routes/accountRouter.js';
import postRouter from './routes/postRouter.js';
import commentRouter from './routes/commentRouter.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocs } from './swagger/swaggerDocs.js';
import dotenv from 'dotenv';
import adminRouter from './routes/adminRouter.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import chatSocketHandler from './sockets/chat.js';

dotenv.config();

const app = express();

const server = createServer(app);
const io = new Server(server);

export default app;

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use(express.json());

app.use('/api/account', accountRouter);
app.use('/api/post', postRouter);
app.use('/api/comment', commentRouter);
app.use('/api/admin', adminRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(express.static('public'));

// 게시판 메뉴, 웹소켓 - 실시간 채팅 기능

// 소켓 이벤트 처리
io.on('connection', (socket) => {
  chatSocketHandler(io, socket);
});
