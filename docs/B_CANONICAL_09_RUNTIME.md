> 현재 상태: Dual Firing은 리볼버 측 탄피 제거본을 사용자 요청에 따라 실제 포즈로 등록했다. `DUAL_FIRING_CASINGS.md` 참조. 나머지 내용은 B-09 당시 기록이다.

# B-CANONICAL-09 — 승인 이미지 런타임 등록

사용자 승인에 따라 B형 Idle·Smoking은 `proportions-v07`, Sitting은 `proportions-v08`의 원본과 분리된 파생 이미지를 기본 펫과 해당 포즈 전환에 등록했다. 바이트와 SHA-256은 `src/characters/candidates/b-mustang-20261107/approved-runtime.json`에 기록했다. 공식 B 원본 9종과 해시는 유지한다. Drawing·Firing·Working은 기존 v04이며 Dual Firing·Firing Dynamic·Speaking은 승인되지 않았고 펫 동작으로 대체하지 않는다. B-07 Sitting은 미승인 상태로 비교용만 유지한다. `mustang.ready=false`는 전체 포즈팩의 완성 승인이 아니라는 기존 정책이다.

기존 비교 화면은 07 Idle/Smoking과 08 Sitting을 사용자 승인으로 표시하며 04 동작팩 화면은 이전 진단 이미지임을 표시한다. 크기가 다른 PNG를 그대로 사용하므로 실제 Windows에서 발 위치·투명 영역·메뉴·드래그·크기별 시각 확인이 필요하다. 리팩터링은 보류한다. 세 승인 상태의 등록과 검증을 추가하고 기존 창·입력 경로는 유지했다.

검증: 빌드 및 Node 테스트 45개, 공식 원본 9종 SHA-256, 승인 파생 이미지 3종 SHA-256, 브라우저 검수 QA 79개와 180/240/360 비교·승인 표시 QA 통과. 브라우저는 실제 표시 이미지의 해시도 확인한다. Windows smoke에 세 포즈 확인을 추가했으나 이 Linux 환경에서는 실행하지 못했다. Electron 실행은 샌드박스 헬퍼 권한 문제로 시작하지 못했으며 Windows 투명 영역 통과·드래그·메뉴 및 패키징된 EXE 실동작은 미검증이다. 원격 CI 확인은 GitHub API 접근 차단 해소 후 수행한다.
