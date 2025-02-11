import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function createPost({ title, content, authorId, attachments }) {
  if (attachments.length > 3) {
    throw new Error('첨부파일은 최대 3개까지 첨부할 수 있습니다.');
  }

  const attachmentUrls = await Promise.all(attachments.map(uploadFileToS3));
  return prisma.post.create({
    data: {
      title,
      content,
      authorId,
      attachments: {
        create: attachmentUrls.map((url) => ({ url })),
      },
    },
  });
}

export async function uploadFileToS3(file) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${Date.now()}_${file.originalname}`,
    Body: file.buffer,
  };

  try {
    const command = new PutObjectCommand(params);
    const data = await s3.send(command);
    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
  } catch (error) {
    console.error('S3 업로드 오류:', error);
    throw new Error('파일 업로드 실패');
  }
}
