import request from 'supertest';
import app from '../src/server.js';
import dotenv from 'dotenv';
dotenv.config();

describe('Integration Tests', () => {
  it('should sign up a new user or pass if email already exists', async () => {
    const email = `unique_${Date.now()}@example.com`;
    const nickname = `testuser_${Date.now()}`;
    const response = await request(app).post('/api/account').send({
      email,
      password: 'Password123',
      nickname,
    });
    if (response.statusCode === 201) {
      expect(response.body).toHaveProperty('message', '회원가입 성공');
    } else {
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', '회원가입 실패');
    }

    const loginResponse = await request(app).post('/api/account/login').send({
      email,
      password: 'Password123',
    });
    const cookies = loginResponse.headers['set-cookie'];
    const accessTokenCookie = cookies.find((cookie) => cookie.includes('AccessToken'));
    const accessToken = accessTokenCookie.split(';')[0].split('=')[1];
    expect(accessToken).toBeDefined();

    const userId = response.body.user.id;
    const userResponse = await request(app)
      .get(`/api/account/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(userResponse.statusCode).toBe(200);
    expect(userResponse.body).toHaveProperty('email', email);

    const updateResponse = await request(app)
      .put(`/api/account/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: `updated_${Date.now()}@example.com`,
        password: 'NewPassword123',
        nickname: `updateduser_${Date.now()}`,
      });
    expect(updateResponse.statusCode).toBe(200);
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

  it('should retrieve user information', async () => {
    const email = `unique_${Date.now()}@example.com`;
    const nickname = `testuser_${Date.now()}`;
    const response = await request(app).post('/api/account').send({
      email,
      password: 'Password123',
      nickname,
    });
    const userId = response.body.user.id;

    const loginResponse = await request(app).post('/api/account/login').send({
      email,
      password: 'Password123',
    });
    const cookies = loginResponse.headers['set-cookie'];
    const accessTokenCookie = cookies.find((cookie) => cookie.includes('AccessToken'));
    const accessToken = accessTokenCookie.split(';')[0].split('=')[1];
    expect(accessToken).toBeDefined();

    const userResponse = await request(app)
      .get(`/api/account/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(userResponse.statusCode).toBe(200);
    expect(userResponse.body).toHaveProperty('email', email);
  });

  it('should update user information', async () => {
    const email = `unique_${Date.now()}@example.com`;
    const nickname = `testuser_${Date.now()}`;
    const response = await request(app).post('/api/account').send({
      email,
      password: 'Password123',
      nickname,
    });
    const userId = response.body.user.id;

    const loginResponse = await request(app).post('/api/account/login').send({
      email,
      password: 'Password123',
    });
    const cookies = loginResponse.headers['set-cookie'];
    const accessTokenCookie = cookies.find((cookie) => cookie.includes('AccessToken'));
    const accessToken = accessTokenCookie.split(';')[0].split('=')[1];
    expect(accessToken).toBeDefined();

    const updateResponse = await request(app)
      .put(`/api/account/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: `updated_${Date.now()}@example.com`,
        password: 'NewPassword123',
        nickname: `updateduser_${Date.now()}`,
      });
    expect(updateResponse.statusCode).toBe(200);
  });

  it('should create and delete a comment', async () => {
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
    const postId = postResponse.body.id;

    const commentResponse = await request(app)
      .post('/api/comment')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: 'This is a test comment.',
        postId: postId,
      });
    expect(commentResponse.statusCode).toBe(201);
    expect(commentResponse.body).toHaveProperty('content', 'This is a test comment.');

    const commentId = commentResponse.body.id;
    const deleteCommentResponse = await request(app)
      .delete(`/api/comment/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(deleteCommentResponse.statusCode).toBe(204);
  });

  it('should allow admin to manage users', async () => {
    const adminEmail = `admin_${Date.now()}@example.com`;
    const adminNickname = `adminuser_${Date.now()}`;
    const adminResponse = await request(app).post('/api/admin/signup').send({
      email: adminEmail,
      password: 'AdminPassword123',
      nickname: adminNickname,
    });
    const adminUserId = adminResponse.body.user.id;

    const adminLoginResponse = await request(app).post('/api/account/login').send({
      email: adminEmail,
      password: 'AdminPassword123',
    });
    const adminCookies = adminLoginResponse.headers['set-cookie'];
    const adminAccessTokenCookie = adminCookies.find((cookie) => cookie.includes('AccessToken'));
    const adminAccessToken = adminAccessTokenCookie.split(';')[0].split('=')[1];
    expect(adminAccessToken).toBeDefined();

    const adminUserResponse = await request(app)
      .get(`/api/admin/account/${adminUserId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(adminUserResponse.statusCode).toBe(200);

    const adminUpdateResponse = await request(app)
      .put(`/api/admin/account/${adminUserId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        email: `adminupdated_${Date.now()}@example.com`,
        password: 'AdminNewPassword123',
        nickname: `adminupdated_${Date.now()}`,
      });
    expect(adminUpdateResponse.statusCode).toBe(200);

    const adminDeleteResponse = await request(app)
      .delete(`/api/admin/account/${adminUserId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(adminDeleteResponse.statusCode).toBe(204);
  });

  it('should not allow more than 4 nested comments', async () => {
    const maxDepth = parseInt(process.env.MAX_COMMENT_DEPTH);
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
        title: 'Test Post for Comments',
        content: 'This is a test post for comments.',
      });
    const postId = postResponse.body.id;

    let parentId = null;
    for (let i = 0; i <= maxDepth; i++) {
      const commentResponse = await request(app)
        .post('/api/comment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: `This is comment level ${i + 1}.`,
          postId: postId,
          parentId: parentId,
        });
      expect(commentResponse.statusCode).toBe(201);
      parentId = commentResponse.body.id;
    }

    const fifthCommentResponse = await request(app)
      .post('/api/comment')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: `This is comment level ${maxDepth + 2}.`,
        postId: postId,
        parentId: parentId,
      });
    expect(fifthCommentResponse.statusCode).toBe(400);
    expect(fifthCommentResponse.body).toHaveProperty('error', '댓글 깊이 제한을 초과했습니다.');
  });
});
