# Castle Desktop Pet — 최신 인수인계 (2026-11-07)

**이 문서가 최신 공식 개발 현황이다. 2026-11-07 사용자 지정 9개 이미지가 아킬라 B형의 공식 기본안이며, 예전 시트/Gate1B/과거 포즈 선택 지침보다 우선한다.**

## GitHub

- Repo: `pchjesus/castle-desktop-pet`
- 개발 브랜치: `feat/v0.3c-action-pack`, [PR #6](https://github.com/pchjesus/castle-desktop-pet/pull/6) **Draft, 미병합**
- 스택: Windows Electron + Vite + TypeScript
- 현재 런타임은 기존 **A형 블루종**. B형 완성·개별 승인 전에 런타임 전환, A/B 프레임 혼합, main 병합, 배포 금지.
- 기존 A형 Idle/Smoking/Working/Drawing/Firing/Dual Firing 상태·대사·취소 처리·Reduced Motion·오프라인 `preview.html`·의상 로더 및 테스트 보존.

## 최상위 이미지 원본 / 백업

- **공식 아트 원본 9개:** [`docs/B_MUSTANG_CANONICAL_ASSETS_2026-11-07.md`](B_MUSTANG_CANONICAL_ASSETS_2026-11-07.md). **이 문서의 9종 이미지/해시가 최신이며 이전 날짜의 승인 목록은 이력일 뿐이다.**
- **백업 ZIP:** ChatGPT 라이브러리 `/Castle Desktop Pet/castle_pet_B_canonical_20261107.zip`
- ZIP SHA-256: `d2f7a6853ef7c1eb8e453678fa502a7b22da872381c8c46d6192ff1c6172a93e`
- ZIP `approved_visual_sources/`의 9개를 이미지 수정 없이 보존함. `ASSET_MANIFEST.json`에 원래 업로드 파일명, 이미지의 실제 포맷, 개별 SHA-256, 크기 수록.
- 9장: **Idle, Sitting, Drawing, Firing, Firing Dynamic, Smoking, Speaking 시트, Working (서서 노트북), Dual Firing.**
- 실제 파일: Idle/Sitting/Drawing/Firing/Smoking/Working은 **PNG RGBA**, Firing Dynamic/Speaking/Dual Firing은 **JPEG RGB**. `1000041386.png`, `1000041389.png`, `1000041393.png`는 확장자와 달리 진짜 JPEG. ZIP에서는 원본 바이트를 유지하며 `.jpg` 확장자로만 정리.
- 이전 Sitting(`1000041379.png` 체크무늬 JPEG)은 **최신 기본안에서 제외**되었음. 지금은 **`1000041381.png`의 RGBA Sitting**이 정본이며, 이전의 '체크무늬 분리 필요' 지시를 현재 Sitting에 잘못 적용하지 말 것.
- 이전 Working(앉아서 타이핑)은 **최신 기본안에서 제외**. 현재 **`1000041391.png` 서서 노트북 사용** 포즈가 정본.
- 최신 **Dual Firing**은 `1000041393.png`에서 가져온 이미지. 기존 재생성 후보로 덮어쓰지 않는다.
- 원본 JPEG는 배경이 불투명하며, RGBA도 가장자리/알파 품질은 추가 기술 검수할 수 있다. **시각 확정 ≠ 기술적 정제 완료**.
- **이 GitHub 브랜치에는 새 9개 이미지 바이너리가 아직 미등록.** 개인 라이브러리 ZIP에서 가져와 SHA 확인 후 **읽기 전용 원본 디렉터리로 등록**해야 한다. 등록하지 않았는데 등록했다고 보고하지 말 것.

## 캐릭터 설정 및 우선순위

- 1순위: **사용자가 직접 확정한 9개 아트 원본** 각각의 얼굴, 신체 비례, 복장, 포즈, 장비, 섬광, 그림체.
- 2순위: `design/references/akila-sheet-02.png`는 새 포즈의 설정/스타일 보조 참고. **위 9개를 과거 시트나 다른 이미지를 근거로 다시 그리지 않는다.**
- Gate1B과 더 오래된 초기 이미지, 재생성 실패본은 제작 이력·복구용.
- B형 갈색 무스탕/밝은 양털/검은 무지 티/중립 회색 바지/검은 부츠, 선글라스/수염/갈색 머리, **이마 흉터 없음**(미간 주름 허용), 평상시 홀스터 없음.
- A형 블루종은 검은 칼라 셔츠/청회색 바지, 별도 선택 의상으로 보존.
- 1024×1600은 투명 **정렬 캔버스**이지 인물 비율이 아님. 원본 캐릭터 몸을 비균일하게 늘리지 않는다.
- 오른손 리볼버 사용 및 조준→사격→정리 방향 일관성. 샷건은 후속 확장.

## 다음 개발 로드맵

1. ZIP에서 9개 원본을 불러와 이름/실제 포맷/SHA 확인, **그대로 GitHub 개발 브랜치에 보관**. 새 파일을 A형 에셋이나 이전 Gate1B에 덮어쓰지 않음.
2. 원본과 별도 폴더에서 앱용 스프라이트 정제: PNG 알파 잔여 광륜/레이어 분리, JPEG 3장 배경 분리, 머리/발 정렬, 180·240·360px 검수. 정제본과 원본 SHA를 혼동 금지.
3. 승인된 Drawing/Firing/Idle 기준으로 **리볼버 꺼내기→조준→발사→반동→정리→Idle** 중간 프레임 및 상태 전환.
4. 다음으로 Working 노트북 전환, Dual Firing 연속 프레임, Speaking 입/표정 루프, Smoking 연기 루프 구현. Firing Dynamic 추가 포즈도 승인 원본 사용.
5. 기존 애니메이션 코드/취소 처리/Reduced Motion/의상 선택/오프라인 preview 테스트를 재사용. **B형 전체 상태를 QA/승인 받기 전 A형 런타임 유지**.
6. `npm ci && npm run build && npm test && npm run preview:export`, Chromium 180/240/360, Windows CI, Windows 10/11 실제 GUI, EXE 패키징 순 검증.
7. Codex 테스트·빌드·배포·오류 이벤트/대사 실제 연동은 앱 통합 안정화 후. 이벤트 모의실행을 실제 연동으로 오인하지 말 것.

**Codex:** Terra Medium 기본, 복잡한 애니메이션 상태 전환이나 반복 버그는 High. 토큰 절감을 이유로 기능/검증 축소 금지.

## 다른 문서

- [최신 9종 원본·SHA 등록](B_MUSTANG_CANONICAL_ASSETS_2026-11-07.md)
- [시트 02의 역사적 참고/디자인 규칙](AKILA_CANONICAL_SHEET_02.md)
- [과거 승인 이력 — 최신 상태 아님](B_MUSTANG_ART_APPROVAL_2026-11-06.md)
- [PR #6](https://github.com/pchjesus/castle-desktop-pet/pull/6)
