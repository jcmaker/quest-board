# Quest Board (협업 튜토리얼 프로젝트)

웹 개발이 처음인 팀원들을 위해 만들어진 **Quest Board** 프로젝트에 오신 것을 환영합니다! 👋
이 문서는 여러분이 Git, Next.js, 그리고 Cursor AI를 활용해 협업하는 방법을 처음부터 끝까지 안내합니다.

---

## 🚀 1. 시작하기 전에 (필수 설치)

이 프로젝트를 실행하려면 아래 프로그램들이 필요합니다. 이미 설치되어 있다면 넘어가셔도 됩니다.

### 1) Node.js 설치

자바스크립트 실행 환경입니다. Next.js를 돌리기 위해 필수입니다.

- [Node.js 공식 홈페이지](https://nodejs.org/)에서 **LTS 버전**을 다운로드하여 설치하세요.
- 설치 확인: 터미널(터미널 여는 법: Mac은 `Cmd + Space` -> '터미널', Windows는 `Win` 키 -> 'PowerShell')을 열고 아래 명령어를 입력하세요.
  ```bash
  node -v
  npm -v
  ```
  숫자가 나오면 성공입니다!

### 2) Git 설치

코드를 저장하고 공유하는 도구입니다.

- [Git 다운로드](https://git-scm.com/downloads)
- 설치 확인: 터미널에서 `git --version` 입력

### 3) Cursor 에디터 설치 (강력 추천 ✨)

AI가 코딩을 도와주는 에디터입니다. 우리는 이걸로 개발합니다.

- [Cursor 다운로드](https://cursor.sh/)

---

## 💻 2. 프로젝트 내 컴퓨터로 가져오기 (Clone)

터미널(또는 Cursor의 터미널 `Ctrl + \``)을 열고 아래 순서대로 따라하세요.

1. **프로젝트 복사하기**
   (아래 주소는 실제 깃허브 주소로 변경해주세요)

   ```bash
   git clone https://github.com/jcmaker/quest-board.git
   ```

2. **프로젝트 폴더로 이동**

   ```bash
   cd quest-board
   ```

3. **필요한 라이브러리 설치** (이게 없으면 실행 안 돼요!)
   ```bash
   npm install
   ```

4. **Firebase 환경 변수 설정** (중요! 🔥)

   프로젝트가 Firebase를 사용하므로 환경 변수 설정이 필요합니다.

   - 프로젝트 루트에 `.env.local` 파일이 생성되어 있습니다.
   - 이 파일을 열고 `your-api-key-here` 등의 플레이스홀더를 실제 Firebase 프로젝트 값으로 교체해야 합니다.
   - Firebase 콘솔([https://console.firebase.google.com/](https://console.firebase.google.com/))에서:
     1. 프로젝트 선택 (또는 새로 만들기)
     2. 프로젝트 설정 > 일반 > 내 앱 > Firebase SDK snippet > 구성
     3. 여기 나오는 값들을 `.env.local` 파일에 복사해 넣으세요.

   ```bash
   # .env.local 파일 예시
   NEXT_PUBLIC_FIREBASE_API_KEY=실제-API-키
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=프로젝트ID.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=프로젝트ID
   # ... 나머지 값들도 채워넣기
   ```

---

## ▶️ 3. 프로젝트 실행하기

설치가 다 끝났다면, 이제 웹사이트를 띄워봅시다.

```bash
npm run dev
```

- 터미널에 `Ready in ...` 메시지가 뜨면 성공!
- 브라우저(크롬 등)를 열고 [http://localhost:3000](http://localhost:3000) 주소로 들어가세요.
- Quest Board 화면이 보이면 성공입니다! 🎉

---

## 🤖 4. Cursor AI와 함께 코딩하는 법 (중요!)

개발 지식이 없어도 괜찮습니다. Cursor의 AI 기능을 적극 활용하세요.

### ✨ Ctrl + K (커맨드 K): AI에게 코드 짜달라고 하기

코드 파일에서 `Ctrl + K` (Mac은 `Cmd + K`)를 누르면 입력창이 뜹니다.

- "여기에 버튼 하나 만들어줘"
- "이 글자 색깔 빨간색으로 바꿔줘"
- "로그인 기능이 어떻게 작동하는지 설명해줘"
  라고 한글로 입력하면 AI가 코드를 수정해줍니다.

### ✨ Ctrl + L (커맨드 L): AI와 대화하기 (Chat)

왼쪽에 채팅창이 열립니다.

- "이 프로젝트 구조가 어떻게 돼?"
- "내가 지금 뭘 해야 하는지 모르겠어, 알려줘"
- 에러가 났을 때 에러 메시지를 복사해서 붙여넣고 "이거 왜 이러는 거야?"라고 물어보세요.

---

## 📝 5. 협업 규칙 (Git Flow)

우리는 코드를 꼬이지 않게 하기 위해 규칙을 지켜야 합니다.

### 1단계: 내 작업 공간 만들기 (Branch)

메인 코드(main)를 직접 건드리지 말고, 내 전용 작업 공간(Branch)을 만듭니다.

```bash
# 예: git checkout -b feature/login-page
git checkout -b feature/본인이름-작업내용
```

### 2단계: 작업하고 저장하기

코드를 수정했다면 저장합니다.

```bash
# 변경된 파일 모두 선택
git add .

# 변경 내용에 이름표 붙이기 (메시지는 자세히!)
git commit -m "로그인 버튼 디자인 수정"
```

### 3단계: 내 작업물 올리기 (Push)

```bash
# 내 브랜치를 깃허브에 올리기
git push origin feature/본인이름-작업내용
```

### 4단계: 합쳐달라고 요청하기 (Pull Request)

- 깃허브 페이지로 가서 "Compare & pull request" 버튼을 누릅니다.
- 내가 뭘 했는지 적고 팀원들에게 알립니다.

---

## 📂 프로젝트 구조 설명

- `app/`: 페이지들이 들어있는 곳입니다.
  - `page.tsx`: 메인 페이지 (투두 리스트가 보이는 곳)
  - `layout.tsx`: 전체적인 틀 (헤더, 폰트 설정 등)
- `components/`: 재사용 가능한 부품들 (버튼, 카드, 다이얼로그 등)
  - `app-sidebar.tsx`: 왼쪽 사이드바 메뉴
  - `TodoList.tsx`: 투두 리스트 컴포넌트
- `lib/`: 로직과 데이터 처리
  - `firebaseDB.ts`: 데이터베이스 연결 설정
  - `teams.ts`: 팀 관리 관련 기능
  - `todos.ts`: 투두 생성/삭제 기능

---

## 🔥 주요 기능 (Quest Board)

1. **구글 로그인**: Firebase를 이용해 간편하게 로그인합니다.
2. **개인 투두**: 나만 볼 수 있는 할 일 목록입니다.
3. **팀 투두**: 팀원들과 공유하는 할 일 목록입니다.
   - **팀 만들기**: 사이드바에서 팀을 만들고 초대 코드를 생성합니다.
   - **팀 참여하기**: 초대 코드를 입력해 팀에 들어갑니다.
   - **관리자 기능**: 팀을 만든 사람은 이름 변경, 팀원 추방, 팀 삭제가 가능합니다.
4. **다크 모드**: 눈이 편안한 다크 모드를 지원합니다.

---

**Happy Coding! 🚀**
모르는 게 있으면 언제든 Cursor에게 물어보세요!
