import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateNickname = () => {
  const adjectives = ['빠른', '느린', '행복한', '슬픈', '용감한'];
  const animals = ['사자', '호랑이', '토끼', '거북이', '독수리'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective} ${animal}`;
};

export default function chatSocketHandler(io, socket) {
  console.log('A user connected:', socket.id);

  const uniqueId = `${socket.id}-${Math.floor(Math.random() * 10000)}`;
  const nickname = generateNickname();
  socket.nickname = nickname;

  socket.on('JOIN_ROOM', async (room) => {
    console.log(`${nickname}가 방 ${room}에 입장하였습니다.`);
    socket.join(room);

    const previousMessages = await prisma.message.findMany({
      where: { room },
      orderBy: { timestamp: 'asc' },
    });

    previousMessages.forEach((msg) => {
      socket.emit('SEND_MESSAGE', msg);
    });

    const welcomeMessage = {
      id: uniqueId,
      sender: '알림 봇',
      content: `새로운 유저 ${nickname} 가 입장했습니다.`,
      timestamp: new Date(),
    };

    await prisma.message.create({
      data: {
        room,
        sender: '알림 봇',
        content: welcomeMessage.content,
        timestamp: welcomeMessage.timestamp,
      },
    });

    io.to(room).emit('SEND_MESSAGE', welcomeMessage);
  });

  socket.on('SEND_MESSAGE', async (msgData) => {
    let parsedData;
    try {
      parsedData = typeof msgData === 'string' ? JSON.parse(msgData) : msgData;
    } catch (error) {
      console.error('메시지 파싱 오류:', error);
      return;
    }

    const { room, message } = parsedData;
    const newMessage = {
      id: uniqueId,
      sender: nickname,
      content: message,
      timestamp: new Date(),
    };

    await prisma.message.create({
      data: {
        room,
        sender: nickname,
        content: newMessage.content,
        timestamp: newMessage.timestamp,
      },
    });

    io.to(room).emit('SEND_MESSAGE', newMessage);
  });

  socket.on('LEAVE_ROOM', async (room) => {
    console.log(`${nickname}가 방 ${room}을 떠났습니다.`);

    const leaveMessage = {
      id: uniqueId,
      sender: '알림 봇',
      content: `${nickname} 가 방을 떠났습니다.`,
      timestamp: new Date(),
    };

    io.to(room).emit('SEND_MESSAGE', leaveMessage);

    await prisma.message.create({
      data: {
        room,
        sender: '알림 봇',
        content: leaveMessage.content,
        timestamp: leaveMessage.timestamp,
      },
    });

    socket.leave(room);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
}
