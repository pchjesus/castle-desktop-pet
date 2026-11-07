# Windows QA 포터블 검수

GitHub Actions의 Windows build and export smoke가 만드는 `castle-pet-windows-qa-unapproved` 아티팩트를 다운로드하고 전체 폴더를 압축 해제한다. `CastlePetQA/electron.exe`를 실행한다. 서버는 필요 없으며 기본 펫은 A형이다. 우클릭 → B형 진단 검수에서 미승인 키포즈 팩을 열어 크기, 배경, 반복, 취소, Reduced Motion을 확인한다. 진단 개발자 도구에서 오류를 확인할 수 있고 `%APPDATA%/castle-desktop-pet/qa.log`에 로딩 오류를 기록한다.

필수 수동 검사: Windows 10/11에서 투명 창, 항상 위, 드래그, 위치 저장/복구, 다중 모니터, 메뉴 및 종료, A형 대사·동작, B형 180/240/360px·마스크·얼굴과 발 정렬. SmartScreen/바이러스 검사 및 코드 서명은 별도이며 이 아티팩트는 정식 배포/설치 파일이 아니다. 원본 에셋 시각 승인도 아니다.

CI는 파일 구성을 검증하고 `--qa-smoke --qa-report <경로>`로 실행해 A형과 B형 검수 이미지의 로딩을 확인한다. 이 검사는 GUI의 자연스러운 동작이나 실제 데스크톱 입력 검증을 대체하지 않는다. 패키지는 릴리스에 게시하지 않고 Actions 아티팩트로만 보관한다.
