# B형 무스탕 공식 원본 — 2026-11-07

사용자가 확정한 ZIP의 매니페스트와 이미지 9개를 원본 바이트 그대로 보존한다. 원본을 덮어쓰거나 가공하지 않는다. 정제·변환 및 애니메이션은 별도 경로에 파생 파일로 생성한다. 시각적 확정은 기술적 알파 품질이나 애니메이션 승인을 의미하지 않는다. Sitting은 RGBA 원본, Working은 서 있는 노트북 포즈, Dual Firing은 지정된 JPEG다. JPEG 3개는 불투명하며 PNG 6개도 알파 경계 검수가 필요하다.

`node scripts/verify-b-mustang-canonical.mjs`로 ZIP 없이 파일을 검증한다. ZIP까지 검증하려면 `node scripts/verify-b-mustang-canonical.mjs --zip <ZIP경로>`를 사용한다. 현재 실행 의상은 A형이며 B형 원본은 런타임에 연결하지 않는다.
