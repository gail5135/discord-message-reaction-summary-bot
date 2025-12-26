# Discord Reaction Echo Bot

메시지를 **카피해서 게시**하고, 그 **카피 메시지에 달린 리액션을 요약해서 실시간으로 반영**해주는 디스코드 봇입니다.

> 원본 메시지는 그대로 두고, 봇이 만든 카피 메시지에만 반응을 허용합니다.

---

## ✨ 주요 기능

- 📋 **메시지 카피**
  - 특정 채널에서 작성된 메시지를 봇이 그대로 복사하여 새 메시지로 전송

- 😀 **리액션 요약 자동 반영**
  - 카피 메시지에 달린 리액션만 감지
  - 같은 이모지에 반응한 유저들을 **한 줄로 묶어서 표시**

- 🧑‍🤝‍🧑 **유저 멘션 표시**
  - 이름이 아닌 Discord 멘션(`<@userId>`)으로 표시

- 🌐 **커스텀 이모지 지원**
  - 서버 커스텀 이모지도 그대로 표시 (`<:name:id>`)

- ✏️ **메시지 edit 기반 업데이트**
  - 요약 메시지를 새로 만들지 않고 하나의 메시지를 계속 수정

---

## 📌 동작 방식

1. 사용자가 특정 채널에 메시지를 작성
2. 봇이 해당 메시지를 **카피 메시지**로 전송
3. 사람들이 **카피 메시지에 리액션 추가 / 제거**
4. 봇이 카피 메시지를 수정하여 아래 형태로 요약

```
원본 메시지 내용 그대로
-----------
😀 : <@userA>, <@userB>
🔥 : <@userC>
```

---

## 🛠 기술 스택

- Node.js
- TypeScript
- discord.js v14
- ts-node (개발용)
- pm2 (운영용, 선택)

---

## 🚀 설치 & 실행

### 1. 저장소 클론

```bash
git clone https://github.com/your-name/reaction-echo.git
cd reaction-echo
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경 변수 설정

루트에 `.env` 파일 생성:

```env
DISCORD_TOKEN=여기에_봇_토큰
```

### 4. 개발 모드 실행

```bash
npx ts-node src/index.ts
```

정상 실행 시:

```
Logged in as your-bot-name#1234
```

---

## 🔐 Discord 설정 체크리스트

### Developer Portal

- Bot 생성
- **MESSAGE CONTENT INTENT 활성화**

### OAuth2 → URL Generator

**Scopes**
- `bot`

**Bot Permissions**
- Read Messages / View Channels
- Send Messages
- Add Reactions
- Read Message History

---

## 📁 프로젝트 구조

```
reaction-echo/
 ├─ src/
 │   └─ index.ts
 ├─ .env
 ├─ package.json
 └─ README.md
```

---

## 📎 앞으로 추가 예정

- 특정 채널만 카피 대상 지정
- 리액션 최소 개수 조건
- 요약 메시지 포맷 커스터마이즈
- 관리자 명령어 (on/off)

---

## ⚠️ 주의사항

- 봇은 **실행 중인 프로세스(VPS/로컬)가 반드시 필요**합니다.
- Discord Developer Portal에 등록만 해서는 동작하지 않습니다.

---

## 📄 License

MIT License
