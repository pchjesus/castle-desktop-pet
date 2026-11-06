# Castle Desktop Pet — B형 포즈 시각 승인 기록 (2026-11-06)

## 사용자 승인 상태

| 포즈 | 상태 | 판단 |
|---|---|---|
| Idle (무스탕 서 있음) | 사용자 기준 이미지 보존·머리/이마 조정 | 기존 기준 외형 유지. 앱용 최종 알파/정렬 검증은 별도 |
| Sitting (상자에 앉음) | **조건부 수용** | 사용자: "앉아있을 때 머리가 약간 큰 것 같긴한데.. 그래도 괜찮다." 현재 포즈 유지 가능하지만 후속 비교 QA 시 머리 비율 점검 |
| Smoking (서서 흡연) | **시각 승인 확정** | 사용자: "담배 피는 그림은 확실히 좋아. 이건 확정해도 될 듯". 후속 제작 시 이 포즈의 체형·얼굴·복장·작화 참고 가능. 임의 재생성/비례 변경 금지 |
| Working/Draw/Firing/Dual/Speaking | 미제작/미승인 | 기존 A형 구현 보존, B형 포즈 별도 제작 |

## 정확한 승인 원본 식별

이 승인 기록은 **최근 만들어진 Smoking·Sitting 두 장(2026-11-06 마지막 생성 결과)**을 가리킨다. 더 이전의 `akila_B_smoking_no_scar_no_holster_unapproved_1024x1600.png` 또는 이전 Sitting 추출·정제 후보와 **혼동하지 말 것**.

- Smoking 시각 승인 원본: `akila_B_smoking_VISUAL_APPROVED_original.png`; **1003×1568 RGBA**, SHA-256 `6ad98b1b5abec2315a7a4e3fbf78e95ebac68136a79f15c3da4a0ad37de0cf5c`.
- Sitting 조건부 수용 원본: `akila_B_sitting_CONDITIONALLY_ACCEPTED_original.png`; **1003×1568 RGBA**, SHA-256 `f6848467c7b215c67dd8722705e5b7172a8e7002341ede14f4fc4f4e5defb203`.
- Smoking RGB를 유지하며 알파·잔여 점만 보정한 *기술 후보*: `akila_B_smoking_alpha_cleanup_candidate.png`; SHA-256 `65bdfef23931f49420c066600778cd160078bad5a04b3e01e9ac4062c4550d2c`. **이 후보 자체는 미승인**.
- 승인 원본 두 장의 이미지는 **현재 채팅에서 생성·별도 다운로드 패키지로 보관**하였으며, **이 커밋에서는 GitHub에 PNG 바이너리를 업로드하지 못함**. GitHub의 동일 이름 PNG 파일이 존재한다고 주장하지 말 것. 후속 담당자는 패키지 원본을 저장소에 추가하며 위 SHA를 검증해야 한다.

## 공식 디자인 계약 및 제한

- 상위 기준 시트는 [akila-sheet-02.png](../design/references/akila-sheet-02.png). B형 무스탕은 **갈색 양털 재킷 + 검은 무지 티셔츠 + 중립 회색 바지**, A형 블루종은 **검은 칼라 셔츠 + 청회색 바지**.
- 기본 얼굴 **이마 흉터 없음**, 평상시 **권총 홀스터 없음**. Idle 이마에 짙은 음영 패치 금지.
- 기존 원본 비율 보존, 1024×1600은 투명 정렬 캔버스일 뿐 신체 비율 규격이 아님.
- **시각 승인 ≠ 알파 품질 승인 ≠ 앱 통합/릴리스 승인**. Smoking은 육안 외형 승인, PNG 내부의 알파 경계·180/240/360px·동작 연결 검증은 남아 있다.
- B형 의상별 독립 프레임 준비 전에는 A형 런타임 유지. PR #6 Draft, main 병합/배포 금지.

## 다음 작업

1. 승인 원본 PNG의 실제 GitHub 등록과 SHA 검증(가능한 경로 확보 후 수행).
2. Sitting의 머리 비율과 Idle/Smoking 대비 실물 실루엣 QA. 사용자가 괜찮다고 한 원본을 자동 폐기하지 않음.
3. **B형 Working**(노트북 등장·타이핑·닫기·Idle 복귀)을 다음 포즈 후보로 제작할 때, Smoking·Idle과 같은 머리/어깨/몸통/다리 비율을 보존하고 코드 통합은 포즈 준비 후 진행.
