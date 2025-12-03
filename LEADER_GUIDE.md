# 👑 Quest Board 총괄 관리자 가이드

이 문서는 프로젝트 리드(팀장) 역할을 맡은 당신을 위한 비밀 지침서입니다.
팀원들이 개발에 집중할 수 있도록 환경을 구축하고, 코드를 검토하며, 프로젝트를 성공적으로 이끄는 방법을 담았습니다.

---

## 🎯 1. 당신의 역할 (R&R)

1.  **초기 환경 셋업**: 프로젝트의 뼈대를 만들고 팀원들이 바로 시작할 수 있게 준비합니다. (이미 완료!)
2.  **코드 리뷰 및 병합 (Merge)**: 팀원들이 작성한 코드가 안전한지, 규칙을 잘 지켰는지 확인하고 합칩니다.
3.  **트러블슈팅**: 팀원들이 해결 못 하는 에러나 충돌을 해결해줍니다.
4.  **Firebase 관리**: 데이터베이스 보안 규칙, 인증 설정 등을 관리합니다.
5.  **배포 (Deployment)**: 완성된 코드를 실제 웹사이트로 배포합니다.

---

## 🛠 2. 초기 필수 설정 (이미 했는지 확인!)

팀원들이 작업을 시작하기 전에 아래 설정들이 되어 있어야 합니다.

### 1) GitHub 리포지토리 설정

- [x] 리포지토리 생성 및 코드 푸시 완료
- [ ] **Branch Protection Rule 설정 (강력 추천)**
  - 목적: 팀원들이 `main` 브랜치에 실수로 바로 푸시하는 것을 막고, 반드시 **Pull Request(PR)**를 거치도록 강제합니다.
  - 방법:
    1. GitHub 리포지토리 -> **Settings** -> **Branches**
    2. **Add branch protection rule** 클릭
    3. `Branch name pattern`에 `main` 입력
    4. `Require a pull request before merging` 체크
    5. `Create` 클릭

### 2) Firebase 설정 공유

- `firebaseDB.ts` 파일에 있는 API Key 등은 현재 공개되어 있습니다. (실제 서비스라면 환경 변수(`.env`)로 숨겨야 하지만, 학습용이므로 지금은 괜찮습니다.)
- 팀원들에게 "이 키는 우리끼리만 쓰자"고 알려주세요.

---

## 👀 3. 코드 리뷰 및 병합 가이드 (Pull Request 처리)

팀원이 기능을 다 만들고 **Pull Request (PR)**를 보내면, 당신은 아래 순서로 검토합니다.

### 1단계: 알림 확인 및 접속

- GitHub 알림이 오면 PR 페이지로 이동합니다. (탭 메뉴의 `Pull requests`)

### 2단계: 변경 사항 확인 (Files changed 탭)

- **Files changed** 탭을 눌러 어떤 코드가 바뀌었는지 봅니다.
- **체크리스트**:
  - [ ] 불필요한 주석이나 콘솔 로그(`console.log`)가 없는가?
  - [ ] 변수 이름이 이해하기 쉬운가? (예: `a` 대신 `userList`)
  - [ ] 기존 코드를 실수로 지우지 않았는가?
  - [ ] 포맷팅이 깨지지 않았는가?

### 3단계: 피드백 남기기 (Review)

- 수정이 필요한 줄에 마우스를 올리고 `+` 버튼을 눌러 코멘트를 남깁니다.
  - "여기서 에러가 날 것 같아요."
  - "이 변수 이름은 `todos`로 바꾸는 게 좋겠어요."
- 피드백을 다 남겼다면 우측 상단의 **Review changes** -> **Request changes**를 누릅니다.
- 문제가 없다면 **Approve**를 누릅니다.

### 4단계: 병합하기 (Merge)

- Approve 후, 하단의 초록색 **Merge pull request** 버튼을 누릅니다.
- **Confirm merge**까지 누르면 `main` 코드에 합쳐집니다!

---

## 🚨 4. 자주 발생하는 문제 해결 (Troubleshooting)

### 상황 1: "충돌(Conflict)이 났어요!" 😱

팀원 A와 B가 같은 파일의 같은 줄을 수정하면 충돌이 발생합니다.
**해결 방법 (당신이 도와주세요):**

