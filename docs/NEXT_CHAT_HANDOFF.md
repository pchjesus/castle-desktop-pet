## 2026-11-06 최신 포즈 승인 현황

- Smoking: **사용자 시각 승인** (마지막 결과 이미지, SHA-256 `6ad98b1b5abec2315a7a4e3fbf78e95ebac68136a79f15c3da4a0ad37de0cf5c`). Smoking의 PNG 바이너리는 현재 채팅에서 보존, **GitHub 미등록**. [기록](B_MUSTANG_ART_APPROVAL_2026-11-06.md).
- Sitting: **조건부 수용**. '머리가 약간 큼' 피드백 보존. SHA-256 `f6848467c7b215c67dd8722705e5b7172a8e7002341ede14f4fc4f4e5defb203`.
- 이미지 시각 승인만 완료됨. 알파 QA, 저장소 파일 추가, 런타임 B 전환 및 Windows GUI/EXE 테스트는 미완료.
- B형 의상 **검은 티셔츠+회색 바지**, A형 의상 **검은 셔츠+청회색 바지**, 이마 흉터/평상시 홀스터 없음.
- 다음 작업: 승인된 Smoking/Idle 비율을 기준으로 **Working 포즈** 제작 후 별도 검수. PR #6 Draft, main 병합 금지.

---

# CASTLE PET — 공식 B형 디자인 시트 02 최상위 기준 (2026-11-06 재정정)

**사용자 최종 지시: [`design/references/akila-sheet-02.png`](../design/references/akila-sheet-02.png)에 나온 B형 갈색 무스탕 아킬라가 절대적인 시각 기준이다.** 이 사진은 이미 GitHub에 원본 시트로 등록되어 있으며, 사용자가 다시 같은 구성을 첨부해 지정했다.

**반드시 참고:** [`docs/AKILA_CANONICAL_SHEET_02.md`](AKILA_CANONICAL_SHEET_02.md). 상단 중앙의 큰 **B형 서 있는 전신**에서 머리·몸통·다리·손·부츠의 실루엣, 전체 비례, 선글라스·수염·양털·재킷을 유지한다. 왼쪽 큰 B형 앉은 전신을 Sitting 기준으로 사용한다. 우측 미니 턴어라운드의 더 짧은 SD 체형을 확대하지 않는다.

**이전 지침 폐기:** '초기 시트 01·02는 퇴역', 'Gate1B 기술 정제본이 후속 이미지의 신체 비율 기준', '원본 시트로 되돌리지 말라'는 오래된 원칙은 잘못된 지침이며 **전면 무효**다. 후보 PNG가 시트 02와 다르면 후보를 고쳐야 한다. 시트를 후보에 맞추지 말 것.

**이미지 제작:** 원본 시트의 B형 전신을 비율 변경 없이 추출·배경 분리한다. 시트에서 큰 서 있는 B형은 오른손에 리볼버가 있으므로, 무기 없는 Idle 손은 별도 정리한다. 1024×1600은 투명 정렬 캔버스 규격일 뿐 인물 비율이 아니다. 임의 재생성/머리 확대/다리 축소/비균일 스케일링 금지. 사용자 시각 승인 전 모든 B 신규 PNG는 미승인으로 분리 보관한다.

**런타임·GitHub 제한:** 기존 A형 실제 런타임 및 모든 동작 보존, B형 아트 충분히 제작 전 혼합 금지, PR #6 Draft 유지, main 병합/배포 금지.


---
# Castle Desktop Pet — 다음 채팅 인수인계 (2026-11-06)

## 현재 기준
- GitHub: `pchjesus/castle-desktop-pet`
- 개발 브랜치: `feat/v0.3c-action-pack`, PR [#6](https://github.com/pchjesus/castle-desktop-pet/pull/6) **Draft**
- `main` 초기 기준: `4f5804eba752461a1088d613e93ef92c582f6100`; **병합 금지**
- 최신 HEAD는 작업 시작 전 GitHub에서 다시 확인한다.
- 기술: Windows Electron + Vite + TypeScript, 단일 오프라인 `preview.html` 유지.

## 확정된 제품 / 아트
- **공식 최상위 디자인 기준:** `design/references/akila-sheet-02.png`의 큰 B형 서 있는/앉은 전신. 후보 `idle-gate1b-alpha-cleanup-unapproved.png`는 비율이 달라 **탈락한 기술 정제 이력**이며 시각 기준이 아니다.
- **공식 목표 기본 외형:** B형 갈색 무스탕, 밝은 양털 칼라와 소매, **검은 무지 티셔츠**·회색 바지·검은 부츠, 틴트 에비에이터 선글라스·수염·올백.
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
1. **B형 Idle 제작·최종 승인**: 시트 02의 큰 B형 서 있는 전신과 얼굴·머리·수염·무스탕·손·부츠 및 **원본 신체 비율**을 일치시키고, 리볼버 없는 중립 Idle 손을 제작한다. 시트 원본 추출본의 배경·주변 인물 제거 및 투명 알파를 별도 검수한다.
2. B형 Smoking, Sitting(앉은 자세), Speaking, Working, Drawing, Firing, Dual Firing의 **의상/체형 일관된 개별 포즈 제작** 및 상태별 정렬. A/B 혼합 금지.
3. B형 전체 상태 QA 후 **실제 B형 기본 활성화**, A형 선택 의상 전환/설정 저장.
4. 실제 테스트/빌드/배포/오류 이벤트 기반 대사·액션 연동: 이벤트 모의실행과 진짜 연동을 반드시 구분.
5. Windows **10/11 실기기**: 투명 항상 위 창, 드래그, 우클릭, 위치 저장, 다중 모니터/크기, 종료.
6. Windows 실행 파일 패키징/배포. Sitting은 포즈 제작 범위에 포함하고, 샷건은 후속 확장.
7. A형 Working 마지막 손정리, Drawing/Firing 꺼내기·정리는 아직 키 포즈 컷; Dual Firing 전신 연결 포즈, Speaking 전용 그림 미완성.

## 검증 / 작업 규칙
- 모든 기존 A형 원본 PNG, 동작, 대사 및 오프라인 HTML 보존.
- `npm ci && npm run build && npm test && npm run preview:export` 재현. 브라우저 Chromium 180/240/360px, Windows Server 빌드 CI 확인.
- 새 B 검수 패널의 크기·배경·가이드·후보 전환 및 **A형 라이브 펫 불변** QA 보완.
- 이미지/아트 시각승인과 CI PASS는 별도. CI 통과만으로 무스탕 에셋 공식 승인하지 않는다.
- 기존 PR #6은 Draft로 유지, 사용자가 승인하기 전 main 병합·배포 금지.

## 다음 단계 권장
시트 02의 큰 B형 무스탕 전신을 기준으로 새 Idle을 제작·시각 승인받은 뒤, **시트 02에서 확인되는 원본 비율과 선화**를 기준으로 Smoking·Sitting·Working·오른손 Drawing/Firing·Dual Firing·Speaking 포즈를 확보한다. 시트 02의 큰 B형 전신 비율을 상위 기준으로 사용한다. 코드는 기존 의상 로더/미리보기 재사용. 단순 PNG 정렬·알파 검사는 이 채팅에서 직접, 복잡한 로더·상태 전환·패키징은 Codex Terra Medium(필요시 High).
