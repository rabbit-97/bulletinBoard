export const swaggerDocs = {
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
  paths: {
    '/api/post': {
      post: {
        summary: '게시글 생성',
        tags: ['Post'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  authorId: { type: 'integer' },
                  attachments: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: '게시글 생성 성공' },
          400: { description: '게시글 생성 실패' },
        },
      },
      get: {
        summary: '모든 게시글 조회',
        tags: ['Post'],
        responses: {
          200: { description: '게시글 목록' },
          500: { description: '게시글 조회 실패' },
        },
      },
    },
    '/api/post/{id}': {
      get: {
        summary: '특정 게시글 조회',
        tags: ['Post'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: '게시글 정보' },
          404: { description: '게시글을 찾을 수 없음' },
        },
      },
      put: {
        summary: '게시글 업데이트',
        tags: ['Post'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: '게시글 업데이트 성공' },
          400: { description: '게시글 업데이트 실패' },
        },
      },
      delete: {
        summary: '게시글 삭제',
        tags: ['Post'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          204: { description: '게시글 삭제 성공' },
          400: { description: '게시글 삭제 실패' },
        },
      },
    },
    '/api/account': {
      post: {
        summary: '회원가입',
        tags: ['Account'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  nickname: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: '회원가입 성공' },
          400: { description: '입력 정보 오류' },
        },
      },
    },
    '/api/account/login': {
      post: {
        summary: '로그인',
        tags: ['Account'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: '로그인 성공' },
          401: { description: '로그인 실패' },
        },
      },
    },
    '/api/account/{id}': {
      get: {
        summary: '사용자 정보 조회',
        tags: ['Account'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: '사용자 정보' },
          404: { description: '사용자를 찾을 수 없음' },
        },
      },
      put: {
        summary: '사용자 정보 업데이트',
        tags: ['Account'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  nickname: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: '사용자 정보 업데이트 성공' },
          400: { description: '입력 정보 오류' },
        },
      },
      delete: {
        summary: '사용자 삭제',
        tags: ['Account'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          204: { description: '사용자 삭제 성공' },
          400: { description: '사용자 삭제 실패' },
        },
      },
    },
  },
};
