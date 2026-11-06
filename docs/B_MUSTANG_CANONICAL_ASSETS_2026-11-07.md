# Castle Desktop Pet — B형 무스탕 공식 기본안 9종 (2026-11-07)

> **최고 우선순위: 사용자가 2026-11-07 가장 최근 메시지에 직접 첨부한 아래 9개 이미지.**
> 이전 그림, 시트 02, Gate1B, 오래된 승인 상태보다 **이 9장 각각의 비율·얼굴·의상·구도·소품·그림체가 우선**한다. 다른 이미지를 기준으로 재생성하여 교체하지 않는다.

## 실제 파일 백업

- 개인 ChatGPT 라이브러리: `/Castle Desktop Pet/castle_pet_B_canonical_20261107.zip`
- ZIP SHA-256: `d2f7a6853ef7c1eb8e453678fa502a7b22da872381c8c46d6192ff1c6172a93e`
- 내부 `approved_visual_sources/`: 사용자가 지정한 9개 이미지 **바이너리를 변형하지 않고** 보관. `ASSET_MANIFEST.json`에서 정확한 원래 파일 이름·SHA·크기·상태를 확인.
- **현재 이 문서가 GitHub에 등록되어 있는 것과 PNG/JPEG 바이너리가 GitHub에 등록된 것은 다르다.** 바이너리는 이 커밋에서 GitHub 미등록. 새 채팅/코덱스가 ZIP에서 불러와 개발 브랜치에 원본 그대로 추가하고 해시 검증해야 한다.

## 사용자 지정 기본안 — 정확한 일대일 매핑

| 동작/역할 | 이번 사용자 첨부 원본 | ZIP 내부 파일 | 크기·실제 포맷 | SHA-256 |
|---|---|---|---|---|
| Idle (서 있음) | `1000041374.png` | `idle.png` | 948×1659 PNG RGBA | `42859af6776986e70122ecc908dd8c34fa420056b3811d0f81e6efb0363a0976` |
| Sitting (상자에 앉음) | `1000041381.png` | `sitting.png` | 1003×1568 PNG RGBA | `b15e58f192ff9d69ad943f2a15fe8b6815fc892bb3c4ff62f9ecd85d8f8c36f3` |
| Drawing (리볼버 낮은 조준) | `1000041380.png` | `drawing.png` | 1003×1568 PNG RGBA | `9f80fee63573dfc45802ea1eec75a3eb09e36af3b42e1f1a0ebfb3433855cf96` |
| Firing (단발 사격) | `1000041382.png` | `firing.png` | 1003×1568 PNG RGBA | `4689c13e9fd992cc77d7ced3c94ee181e1fda25d963adca0880b4fdbb716288b` |
| Firing Dynamic (사격 변형) | `1000041386.png` | `firing_dynamic.jpg` | 984×1536 **JPEG RGB** | `182235a157ea96df141fdc14794a715a96720647cabcd4f69de8b1a9f4448c9c` |
| Smoking (흡연) | `1000041387.png` | `smoking.png` | 1003×1568 PNG RGBA | `6ad98b1b5abec2315a7a4e3fbf78e95ebac68136a79f15c3da4a0ad37de0cf5c` |
| Speaking (표정·7컷 시트) | `1000041389.png` | `speaking_reference.jpg` | 1404×1536 **JPEG RGB** | `c91601262eb7c8ec3a8af7c3df904c000d05d8247229855ef2564d62c649c42d` |
| Working (서서 노트북 사용) | `1000041391.png` | `working.png` | 1003×1568 PNG RGBA | `5b437481adf4df8e3e2cc43f3f53af1fc85bc3b9f2fed7b9479d3a2ba0f4d7c4` |
| Dual Firing (양손 사격) | `1000041393.png` | `dual_firing.jpg` | 1024×1536 **JPEG RGB** | `9256480c510ac8b7b1de6a56b64a8a8bec7362e5b5fc4e20faa0afc353c147a7` |

**중요:** `1000041386.png`, `1000041389.png`, `1000041393.png`는 원본 확장자가 PNG처럼 보여도 실제 파일 내부는 JPEG다. ZIP에서는 확장자만 `.jpg`로 바로잡았고, 실제 바이트는 변경하지 않았다.

## 이전 지시의 폐기 / 격하

- 더 이상 `1000041379.png` 또는 그 체크무늬 Sitting을 최종 기본 이미지로 삼지 않는다. **이번 `1000041381.png`가 Sitting 정본**이며 이미 RGBA다. 예전 체크무늬 Sitting 배경 분리 필요성을 새 정본에 적용하지 않는다.
- 예전 Sitting보다 머리가 큰 버전, 서 있거나 앉아 타이핑하는 다른 Working 생성 이미지, 재생성한 Dual Firing 후보를 **이번 공식 9개 대신 쓰지 않는다**.
- `design/references/akila-sheet-02.png`는 미제작 포즈의 설정·외형 확인용 **보조 참고 자료**다. 현재 사용자 선택한 9개 이미지를 시트 02의 비율에 강제로 맞추지 않는다.
- `idle-gate1b-alpha-cleanup-unapproved.png`는 과거 기술 정제본·이력용일 뿐 새 동작의 신체 비율 기준이 아니다.
- 캐릭터 설정: 이마 **흉터 없음**(자연스러운 미간 주름은 허용), 평상시 홀스터 없음, B형 갈색 무스탕+양털+검은 무지 티셔츠+중립 회색 바지+검은 부츠. A형 블루종은 검은 칼라 셔츠+청회색 바지로 별도 보존.
- **이미지 생성 재해석 금지.** 새로운 프레임은 해당 포즈 정본을 기준으로 최소한만 변경. 원본에 대한 기술 정제 작업은 복제본에서 수행한다.

## 개발과 QA 방침

1. 승인된 **9개 소스 이미지**를 읽기 전용 원본 보존 위치에 등록하고 SHA-256 대조. 새 캐릭터 그리기 금지.
2. 원본과 별도 처리 PNG를 분리하고 알파 검사를 수행. 이번 **Sitting은 RGBA**이며 '체크무늬 제거가 필요하다'고 추정하지 말 것. 3개 JPEG(사격 변형/표정 시트/듀얼)는 배경 분리/프레임 추출 후보를 별도로 제작한다.
3. `180/240/360px`에서 얼굴, 발·머리 기준선, 계단 현상, 광륜, 무기·섬광 클리핑을 점검한다.
4. B형 **Drawing → Firing → Idle** 상태 전환 중간 프레임부터 제작. 이후 Working·Dual·Speaking 등 각 승인 기준의 연속 프레임 제작.
5. A형 실제 앱 기능·의상 로더·미리보기·테스트·Windows 패키징 가능성 유지. B형 전체 프레임 및 QA 승인 전 A/B 동작 혼합·B 런타임 활성화 금지.
6. PR #6은 **Draft**, 사용자 명시 지시 전 main 병합·배포 금지.

**승인 범위: 이 9장의 '아트 기본안' 확정. 알파, 애니메이션, Windows 실행 파일의 완성/검증 완료 선언이 아님.**
