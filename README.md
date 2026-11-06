# Castle Desktop Pet

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

## 오프라인 미리보기

`npm run preview:export`로 단일 `preview.html`을 생성합니다. 브라우저에서 상태·크기·대사·드래그, 원본과 정렬본의 프레임 비교 및 속도를 확인할 수 있습니다. Windows 창 자체의 검증을 대체하지 않습니다.

앱은 `src/characters/derived/akila`의 정렬 PNG를 사용하며 `src/characters/assets/akila`의 원본을 보존합니다. Idle은 호흡과 간헐적 흡연 효과를 표시하고 Smoking은 흡연 효과를 반복합니다. Working은 첫 포즈를 유지하며 종료 시 페이드됩니다. Drawing은 조준 포즈를 유지합니다. Firing은 고정 리볼버 조준과 단발 섬광을, Dual Firing은 고정 양손 조준과 교차 섬광을 표시한 뒤 Idle로 돌아갑니다.

타이핑, 노트북 닫기, 팔과 총을 꺼내거나 정리하는 중간 포즈는 아직 없습니다. 효과의 실제 시각 품질과 Windows 동작은 실행 환경에서 검증해야 합니다. 자세한 사항은 [제품 명세](docs/PRODUCT_SPEC.md)를 참조하세요.
