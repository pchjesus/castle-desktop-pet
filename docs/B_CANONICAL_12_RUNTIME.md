# B-CANONICAL-12 승인 이미지팩

사용자 승인에 따라 B-11 `speaking-01`~`07` 및 `firing_dynamic.png`를 변경 없이 B형 런타임에 등록한다. Speaking의 승인 Idle 대비 얼굴 아래 신체 픽셀 차이는 알려진 특성이며, 사용자 승인을 무효화하거나 이미지를 대체할 근거가 아니다. 공식 원본 9종과 기존 승인 이미지는 유지한다. 원본 B-11 Dual Firing은 미승인이며, 실제 Dual Firing은 리볼버 탄피를 제거한 별도 승인본을 유지한다.

Speaking은 7컷을 500ms 간격으로 한 번 재생하고 Idle로 돌아간다. Idle 또는 다른 포즈를 선택하면 현재 재생을 중단한다. Reduced Motion에서는 첫 컷을 1초 표시하고 Idle로 돌아간다. Firing Dynamic은 1.5초, Dual Firing은 기존 2.4초 뒤 Idle로 돌아간다. Idle·Smoking·Working·Drawing·Sitting은 사용자가 다른 포즈를 선택할 때까지 유지한다. 같은 포즈를 중복 선택해도 타이머가 중첩되지 않는다.

모든 9개 포즈는 우클릭 메뉴에 표시된다. 기존 진단 이미지와 사용자 기록도 유지한다. QA와 사용자 승인은 릴리스·main 병합 승인이 아니다. 실제 Windows의 투명 클릭 통과, 드래그, 창·메뉴, 크기 조절은 Windows smoke 및 실기기 확인이 필요하다.

로컬 검증: 빌드, Node 테스트, 공식 원본 9종 SHA-256과 B-11 승인 파일 해시 확인, 브라우저 실재생에서 Speaking 7컷 순서·각 이미지 SHA·Idle 복귀·중단·Reduced Motion, Firing Dynamic 및 기존 Dual Firing 종료를 검사한다. 검수 화면의 기존 원본/이전 후보 비교도 유지한다. 기존 B-11 보고서에서 기록한 신체 픽셀 차이는 사용자에게 알려진 승인 특성이다.

Windows smoke에 Speaking과 Firing Dynamic 로딩을 추가했으나 이 Linux 환경에서 실행하지 않았다. PR #11과 브랜치 참조 일치는 Git으로 확인 가능하지만 GitHub API 403으로 원격 Windows CI 결과는 확인할 수 없다. 실제 Windows의 투명 영역 입력과 창 동작은 별도 확인이 필요하다.
