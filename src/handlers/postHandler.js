import { PrismaClient } from '@prisma/client';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function createPost({ title, content, authorId, attachments, boardId }) {
  attachments = attachments || [];
  if (!Array.isArray(attachments)) {
    throw new Error('첨부파일은 배열이어야 합니다.');
  }

  if (attachments.length > 3) {
    throw new Error('첨부파일은 최대 3개까지 첨부할 수 있습니다.');
  }

  const attachmentUrls = await Promise.all(
    attachments.map((file) => uploadFileToS3(file, authorId)),
  );
  return prisma.post.create({
    data: {
      title,
      content,
      authorId,
      boardId,
      attachments: {
        create: attachmentUrls.map((url) => ({ url })),
      },
    },
  });
}

export async function uploadFileToS3(file, authorId) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${authorId}_${Date.now()}_${file.originalname}`, // 사용자 ID와 타임스탬프를 키에 포함
    Body: file.buffer,
  };

  try {
    const data = await s3.send(new PutObjectCommand(params));
    console.log('파일 업로드 성공:', data);
    // S3에 저장된 파일의 URL 생성
    const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    return fileUrl;
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    throw error;
  }
}
