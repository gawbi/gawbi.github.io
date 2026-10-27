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
| `src/components/SignalCanvas.tsx` | 히어로의 실시간 신호 · 이상탐지 캔버스 |
| `src/components/visuals/` | 프로젝트 카드 시각화 (임계값 트레이스, F1 막대, 스펙트로그램, 2링크 IK) |
| `public/media/` | 영상 · 이미지 (원본 GIF는 H.264 MP4로 변환해 둠) |

연락처 이메일을 노출하려면 `src/data.ts`의 `profile.email`을 채우면 됩니다.

## 배포

`.github/workflows/deploy.yml`이 `main` 푸시 때 GitHub Pages로 배포합니다 (저장소 Settings → Pages → Source: GitHub Actions).
`vite.config.ts`의 `base: "./"` 덕분에 `gawbi.github.io` 루트든 하위 경로든 그대로 동작합니다.

> `public/media/bugi/`의 상상부기 영상에 들어 있는 캐릭터 · 로고 · 캠퍼스 사진 © 한성대학교. 영상은 시뮬레이션 화면을 합성한 것이고 실제 로봇이 아닙니다.
