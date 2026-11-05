# Castle Desktop Pet

Windows 10/11용 캐슬 데스크톱 펫 v0.1 기반입니다. 현재 캐릭터 이미지는 임시 표시이며, 실제 아킬라 이미지와 애니메이션은 포함하지 않습니다.

## 개발

Node.js 22 이상을 설치한 뒤 저장소에서 실행합니다.

```sh
npm ci
npm run build
npm test
npm start
```

`npm start`는 빌드 후 Electron을 실행합니다. 캐릭터를 드래그해 이동하고 우클릭 메뉴에서 크기를 설정하거나 종료합니다. 창 위치는 Electron 사용자 데이터 디렉터리에 저장됩니다. `npm run dev`는 렌더러만 브라우저에서 확인하기 위한 Vite 서버입니다.

요구사항은 [제품 명세](docs/PRODUCT_SPEC.md)를 참조하세요.
