# Mini Scrum

소규모 팀(2-5명)을 위한 업무 관리 및 주간 Agile 리뷰 웹 시스템.

## 기능

- **대시보드** — 현재 스프린트 요약, 팀원별 업무 현황
- **스프린트 관리** — 주간 스프린트 생성/수정/삭제
- **업무 보드** — 칸반 보드 (할 일 / 진행 중 / 완료), 드래그 앤 드롭
- **주간 리뷰** — Agile 스프린트 리뷰 양식 (완료/미완료 업무, 블로커, 다음 계획)
- **회고 (KPT)** — Keep / Problem / Try 양식
- **팀원 관리** — 팀원 등록/수정/삭제

## 기술 스택

- **Frontend**: Vue.js 3 + Vite 4 + Tailwind CSS 3
- **Backend**: Node.js + Express
- **Database**: Oracle DB

## 실행 방법

### 1. 의존성 설치

```bash
npm install
npm run setup
```

### 2. Oracle DB 설정

`.env` 파일을 프로젝트 루트에 생성:

```
PORT=3000
ORACLE_USER=your_user
ORACLE_PASSWORD=your_password
ORACLE_DSN=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=...)(PORT=...))(...))
```

### 3. DB 테이블 생성

`db/schema.sql`을 Oracle DB에서 실행.

### 4. 빌드 및 실행

```bash
npm run build
npm start
```

브라우저에서 `http://localhost:3000` 접속.

## 프로젝트 구조

```
mini-scrum/
├── server.js        # Express 서버 (API + 정적 파일 서빙)
├── routes/api.js    # API 엔드포인트
├── db/
│   ├── connection.js  # Oracle DB 연결
│   └── schema.sql     # 테이블 생성 스크립트
├── app/             # Vue.js 소스
│   ├── src/
│   │   ├── store.js     # 중앙 데이터 스토어
│   │   ├── views/       # 페이지 컴포넌트
│   │   └── router/      # Vue Router
│   └── dist/            # 빌드 결과물
└── package.json
```
