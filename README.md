# gawbi portfolio

김광빈의 포트폴리오 사이트. **Signal → Anomaly → Robot.**

React + Vite, 애니메이션은 [Motion](https://motion.dev), 스크롤은 [Lenis](https://lenis.darkroom.engineering).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 생성
```

## 구조

| 위치 | 내용 |
| --- | --- |
| `src/data.ts` | 사이트의 모든 문구와 수치. 내용 수정은 여기서만 |
| `src/robot/scene.ts` | 히어로 3D 장면: Open Duck Mini v2가 기록된 보행 롤아웃으로 걷고, 스크롤에 따라 카메라가 관절 · 신호 단계로 이동 |
| `src/components/SignalCanvas.tsx` | 관절 텔레메트리(무릎 · 고관절 각도) 위의 이상탐지 스코프 |
| `src/components/visuals/` | 프로젝트 카드 시각화 (임계값 트레이스, F1 막대, 스펙트로그램, 2링크 IK) |
| `public/media/` | 영상 · 이미지 (원본 GIF는 H.264 MP4로 변환해 둠) |

## 히어로 로봇 데이터

`public/robot/duck.{json,bin}`은 상상부기 프로젝트의 MuJoCo 롤아웃(`sim/out/duck_walk_BEST_WALK_ONNX_2.npz`)에서 만들었습니다.
고해상도 STL을 줄여 MuJoCo로 컴파일하고, 직진 구간에서 이음새 없는 4.87초 반복을 잘라 트레드밀 좌표로 옮긴 뒤,
프레임마다 부품 자세와 다리 관절 각도를 기록합니다.

```bash
python3 -m venv .venv && .venv/bin/pip install mujoco numpy fast-simplification
.venv/bin/python -I scripts/export_robot.py /tmp/duck_model public/robot
```

로봇 모델은 [Open Duck Mini](https://github.com/apirrone/Open_Duck_Mini) (Apache-2.0, `public/robot/LICENSE-open-duck-mini.txt`)입니다.

연락처 이메일을 노출하려면 `src/data.ts`의 `profile.email`을 채우면 됩니다.

## 배포

`.github/workflows/deploy.yml`이 `main` 푸시 때 GitHub Pages로 배포합니다 (저장소 Settings → Pages → Source: GitHub Actions).
`vite.config.ts`의 `base: "./"` 덕분에 `gawbi.github.io` 루트든 하위 경로든 그대로 동작합니다.

> `public/media/bugi/`의 상상부기 영상에 들어 있는 캐릭터 · 로고 · 캠퍼스 사진 © 한성대학교. 영상은 시뮬레이션 화면을 합성한 것이고 실제 로봇이 아닙니다.