1. 당신의 로컬 컴퓨터에서 `main` 브랜치를 최신으로 업데이트합니다: `git pull origin main`
2. 충돌 난 브랜치로 이동: `git checkout feature/충돌난-브랜치`
3. `main`을 여기에 합쳐봅니다: `git merge main`
4. VS Code(Cursor)에서 충돌 난 파일이 빨간색으로 표시됩니다.
   - `Accept Incoming Change` (내 거) / `Accept Current Change` (main 거) 중 올바른 코드를 선택하거나 직접 수정합니다.
5. 수정 후 다시 커밋하고 푸시합니다.

### 상황 2: "npm run dev가 안 돼요!"

- `npm install`을 했는지 물어보세요. (새로운 라이브러리가 추가됐을 수 있음)
- Node.js 버전이 맞는지 확인하세요. (`node -v`)

### 상황 3: "Firebase 에러가 나요 (Missing permissions)"

- 당신이 Firebase 콘솔에서 **Security Rules**를 너무 빡빡하게 잡았을 수 있습니다.
- `LEADER_GUIDE.md` 하단의 **Firebase 관리** 섹션을 참고하세요.

---

## 🔥 5. Firebase 관리 (심화)

프로젝트의 데이터베이스 관리자로서 알아야 할 내용입니다.

### Firestore 보안 규칙 (Security Rules)

개발 중에는 편하게 열어두지만, 나중에는 막아야 합니다.

- **개발용 (모두 허용)**:
  ```javascript
  allow read, write: if true;
  ```
- **배포용 (로그인한 사람만)**:
  ```javascript
  allow read, write: if request.auth != null;
  ```
- 규칙 변경 위치: [Firebase Console](https://console.firebase.google.com/) -> Firestore Database -> Rules

---

## 🤝 6. 데이터베이스 충돌 방지 가이드

여러 명이 하나의 Firebase DB를 공유하면, 서로 데이터를 지우거나 구조를 바꿔서 에러가 날 수 있습니다.
이를 방지하기 위한 **팀 규칙**을 정해두세요.

### 방법 1: 쿨한 소통 (추천) ⭐

프로젝트 규모가 작을 때는 이 방법이 가장 빠릅니다.

1. **"내 데이터만 건드리기"**: "테스트할 때 내가 만든 팀, 내가 만든 투두만 수정/삭제하자."
2. **"구조 변경 예고제"**: 데이터 필드를 추가하거나 바꿀 땐 단톡방에 미리 공지합니다.
   - 🗣️ "나 `Team` 데이터에 `description` 필드 추가할 거야! 에러 나면 말해줘."
3. **"DB 초기화의 날"**: 데이터가 너무 꼬이면 리더가 DB를 싹 비우고 공지합니다.
   - 🗣️ "DB 데이터 너무 더러워서 다 지웠음. 다시 가입해서 테스트해!"

### 방법 2: 개발용/배포용 DB 분리 (나중에)

서비스를 진짜로 배포하게 되면 필수입니다.

1. Firebase 프로젝트를 하나 더 만듭니다. (예: `quest-board-dev`)
2. 팀원들에게는 `dev` 프로젝트의 API 키를 줍니다.
3. 실제 배포할 때는 원래 프로젝트(`quest-board-prod`)의 키를 씁니다.

---

## 🚀 7. 배포하기 (Vercel 이용 추천)

웹사이트를 인터넷에 올리는 방법입니다. Next.js를 만든 Vercel을 쓰면 아주 쉽습니다.

1. [Vercel.com](https://vercel.com) 회원가입 (GitHub 아이디로 로그인)
2. **Add New...** -> **Project** 클릭
3. GitHub 리포지토리(`quest-board`) 선택 후 **Import** 클릭
4. **Deploy** 버튼 클릭
5. 끝! 🎉 자동으로 URL이 생성됩니다. (예: `quest-board-xyz.vercel.app`)

팀원들에게 이 URL을 공유하면, 이제 전 세계 어디서든 접속할 수 있습니다!

---

**리더님, 화이팅입니다! 🫡**
당신의 가이드 덕분에 팀원들은 즐겁게 코딩할 수 있을 거예요.
