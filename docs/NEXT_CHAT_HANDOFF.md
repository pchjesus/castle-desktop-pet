# Castle Desktop Pet — 새 채팅 공식 인수인계 (2026-11-07)

> **이 문서가 최신·우선 인수인계다.** 2026-11-06 이전 `Gate1B` 후보 우선/시트 02 폐기 지침과 오래된 Sitting·Working 상태 기재는 무효. 새 채팅에서 이 문서부터 읽을 것.

## 1. GitHub·작업 제한

- Repository: `pchjesus/castle-desktop-pet`
- 작업 브랜치: `feat/v0.3c-action-pack`; PR [#6](https://github.com/pchjesus/castle-desktop-pet/pull/6) **Draft**. 해당 PR의 HEAD는 시작할 때 GitHub에서 다시 조회.
- Windows Electron + Vite + TypeScript. 현재 실행 캐릭터는 **기존 A형 블루종**. 해당 런타임의 Idle, Smoking, Working, Drawing, Firing, Dual Firing, Speaking(플레이스홀더) 및 `preview.html`·Reduced Motion·취소 처리 등 기존 기능은 유지.
- 사용자 명시 승인 전 **main 병합/배포 금지**, B형 런타임 조기 활성화 금지. B형 프레임 누락 시 A형을 같은 시퀀스에 섞어 대체하지 말 것.
- 기존 A형 사진/테스트/애니메이션 코드는 임의 삭제하지 말 것.

## 2. 공식 캐릭터 디자인

- **공식 시트:** [`design/references/akila-sheet-02.png`](../design/references/akila-sheet-02.png). [상세 규칙](AKILA_CANONICAL_SHEET_02.md).
- B형: **갈색 무스탕, 크림 양털 칼라·소매, 검은 무지 티셔츠, 중립 회색 바지, 검은 부츠**, 갈색 올백 헤어, 갈색 틴트 에비에이터 선글라스, 짙은 수염, 과묵한 표정.
- A형: 올리브 블루종, 검은 **칼라 셔츠**, 청회색 바지.
- **모든 일상 포즈에 이마 흉터 없음; 평상시 권총 홀스터 없음.** 이마 미간 주름은 허용하지만 흉터와 진한 이마 그림자는 불필요.
- 1024×1600은 투명 정렬용 캔버스 권장값이지 인물 신체 비율이 아님. 인물 늘이기/다리 단축/머리 과장 금지. 사용자가 직접 승인한 개별 포즈는 해당 포즈의 아트 원본으로 보호.
- 오른손 리볼버: 캐릭터 자신의 오른손 사용. **정면에서 화면 왼쪽**. 오른손 꺼내기→조준→사격→정리의 방향 유지. 샷건은 후속 확장.

## 3. 최신 승인 현황 — 시각 승인 ≠ 앱 통합

| B형 상태 | 최신 사용자 결정 | 아직 필요한 작업 |
|---|---|---|
| Idle | 서 있는 최신 무스탕 캐릭터 비율/외형 사용 | 이마 음영 정리 후보·알파 QA·정렬 |
| Smoking | **시각 승인** | 연기 루프, 가장자리 알파 QA |
| Sitting | 사용자가 **이전 체크무늬 Sitting 이미지(`1000041379.png`)를 다시 지정** | 실제 RGB JPEG에 새겨진 체크무늬 배경 분리. 기술 분리 후보 존재하지만 **이마 흉터/경계 QA** 남음 |
| Working | **상자에 앉아 노트북을 타이핑하는 단독 키 포즈 승인** | 노트북 꺼내기/닫기/정리 프레임 미완성. 서서 타이핑하는 임의 시트를 승인본으로 혼동하지 말 것 |
| Drawing | 오른손 리볼버 낮은 조준 키 포즈 긍정 수용 | 꺼내기/조준/복귀 중간 프레임 |
| Firing | 단발 섬광 키 포즈 생성됨 | 팔 반동·총구 섬광 정렬·정리·원상복귀·최종 아트 QA |
| Dual Firing | 양손 사격 핵심 포즈 긍정 수용 | 준비→교차 사격→반동→정리 등 연속프레임과 무기 종류 확인 |
| Speaking | 흉터 제거한 표정 시트 긍정 수용, 7프레임 Speaking 루프 기술 후보 확보 | 얼굴 위치·입만 움직임 검증, 전신 Idle/대사 상태와 연결, 투명 알파 및 180/240/360px QA |

### 주의: 이전 문서의 기술·이미지 상태 혼동 금지

- `idle-gate1b-alpha-cleanup-unapproved.png`는 오래된 **비율 불일치 기술 후보**이지 최신 아트 원본이 아님.
- Sitting 원본을 사용자가 다시 지정한 후 과거의 `akila_B_sitting_CONDITIONALLY_ACCEPTED_original.png`는 선택된 Sitting이 **아님**.
- Speaking용 입 루프는 `400×500` RGBA 7컷과 APNG/GIF **기술 후보**. 전신이나 실행 코드에 이미 통합되었다고 기재하지 말 것.
- 최신 아트 원본들의 PNG가 곧바로 앱에 쓸 수 있는 고품질 투명 PNG라는 주장은 금지. 알파가 대부분 반투명인 파일도 존재. 시각 승인/알파 승인/런타임 통합/Windows 실기기 검증은 모두 별도 단계.
- 방금 작업한 Sitting 체크무늬 배경 제거 후보는 **원본 인체 비례를 보존**했으나, 이마 우측 흉터와 헤어·부츠 가장자리의 최종 QA는 남음.
- Drawing/Firing/Dual 핵심 그림 생성만으로 중간 프레임과 상태 전환이 완성된 것은 아님.

## 4. 새 채팅에서도 접근할 수 있는 이미지 패키지

**개인 파일 라이브러리**: `/Castle Desktop Pet/castle_desktop_pet_B_handoff_20261107.zip` (2026-11-07 생성). 같은 파일을 이전 채팅에서 다운로드 링크로도 제공.

- 패키지 SHA-256: `752a3fad59e0e4aea9b06952d71f2c9281a54f6fae228216f65a36ec79bbe6da`.
- 26개 이미지·애니메이션·QA 파일 + 4개 인수인계/매니페스트/스크립트 문서, 총 30개 ZIP 엔트리.
- `notes/README_KR.md`: 승인 내역·남은 작업. `notes/NEXT_CHAT_START_PROMPT.md`: 새 채팅 시작 지시문. `notes/ASSET_MANIFEST.json`: 파일별 원본 위치, SHA, 가로세로, RGBA/알파 픽셀 분포, 승인 상태.
- `approved_sources/`에는 사용자가 확인한 **시각 원본**을 변형하지 않고 보존. `technical_candidates/`는 **미승인 정제/루프 후보**, `review_sources/`는 추가 아트 QA 필요.
- **신규 이미지 바이너리는 아직 GitHub에 추가되지 않음.** GitHub에는 문서/기존 디자인 시트가 있고, 새 작업 단계에서 ZIP의 실제 파일을 개발 브랜치에 등록하여 SHA를 확인해야 함.

## 5. 다음 순서 (토큰 낭비·시각적 재생성 최소화)

1. 새 채팅에서 위 ZIP 및 JSON 매니페스트를 확보한 뒤, GitHub 최신 브랜치·PR 상태 재검증.
2. 승인 원본은 변경 없이 원본 보존용 하위 폴더에 GitHub 추가, 후보는 별도 경로에 두고 사본/해시 검증. **승인된 소스와 앱용 정제 에셋을 혼동하지 않을 것.**
3. Sitting 체크무늬 분리, 이마 흉터 국소 수정, 전체 소스의 알파·외곽 광륜·머리/발 기준선 검증. 180/240/360px 병렬 비교.
4. **B형 Drawing→Firing→Idle**의 중간 프레임과 전환 우선 구현. 그다음 Working 노트북 전환, Dual 연속프레임, Speaking 얼굴 레이어/발화 루프, Smoking 연기 루프.
5. 앱 기존 상태 머신/로더·오프라인 preview 재사용. B 전체 포즈가 충족되고 사용자 승인 받은 뒤에만 B 런타임으로 변경.
6. 테스트: `npm ci && npm run build && npm test && npm run preview:export`, Chromium 180/240/360, Windows Server CI, Windows 10/11 실제 GUI, EXE 패키징 순서.
7. Codex 개발 이벤트(테스트·빌드·배포·오류)와 대사 연결은 앱 통합 뒤에 진행. **이벤트 시뮬레이션과 실제 연동을 명확히 분리**.

**Codex 권장:** Terra Medium은 파일 정리·QA·단순 연동, High는 복잡한 상태 전환·Windows 오류 분석에서 사용. 기능·검증 범위를 토큰 절약 명목으로 축소하지 않는다.

## 6. 관련 파일

- [공식 시트와 비율 규칙](AKILA_CANONICAL_SHEET_02.md)
- [기존 사용자 승인 이력](B_MUSTANG_ART_APPROVAL_2026-11-06.md) (과거 상태가 섞여 있음. 최신 상태는 **이 문서**)
- [에셋 전환 계획](ASSET_MIGRATION_PLAN.md)
- [PR #6](https://github.com/pchjesus/castle-desktop-pet/pull/6)
