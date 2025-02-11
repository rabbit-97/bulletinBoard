import request from 'supertest';
import app from '../src/server.js';

describe('Account Router', () => {
  it('should sign up a new user', async () => {
    const response = await request(app).post('/api/account').send({
      email: 'test@example.com',
      password: 'Password123',
      nickname: 'testuser',
    });
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', '회원가입 성공');
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
});
