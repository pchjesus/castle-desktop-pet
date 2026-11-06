# Akila v0.3C — 단발 리볼버 액션 구현 기록

## 범위

이번 구현은 **실제 대상을 겨누거나 피격을 묘사하지 않는 데스크톱 펫의 캐릭터 액션**이다.
한 손의 **리볼버 1정**만 사용한다. 쌍권총 상태(`dual_firing`)와 캐릭터의
Idle·Smoking·Working 및 원본 PNG는 그대로 보존한다.

## 이미지 제작 규칙

- 원본: `src/characters/derived/akila/{idle,drawing,firing}/`의 기존 승인 포즈
- 결과: `src/characters/derived/akila/revolver_action/000.png` ~ `006.png`
- 1024 × 1600 RGBA, 발 기준선·눈·선글라스·수염·담배 및 재킷 유지
- `scripts/generate-revolver-action.py`가 고정 SHA를 검사하며 프레임을 재현
- 사격 반동만 **기존 조준 그림의 오른쪽 팔·권총 영역을 국소 이동**해 생성
- 원본을 덮어쓰거나 새 대상·배경·무기를 추가하지 않는다

| 프레임 | 역할 | 원본 연계 |
|---|---|---|
| 000 | Idle | 승인 Idle |
| 001 | 허리에서 리볼버 꺼내기 | 승인 Drawing/000 |
| 002 | 오른쪽 조준 | 승인 Firing/000 |
| 003 | 작은 반동 | Firing/000의 국소 이동 |
| 004 | 조준 복귀 | 승인 Firing/000 |
| 005 | 허리 쪽 총 정리 | 승인 Drawing/000 |
| 006 | Idle 복귀 | 승인 Idle |

**시각적 한계:** 큰 자세 변화(허리→조준, 조준→허리)는 아직
정교한 중간 팔·손 관절 그림이 아닌 **키 포즈 전환**이다.
전용 연결 포즈를 제작하기 전에는 ‘완전한 자연스러운 액션’이라고 평가하지 않는다.

## UI·상태 전환

- **Drawing:** Idle → 꺼내기 → 조준 후 유지
- **Firing (일반):** 7개 키 포즈를 각 190ms씩 재생한 후 Idle 복귀
- **Drawing 조준 완료 → Firing:** 불필요한 재꺼내기를 건너뛰고 조준→반동→정리→Idle
- **Drawing 중간 → Firing:** 아직 조준을 마치지 않았으므로 전체 시퀀스 재생
- **다른 상태 요청:** 현재 사격 타이머를 취소하며 취소된 동작의 Idle 복귀 이벤트는 발생시키지 않음
- **Reduced Motion:** 조준 정지 화면을 표시한 뒤 Idle 복귀, 발사 섬광 비활성화
- 기존 CSS 총구 섬광은 프레임 003의 반동 타이밍에 맞춰 짧게 표시하고,
  전신 회전으로 반동을 중복 표현하지 않는다
- 기존 Working 타이핑/노트북 닫기·오프라인 `preview.html`을 유지한다

## 검증 기준

`npm ci`, `npm run build`, `npm test`, `npm run preview:export` 및
GitHub Actions의 Windows 빌드, Chromium 180/240/360px 테스트로 검증한다.
자동 테스트 통과는 **Windows 10/11 실제 투명 바탕화면 실행**이나
시각적 관절 포즈 완성 판정과 다르다.

수동 시각 검토용 원본 7장과 비교 시트는 GitHub Actions
**Revolver action pose builder** 아티팩트에서 내려받을 수 있다.

**프로젝트 상태:** PR #6은 여전히 Draft. Issue #7의 미완성 전용 중간 포즈와
Windows 실제 GUI 검증이 끝나기 전에는 main으로 병합하지 않는다.
