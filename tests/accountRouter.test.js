import request from 'supertest';
import app from '../src/server.js';

describe('Account Router', () => {
  it('should sign up a new user or pass if email already exists', async () => {
    const response = await request(app)
      .post('/api/account')
      .send({
        email: 'unique@example.com',
        password: 'Password123',
        nickname: `testuser_${Date.now()}`,
      });
    if (response.statusCode === 201) {
      expect(response.body).toHaveProperty('message', '회원가입 성공');
    } else {
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', '회원가입 실패');
    }
  });

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

  it('should create and delete a post', async () => {
    const loginResponse = await request(app).post('/api/account/login').send({
      email: 'unique@example.com',
      password: 'Password123',
    });
    const cookies = loginResponse.headers['set-cookie'];
    const accessTokenCookie = cookies.find((cookie) => cookie.includes('AccessToken'));
    const accessToken = accessTokenCookie.split(';')[0].split('=')[1];
    expect(accessToken).toBeDefined();

    const postResponse = await request(app)
      .post('/api/post')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Test Post',
        content: 'This is a test post.',
      });
    expect(postResponse.statusCode).toBe(201);
    expect(postResponse.body).toHaveProperty('title', 'Test Post');

    const postId = postResponse.body.id;
    const deleteResponse = await request(app)
      .delete(`/api/post/${postId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(deleteResponse.statusCode).toBe(204);
  });

  it('should log out a user', async () => {
    const loginResponse = await request(app).post('/api/account/login').send({
      email: 'unique@example.com',
      password: 'Password123',
    });
    const cookies = loginResponse.headers['set-cookie'];
    const accessTokenCookie = cookies.find((cookie) => cookie.includes('AccessToken'));
    const accessToken = accessTokenCookie.split(';')[0].split('=')[1];
    expect(accessToken).toBeDefined();

    const logoutResponse = await request(app)
      .post('/api/account/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.body).toHaveProperty('message', '로그아웃 성공');
  });
});
