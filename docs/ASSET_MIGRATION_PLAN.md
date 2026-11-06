# B형 에셋 전환 계획

공식 기본 목표는 B형이다. **현재 제작 중인 무스탕 마스터 후보 `src/characters/candidates/akila_mustang/idle-gate1b-alpha-cleanup-unapproved.png` 계열이 앞으로의 시각적 기준**이며, 초기 디자인 시트는 제작 기준에서 퇴역한 레거시 참고 자료다. 현재 런타임은 A형을 유지하며 B형을 상태별 A형과 섞지 않는다. 초기 참고 시트와 A형 에셋은 복구용으로 보존하고, 검수 전 B 후보는 `src/characters/candidates/akila_mustang`에 분리한다. 최종 사용자 승인을 받은 B형은 별도 `src/characters/derived/akila_mustang/<상태>/`에 둔다. **현재 후보는 아직 미승인이나, 초기 원본과 비례를 다시 맞출 필요는 없다.**

| 상태 | 필요한 B형 포즈·전환 | 현재 |
|---|---|---|
| idle | 무기 없는 서 있는 전신, 일정한 머리·발 기준 | 후보 검수 |
| smoking | idle에서 담배 불빛·연기로 진입하고 복귀 | 미구현 |
| speaking | 무표정 기준 발화·종료 포즈 | 미구현 |
| working | 노트북 등장·타이핑·닫기와 양손 연결, idle 복귀 | 미구현 |
| drawing | 오른손으로 리볼버를 꺼내 조준 유지 | 미구현 |
| firing | 오른손 조준·발사·반동·정리, idle 복귀 | 미구현 |
| dual_firing | 리볼버와 반자동 권총 양손 조준·교차 사격·정리 | 미구현 |

7개 상태와 전환의 포즈가 일관성을 만족하고 크기별·브라우저·Windows 검증을 통과한 뒤에만 기본 실행을 B로 전환한다. 준비되지 않은 상태를 A형으로 대체하지 않는다. A형은 별도 에셋과 실행 설정을 보존하여 복구한다. sitting과 shotgun은 미래 기능이다.
