# CASTLE PET — 현재 무스탕 작업 이미지 우선 원칙 (2026-11-06 정정)

**최우선:** 초기 캐릭터 디자인 시트로 돌아가지 않는다. 사용자와 현재까지 제작해 온 최신 무스탕 아킬라 이미지 계열이 앞으로 모든 포즈의 시각 기준이다. 초기 `design/references/akila-sheet-01.png` 및 `akila-sheet-02.png`는 폐기 예정 레거시 참고 자료로만 간주한다. 인물·머리·몸통·다리 비율을 그 시트와 맞추려고 현재 이미지를 재작업하지 말 것.

**현재 작업 마스터 후보:** `src/characters/candidates/akila_mustang/idle-gate1b-alpha-cleanup-unapproved.png` — 지금까지 발전시킨 최신 B형 이미지의 알파 정제본. 이를 기반으로 발전시키며, 향후 사용자가 승인한 새 이미지가 나오면 그 새 이미지를 상위 마스터로 지정한다.

**승인 단계 구분:** 이 경로가 앞으로 발전시킬 이미지 기준이라는 결정과, PNG의 최종 시각 품질 승인은 별개다. `unapproved`는 사용자의 최종 아트 승인 전까지 유지한다. 과거 캐디는 원본·저작 이력 확인과 복구 목적으로만 보존한다.

**금지:** 오래된 시트에 맞춰 머리를 작게 하거나 다리를 늘리는 등 현재 마스터 비율을 되돌리기, A형 블루종 이미지를 새로운 B형 포즈의 외형 기준으로 삼기, 새로운 B형 프레임 사이 A/B 외형 혼합.

---
# Castle Desktop Pet — 다음 채팅 인수인계 (2026-11-06)

## 현재 기준
- GitHub: `pchjesus/castle-desktop-pet`
- 개발 브랜치: `feat/v0.3c-action-pack`, PR [#6](https://github.com/pchjesus/castle-desktop-pet/pull/6) **Draft**
- `main` 초기 기준: `4f5804eba752461a1088d613e93ef92c582f6100`; **병합 금지**
- 최신 HEAD는 작업 시작 전 GitHub에서 다시 확인한다.
- 기술: Windows Electron + Vite + TypeScript, 단일 오프라인 `preview.html` 유지.

## 확정된 제품 / 아트
- 구형 디자인 시트 `design/references/akila-sheet-01.png`, `akila-sheet-02.png`: **제작 기준에서 퇴역**, 이력 참고로만 보존. 실제 기준은 **현재 최신 무스탕 마스터 후보**이며 과거 시트와의 일치 여부로 새 PNG를 평가하지 않는다.
- **공식 목표 기본 외형:** B형 갈색 무스탕, 밝은 양털 칼라와 소매, 검은 셔츠·회색 바지·검은 부츠, 틴트 에비에이터 선글라스·수염·올백.
- A형 올리브 블루종은 보존 및 향후 선택 의상. 현재 실제 실행은 **A형**, `outfitPolicy.active='blouson'`, `mustang.ready=false`.
- 단발 리볼버는 **캐릭터 자신의 오른손**으로 꺼내고 조준·반동·정리. 화면상 좌우와 캐릭터 신체 기준을 혼동하지 않는다.
- 1024×1600은 앱 정렬용 **투명 캔버스 권장 크기**일 뿐 캐릭터 종횡비가 아니다. 원본 인물의 신체를 세로로 늘리지 않는다.

## 구현 완료
- A형 7개 상태 관리, Working 미세 손가락 타이핑→7프레임 노트북 닫기→Idle, Drawing→오른손 리볼버 조준, Firing 7프레임 키 포즈/반동/정리→Idle, 기존 쌍권총 CSS 교차 섬광.
- Working 전환 취소, 최근 상태 우선, Reduced Motion 지원, `preview.html` 오프라인 동기화.
- `src/characters/outfit-loader.mjs`: 의상별 프레임 조회, 빈 프레임을 다른 의상으로 대체하지 않음.
- `src/characters/akila.ts`: 준비된 A형만 런타임 등록·활성화, 향후 B형 별도 레지스트리.
- `preview-entry.html`, `src/preview.ts`, `src/preview.css`: B형 미승인 PNG 독립 검수 패널, 후보 선택, 180/240/360px, 격자/밝은/어두운 배경, 머리/발 가이드.
- `scripts/normalize-mustang-idle.py`: Gate 1B의 광륜 알파 정제·1024×1600 투명 패딩. 원본 후보 RGB/체형 보존.
- B형 **정제 PNG도 미승인**: `src/characters/candidates/akila_mustang/idle-gate1b-alpha-cleanup-unapproved.png` (1024×1600, 캐릭터 자체 비균일 스케일 없음).

## 남은 아트/기능
1. **B형 Idle 최종 승인**: 현재 작업 마스터 후보의 얼굴·SD 비례·머리·수염·무스탕·손·부츠 및 투명 경계를 그 **현재 이미지 계열 기준으로** 검수. 과거 두 번째 시트에 비례를 되돌리지 않는다.
2. B형 Smoking, Speaking, Working, Drawing, Firing, Dual Firing의 **의상/체형 일관된 개별 포즈 제작** 및 상태별 정렬. A/B 혼합 금지.
3. B형 전체 상태 QA 후 **실제 B형 기본 활성화**, A형 선택 의상 전환/설정 저장.
4. 실제 테스트/빌드/배포/오류 이벤트 기반 대사·액션 연동: 이벤트 모의실행과 진짜 연동을 반드시 구분.
5. Windows **10/11 실기기**: 투명 항상 위 창, 드래그, 우클릭, 위치 저장, 다중 모니터/크기, 종료.
6. Windows 실행 파일 패키징/배포. 앉기·샷건은 후속 확장.
7. A형 Working 마지막 손정리, Drawing/Firing 꺼내기·정리는 아직 키 포즈 컷; Dual Firing 전신 연결 포즈, Speaking 전용 그림 미완성.

## 검증 / 작업 규칙
- 모든 기존 A형 원본 PNG, 동작, 대사 및 오프라인 HTML 보존.
- `npm ci && npm run build && npm test && npm run preview:export` 재현. 브라우저 Chromium 180/240/360px, Windows Server 빌드 CI 확인.
- 새 B 검수 패널의 크기·배경·가이드·후보 전환 및 **A형 라이브 펫 불변** QA 보완.
- 이미지/아트 시각승인과 CI PASS는 별도. CI 통과만으로 무스탕 에셋 공식 승인하지 않는다.
- 기존 PR #6은 Draft로 유지, 사용자가 승인하기 전 main 병합·배포 금지.

## 다음 단계 권장
현재 최신 무스탕 Idle 후보의 스타일과 비율을 사용자가 승인한 뒤, **그 현행 마스터의 공통 모델/포즈 정렬 규칙**을 기준으로 Smoking·Sitting·Working·오른손 Drawing/Firing·Dual Firing·Speaking 포즈를 확보한다. 초기 시트는 사용하지 않는다. 코드는 기존 의상 로더/미리보기 재사용. 단순 PNG 정렬·알파 검사는 이 채팅에서 직접, 복잡한 로더·상태 전환·패키징은 Codex Terra Medium(필요시 High).
