# B-CANONICAL-03 기술 후보 QA

원본 9종을 읽기 전용으로 보존한다. 기존 CANONICAL-02 후보를 유지하고 `action-pack/`에 추가 후보를 생성한다. `scripts/prepare-b-action-pack.py`는 기존 Pillow/NumPy/SciPy와 OpenCV 4.11.0 GrabCut을 사용한다. 의존성은 `scripts/b-canonical-requirements.txt`에 고정한다. RNG seed 0, 단일 thread, 5회 반복이며 중앙 몸통을 전경으로 보호한다. 마스크·불확실 경계와 SHA/변환 행렬은 매니페스트에 남긴다.

PNG는 투명 RGB 정리 후 정상 알파를 보존한 등비 변환만 적용한다. 전신 8종은 전체 실루엣을 1024×1600, 발 기준선 1560에 맞췄다. Sitting도 별도 인체 변형 없이 전체 실루엣 기준이다. 따라서 앉은 포즈의 얼굴 크기가 커지는 문제는 남아 있다. 자동 얼굴 기준 정렬은 완료되지 않았다.

JPEG: Firing Dynamic은 경계·섬광과 다리 사이 배경 잔여를 검토해야 한다. Dual Firing은 GrabCut이 그라데이션 배경을 크게 포함해 blocked다. Speaking은 상단 7개만 크롭하고 경계 연결 어두운 배경을 제거했으며 목/셔츠 보호 영역을 적용했다. 안티앨리어싱·검은 가장자리와 손실 여부 검수가 필요하다. 전신 합성은 하지 않는다.

동작은 승인 키포즈의 시간 순서 표시이며 인체 보간이나 새로운 팔 동작이 아니다. Working/Smoking/Dual/Sitting/Firing Dynamic은 정지 포즈 유지 후 idle, Speaking은 얼굴 루프다. 단일 타이머의 취소·일시정지·비활성 화면·reduced motion을 지원한다. 기술 재생 통과와 사용자 시각 승인을 구분한다.

연락 시트: `src/characters/candidates/b-mustang-20261107/action-pack/contact-sheet.jpg`. 브라우저 산출물은 `artifacts/visual-qa/`, 직접 file 오프라인 결과는 `artifacts/offline-qa/`에 생성한다. CI에서 이 자료와 `preview-offline.zip`을 업로드한다. 원본 검증·동작팩 해시·변환·시퀀서 테스트가 npm test에 포함된다.

로컬 검증 중 실제 Chromium에서 DOM 초기화 시점·상대 이미지 경로와 Window 타이머 바인딩 문제가 발견되어 수정했다. 직접 file://는 조직 정책 `ERR_BLOCKED_BY_ADMINISTRATOR`로 차단된다. 로컬 HTTP 렌더링과 별개로 직접 파일 오프라인 승인은 남아 있다. ZIP은 CRC 검증한다.

통합 파이프라인: `python scripts/prepare-b-canonical.py --action-pack`으로 기존 02 산출물을 유지·재생성한 뒤 새 pack을 생성한다. 새 pack만 재생성하려면 `python scripts/prepare-b-action-pack.py`. 동일 환경에서 두 번 실행한 매니페스트와 SHA가 일치했다. HTTP Chromium QA는 43개 검사와 3가지 크기의 A/B 스크린샷이 통과했다. 이 결과는 아트 승인이 아니다. 직접 file://는 별도 정책 차단으로 미검증이며 Windows CI 상태는 API 권한 부족으로 확인하지 못했다.

최종 B 전용 HTTP Chromium QA는 180/240/360px 사격→idle, 7개 동작의 실행·취소, 얼굴 반복의 일시정지와 Reduced Motion을 통과했다. 상세 보고 `artifacts/b-action-qa/report.json`, 화면 `firing-180.png`, `firing-240.png`, `firing-360.png`. HTTP 전체 QA도 43개 통과. file:// 직접 실행은 정책 차단이며 우회하지 않았다. HTML은 약 64KB, ZIP은 약 60MB로 이미지 바이트를 유지하면서 전체 인라인 중복을 제거했다. 이 수치는 처리 후보에 따라 변할 수 있다.
