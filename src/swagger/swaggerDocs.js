import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bulletin Board API',
      version: '1.0.0',
      description: 'API documentation for the Bulletin Board project',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // 주석이 포함된 파일 경로
};

export const swaggerDocs = swaggerJSDoc(options);
