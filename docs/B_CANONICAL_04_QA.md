# B-CANONICAL-04 후보 검수와 Windows QA

최신 공식 원본 SHA는 계속 고정하며 A형 런타임을 유지한다. 이전 action-pack은 보존하고 `action-pack-v04`만 새로 만든다. 사용한 다각형과 좌표는 `scripts/b04-regions.json`에 저장한다. 수동 영역은 승인된 정확한 외곽선이 아니며 비교 자료로 확인해야 한다.

## 기술 후보
- PNG 여섯 장: alpha=0 RGB 정리, 알파 1~24의 적색 외곽 중 정상 고알파 픽셀과 4px 이내인 RGB만 보정. 알파를 이진화하거나 255로 강제하지 않는다. Firing 화염은 이 색상 보정에서 제외한다. 색상 보정 픽셀 수를 기록한다.
- JPEG: 기존 GrabCut에 전경 보호·배경 제외 다각형과 Dual의 넓은 외곽 허용 영역을 더한다. 수정 가능한 mask, seeds, uncertainty를 별도 출력한다. Dual은 양쪽 섬광을 다시 보존했지만 다리 사이/외곽 그라데이션 잔여와 손실 가능성 때문에 blocked다. Dynamic도 다리 사이 배경과 섬광 경계가 남아 needs_visual_review다.
- Speaking: 7개 상단 얼굴만 추출하며 목/셔츠 보호 영역을 줄여 직사각형 배경 잔여를 완화했다. 머리카락의 거친 경계와 아래 크롭/안티앨리어싱은 needs_visual_review다. 전신 합성은 하지 않는다.

## 정렬
1024×1600 투명 캔버스와 발 기준선 1560을 유지한다. Idle의 수동 추정 머리 너비를 기준으로 Sitting의 상대 크기를 낮춘다. 원본의 x/y 비율은 동일하다. 다른 서 있는 포즈의 눈·어깨·머리·발 좌표도 각기 기록하지만 아직 정밀한 랜드마크 승인은 아니다. 큰 무기와 화염이 캔버스에 들어가야 하므로 머리 크기와 눈높이를 모두 일치시킬 수 없는 포즈는 차이를 유지한다. 원본 좌표에 가이드를 그린 보고서를 검수한다.

## 동작
B 독립 화면은 04 후보를 사용하고 정제/03/04 버전 비교를 제공한다. 포즈 전환에 짧은 페이드, 사격에 미세한 반동을 적용한다. Working은 발을 기준으로 아주 미세한 자세 변화이며 손가락 타이핑이 아니다. Smoking은 기존 연기 영역을 낮은 불투명도로 겹친 움직임과 담배 끝의 작은 빛을 표시한다. 모든 효과는 전환·취소·비활성·Reduced Motion 때 정리한다. 팔/손/총/노트북을 접는 실제 중간 포즈는 없으며 키포즈 전환으로 표시한다. Sitting은 독립 정지 포즈 후 Idle 키포즈 전환이다.

## 재현 및 자료
`python scripts/prepare-b-action-pack.py --config scripts/b04-regions.json --output src/characters/candidates/b-mustang-20261107/action-pack-v04`

의존성은 기존 `scripts/b-canonical-requirements.txt`. 보고서는 `python scripts/report-b04.py`로 `artifacts/b04-review/`에 생성한다. 전체 전후 비교, 3개 배경 PNG, Idle/Drawing/Firing, Idle/Sitting, JPEG 원본/마스크/결과, Speaking 및 원본 랜드마크 시트를 포함한다. 로컬과 CI의 Pillow 등 버전이 다르면 PNG 인코딩 해시가 다를 수 있으므로 같은 고정 환경에서의 재현성과 원본 해시를 구분한다.

## Windows 검수
기존 Electron 잠금 버전의 Windows 런타임을 복사하는 무설치 QA 폴더를 CI에서 생성한다. 추가 패키징 의존성은 없다. 파일 구조와 자동 시작·A/B 이미지 로딩 smoke를 수행하고 Actions 아티팩트로만 업로드한다. 실제 Windows GUI 입력/다중 모니터의 검증은 별도다. [사용 절차](WINDOWS_QA_PACKAGE.md).

수동 마스크 수정은 출력의 `<동작>-mask.png`를 별도 디렉터리에 복사해 원본 크기 그대로 그레이스케일 편집하고, 재생성 시 `--mask-overrides <디렉터리>`로 적용한다. 흰색은 전경, 검정은 배경, 중간값은 부분 투명이다. 원본 이미지나 출력 디렉터리 자체를 입력 마스크로 덮어쓰기하지 않는다. 기본 다각형 보정은 재현 가능한 시드이며 정확한 손/털/섬광 경계 보정의 대체물이 아니다.

## 이번 로컬 검증
- Pillow 11.3.0 / NumPy 2.2.6 / SciPy 1.15.3 / OpenCV 4.11.0 고정 환경에서 04 후보를 두 번 생성한 매니페스트와 이미지 SHA가 일치했다.
- npm ci, build, 전체 테스트 34개, preview:package 및 ZIP CRC 검증을 수행했다. 공식 9종 SHA도 일치했다.
- HTTP Chromium 전체 QA 43개 및 B 전용 180/240/360px 완주·동작별 취소·일시정지·Reduced Motion과 연기 레이어 정리가 통과했다. 대표 화면은 `artifacts/b-action-qa/`, 비교 시트는 `artifacts/b04-review/`에 저장한다. 이는 사용자 시각 승인이 아니다.
- 직접 file://는 이 환경의 조직 정책 때문에 차단되어 우회하지 않는다. Windows 실행·포터블 패키지 생성은 Windows CI 전용이며 로컬 Linux에서 실제 Windows 실행 검증을 하지 않았다. 원격 CI/API가 Forbidden인 동안 CI 성공이나 아티팩트 존재를 확인했다고 보고하지 않는다.
- 후보는 전부 needs_visual_review이며 Dual은 blocked다. Sitting 머리 너비는 수동 추정 기준으로 맞췄으나 눈높이·어깨/착지의 정밀 승인은 남아 있다. Dynamic의 다리 사이 배경, Dual의 경계/배경, Speaking의 머리카락/크롭 및 PNG 저알파 가장자리는 수동 확인이 필요하다.

브라우저 QA의 프레임 로딩 확인은 준비 상태와 크기를 한 번의 브라우저 평가로 읽도록 수정했다. 기존 두 번의 평가 사이에서 애니메이션이 다음 src로 넘어가 크기가 0이 되는 경쟁 조건을 제거한 것이며, 이미지 로딩/크기 및 섬광·종료 검사는 유지한다.

최종 원자적 로딩 검사로 재실행한 HTTP Chromium 전체 QA는 43개 통과했다. 각 B 동작은 대표 프레임 저장 후 정상 Idle 복귀와 재실행·취소를 확인했으며 연기 임시 레이어가 취소 뒤 남지 않았다. 최종 오프라인 ZIP의 CRC도 일치한다. Windows 패키지는 아직 로컬에서 실행한 결과가 아니라 CI 패키징/시작 검증 코드가 준비된 상태다.
