# Castle Desktop Pet

> **B형 공식 디자인 원본:** [AKIRA 전체 디자인 시트 02](design/references/akila-sheet-02.png). 상단 중앙의 **갈색 무스탕 서 있는 큰 전신**과 왼쪽의 **앉은 큰 전신**이 비율·외형의 최상위 기준이다. [시트 02 개발 계약](docs/AKILA_CANONICAL_SHEET_02.md) 참고. 이전 Gate1B 정제 PNG는 미승인 이력이며 새로운 포즈의 체형 기준이 아니다.

Windows 10/11용 아킬라 데스크톱 펫입니다. Electron 앱은 투명한 항상 위 창, 드래그, 위치 저장 및 복구, 크기와 종료 메뉴를 제공합니다.

## 개발

Node.js 22 이상에서 다음을 실행합니다.

```sh
npm ci
npm run build
npm test
npm start
```

`npm start`는 빌드 후 Electron을 실행합니다. 우클릭 메뉴에서 크기를 설정하거나 종료합니다. 위치는 Electron 사용자 데이터 디렉터리에 저장됩니다. `npm run dev`는 렌더러 확인용 Vite 서버입니다.

**최근 인수인계(2026-11-07):** [NEXT_CHAT_HANDOFF.md](docs/NEXT_CHAT_HANDOFF.md)에 B형 무스탕 포즈별 사용자 승인, 미승인 알파 정제, 사용자 라이브러리 자산 ZIP 및 향후 상태 전환 QA 순서를 기록했다. 이 문서가 기존 B형 Gate1B 지침보다 우선한다.

## 오프라인 미리보기

`npm run preview:export`로 단일 `preview.html`을 생성합니다. 브라우저에서 상태·크기·대사·드래그, 원본과 정렬본의 프레임 비교 및 속도를 확인할 수 있습니다. Windows 창 자체의 검증을 대체하지 않습니다.

앱은 `src/characters/derived/akila`의 **A형 정렬 PNG**를 사용하며 `src/characters/assets/akila`의 원본을 보존합니다. Idle은 호흡과 간헐적 흡연 효과를 표시하고 Smoking은 흡연 효과를 반복합니다. Working은 승인된 원본에서 파생한 손가락 미세 타이핑 루프와 7프레임 노트북 닫기·Idle 복귀를 제공합니다. Drawing은 리볼버 꺼내기→조준 포즈를 유지하고, Firing은 7프레임 꺼내기·조준·국소 반동·정리 후 Idle로 돌아갑니다. Dual Firing은 고정 양손 조준 PNG와 교차 섬광·반동을 표시한 뒤 Idle로 복귀합니다.

**시각적 한계:** Working의 마지막 손 정리와 Drawing/Firing에서 팔을 꺼내거나 집어넣는 과정은 아직 부드러운 관절별 중간 그림이 아닌 키 포즈 전환입니다. Dual Firing도 전용 꺼내기·정리 포즈가 없습니다. Speaking은 별도 그림이 없어 플레이스홀더입니다. CI/Chromium 통과는 Windows 10/11 실제 투명 창·다중 모니터 실기기 검증이나 모든 동작의 시각적 완성을 뜻하지 않습니다. 자세한 사항은 [제품 명세](docs/PRODUCT_SPEC.md)와 [리볼버 액션 기록](docs/REVOLVER_ACTION_V03C.md)을 참조하세요.

공식 기본 디자인의 목표는 B형 무스탕입니다. 아직 B형 전체 상태가 준비되지 않아 실행은 A형을 유지합니다. 기준과 전환 조건은 [디자인 기준](docs/CHARACTER_DESIGN_B_MUSTANG.md)과 [에셋 전환 계획](docs/ASSET_MIGRATION_PLAN.md)을 참조하세요.

오프라인 미리보기의 B형 독립 검수 영역에서는 미승인 후보를 정제 전 이미지와 나란히 비교하고 180/240/360px, 배경과 머리·발 가이드 표시를 조절할 수 있습니다. 가이드는 확정된 해부학적 기준선이 아닙니다. B형 상태 에셋은 의상별로 분리 등록하며 미등록 상태에 A형을 대신 사용하지 않습니다.
