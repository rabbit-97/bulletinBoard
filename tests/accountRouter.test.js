import request from 'supertest';
import app from '../src/server.js';

describe('Account Router', () => {
  // it('should sign up a new user', async () => {
  //   const response = await request(app)
  //     .post('/api/account')
  //     .send({
  //       email: 'unique@example.com',
  //       password: 'Password123',
  //       nickname: `testuser_${Date.now()}`,
  //     });
  //   expect(response.statusCode).toBe(201);
  //   expect(response.body).toHaveProperty('message', '회원가입 성공');
  // });

  it('should not sign up with invalid email', async () => {
    const response = await request(app).post('/api/account').send({
      email: 'invalid-email',
      password: 'Password123',
      nickname: 'testuser',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.errors[0]).toHaveProperty('msg', '유효한 이메일 주소를 입력하세요.');
  });

  it('should log in a user', async () => {
    const response = await request(app).post('/api/account/login').send({
      email: 'unique@example.com',
      password: 'Password123',
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', '로그인 성공');
  });

  it('should create a post', async () => {
    const loginResponse = await request(app).post('/api/account/login').send({
      email: 'unique@example.com',
      password: 'Password123',
    });
    const cookies = loginResponse.headers['set-cookie'];

    const postResponse = await request(app).post('/api/post').set('Cookie', cookies).send({
      title: 'Test Post',
      content: 'This is a test post.',
    });
    expect(postResponse.statusCode).toBe(201);
    expect(postResponse.body).toHaveProperty('title', 'Test Post');
  });

  it('should log out a user', async () => {
    const loginResponse = await request(app).post('/api/account/login').send({
      email: 'unique@example.com',
      password: 'Password123',
    });
    const cookies = loginResponse.headers['set-cookie'];

    const logoutResponse = await request(app).post('/api/account/logout').set('Cookie', cookies);
    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.body).toHaveProperty('message', '로그아웃 성공');
  });
});
