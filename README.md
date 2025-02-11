# Bulletin Board Server

이 프로젝트는 게시판 기능을 제공하는 서버입니다. 사용자는 게시글을 작성하고, 조회하고, 수정하고, 삭제할 수 있으며, 사용자 계정을 생성하고 로그인할 수 있습니다.

## 주요 기능

- **사용자 관리**: 회원가입, 로그인, 사용자 정보 조회, 수정, 삭제
- **게시글 관리**: 게시글 작성, 조회, 수정, 삭제
- **파일 업로드**: AWS S3를 사용한 파일 업로드

## 기술 스택

- **백엔드**: Node.js, Express
- **데이터베이스**: Prisma, MySQL
- **파일 스토리지**: AWS S3
- **API 문서화**: Swagger

## 설치 및 실행

1. **레포지토리 클론**

   ```bash
   git clone https://github.com/yourusername/bulletin-board-server.git
   cd bulletin-board-server
   ```

2. **의존성 설치**

   ```bash
   npm install
   ```

3. **환경 변수 설정**

   `.env` 파일을 생성하고 `.env.example` 파일을 참고하여 환경 변수를 설정합니다:

   ```plaintext
   DATABASE_URL="mysql://username:password@localhost:3306/board"
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=your_region
   AWS_S3_BUCKET_NAME=your_bucket_name
   JWT_SECRET_KEY=your_jwt_secret_key
   ```

4. **데이터베이스 마이그레이션**

   ```bash
   npx prisma migrate dev
   ```

5. **서버 실행**

   ```bash
   npm start
   ```

6. **API 문서 확인**

   브라우저에서 `http://localhost:3000/api-docs`로 이동하여 Swagger UI를 통해 API 문서를 확인할 수 있습니다.

## 테스트

```bash
npm test
```

## 기여

기여를 원하신다면, 이슈를 생성하거나 풀 리퀘스트를 제출해 주세요.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
