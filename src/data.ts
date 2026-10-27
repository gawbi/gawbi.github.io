// All site copy lives here. Numbers are taken from the repos' READMEs as-is;
// keep caveats (seed count, synthetic data, confounders) next to every number.

const media = (p: string) => `${import.meta.env.BASE_URL}media/${p}`;

export const profile = {
  nameKo: "김광빈",
  nameEn: "Gwangbin Kim",
  github: "https://github.com/gawbi",
  // Set to show a mailto link in the contact section. Left empty on purpose.
  email: "",
  tagline: ["정상을 학습해서,", "벗어난 것을 잡는다."],
  intro:
    "신호를 다룹니다. 스펙트럼에서 시작해 음성을 거쳐, 지금은 로봇이 걷는 법을 강화학습으로 가르칩니다.",
};

export const nav = [
  { id: "bugi", label: "상상부기" },
  { id: "humanoid", label: "휴머노이드 RL" },
  { id: "work", label: "프로젝트" },
  { id: "principles", label: "일하는 방식" },
  { id: "path", label: "지나온 길" },
];

/* ───────────────────────── 상상부기 ───────────────────────── */

export const bugi = {
  title: "말하고 걷는 상상부기",
  summary:
    "한성대학교 마스코트 상상부기의 모습을 한 이족보행 로봇을 만드는 캡스톤 디자인 프로젝트입니다. 오픈소스 로봇 Open Duck Mini v2의 다리 기구를 그대로 쓰고, 강화학습으로 걷게 합니다.",
  goal: "한 학기 안에 실물 부기가 스스로 서고 몇 걸음 걷기. 입시박람회에서 “부기야!” 하고 부르면 대답하는 시연.",
  pitch: { src: media("bugi/pitch.mp4"), poster: media("bugi/pitch-poster.jpg"), length: "2:00" },
  reel: { src: media("bugi/reel.mp4"), poster: media("bugi/reel-poster.jpg") },
  specs: [
    { value: 49, prefix: "약 ", unit: "cm", label: "키" },
    { value: 2, prefix: "약 ", unit: "kg", label: "무게" },
    { value: 10, unit: "개", label: "다리 서보" },
    { value: 100, prefix: "약 ", unit: "만 원", label: "재료비" },
  ],
  // Grouped from bugi_reel_day1.srt — start/end in seconds of reel.mp4
  beats: [
    {
      start: 0.3,
      end: 8.6,
      title: "부기가 진짜로 걷는다면",
      body: "학교 앞 상상부기 동상에서 출발합니다. 오늘부터 상상부기 로봇 만들기.",
    },
    {
      start: 8.7,
      end: 17.3,
      title: "오리 로봇의 다리를 빌려온다",
      body: "Open Duck Mini v2의 다리 기구를 그대로 쓰고, 짧은 다리에 맞춰 허벅지는 후드티 속에 숨겼습니다.",
    },
    {
      start: 17.4,
      end: 23.9,
      title: "털썩 — 무게중심이 발 뒤로",
      body: "동상 비율 그대로 만들었더니 MuJoCo 서기 시험에서 뒤로 넘어졌습니다. 무게중심이 발 뒤에 있었습니다.",
    },
    {
      start: 24.0,
      end: 29.1,
      title: "몸통 2.5cm, 머리 4.5cm 앞으로",
      body: "몸통과 머리를 앞으로 옮기고 배터리는 배 쪽 아래로 내려 무게중심을 발 위로 되돌렸습니다.",
    },
    {
      start: 29.2,
      end: 33.4,
      title: "후드티 실루엣 A · B · C",
      body: "공식 4면도를 따른 외형에 후드티 실루엣 세 가지를 비교했습니다. 둥근 어깨와 오동통한 배의 C로 결정.",
    },
    {
      start: 33.5,
      end: 39.5,
      title: "걷는다",
      body: "원본 로봇의 공개 보행 정책(ONNX)을 부기 무게 모델로 돌려 걸음을 확인했습니다. 부기 몸에 맞춘 학습은 다음 단계입니다.",
    },
    {
      start: 39.6,
      end: 50,
      title: "“부기야!” 부르면 대답한다",
      body: "음성 인식 → 미리 만든 대사와 동작. 대사는 학교 확인 전 초안입니다. 다음엔 진짜로 만듭니다.",
    },
  ],
  stages: [
    { n: 1, label: "참고 영상 분석", state: "done" },
    { n: 2, label: "Open Duck Mini v2 조사", state: "done" },
    { n: 3, label: "부품표와 예산", state: "done" },
    { n: 4, label: "부기 기구 설계", state: "tentative" },
    { n: 5, label: "시뮬레이션 학습", state: "next" },
    { n: 6, label: "sim2real", state: "todo" },
    { n: 7, label: "15주 일정과 역할", state: "todo" },
  ] as const,
  stack: ["MuJoCo", "ONNX Runtime", "PPO · SAC", "도메인 랜덤화", "Onshape", "3D 프린팅", "음성 AI"],
  copyright: "© 한성대학교",
  disclaimer:
    "상상부기 캐릭터, 한성대 로고, 캠퍼스 사진의 권리는 한성대학교에 있습니다. 영상은 시뮬레이션 화면을 합성한 것이고 실제 로봇이 아닙니다.",
  team: "한성대학교 캡스톤 디자인 팀",
};

/* ───────────────────────── 휴머노이드 RL ───────────────────────── */

export const humanoid = {
  repo: "https://github.com/gawbi/robotics-rl-study",
  notes: "https://github.com/gawbi/robotics-rl-study/blob/main/day5-g1-reward-experiment/notes.md",
  summary:
    "강의 실습으로 PPO를 구현해 보는 것부터 시작해, Isaac Lab에서 Unitree G1 보행 정책을 학습하고 보상을 하나씩 바꿔 가며 정책이 어떻게 달라지는지 숫자로 확인합니다.",
  baseline: { src: media("work/g1-baseline.mp4"), poster: media("work/g1-baseline.jpg") },
  versus: { src: media("work/g1-vs.mp4"), poster: media("work/g1-vs.jpg") },
  stats: [
    { value: 4096, label: "병렬 환경", unit: "env" },
    { value: 27, label: "1,500 iteration 학습", unit: "분" },
    { value: 99.6, decimals: 1, label: "20초 생존", unit: "%" },
    { value: 500, label: "직접 구현한 PPO · CartPole", unit: "점" },
  ],
  ablation: {
    title: "보상 하나를 끄면, 걷는 방식이 바뀐다",
    setup: "feet_air_time 가중치 0.75 → 0 · 나머지 설정 동일 · 마지막 100 iteration 평균 · seed 1개",
    rows: [
      { label: "넘어짐 비율", key: "base_contact", a: 0.41, b: 0.39, fmt: (v: number) => `${v.toFixed(2)}%`, verdict: "거의 같음", max: 0.5 },
      { label: "이동 명령 추종", key: "track_lin_vel_xy_exp", a: 0.936, b: 0.934, fmt: (v: number) => v.toFixed(3), verdict: "거의 같음", max: 1 },
      { label: "발 미끄러짐 벌점", key: "|feet_slide|", a: 0.0123, b: 0.0162, fmt: (v: number) => v.toFixed(4), verdict: "+32% · 발이 더 미끄러짐", max: 0.018, flag: true },
    ],
    takeaway:
      "넘어짐과 명령 추종은 그대로인데 발 미끄러짐 벌점만 32% 커졌습니다. 보상 항목 하나가 “걸을 수 있느냐”보다 “어떻게 걷느냐”를 바꿉니다.",
    caveat: "시드 1개로 얻은 결과라서, 시드 3개 반복으로 다시 확인할 예정입니다.",
  },
  direction: [
    {
      title: "휴머노이드 Whole-Body Control",
      body: "시뮬레이터에서 학습한 정책을 다른 시뮬레이터(MuJoCo)로 옮겨 검증하고, 실물로 옮기는 흐름까지.",
    },
    {
      title: "리더암 모방학습",
      body: "리더암으로 시연한 동작을 로봇이 배워 스스로 반복하게 만드는 모방학습. 행동 청킹과 리더-팔로워 텔레오퍼레이션.",
    },
    {
      title: "robotics-from-scratch",
      body: "2링크 팔로 좌표계 · FK · IK · 야코비안을 직접 구현. IK는 FK에 다시 넣은 오차로, 해석적 야코비안은 수치 미분과 비교해 검증할 계획입니다.",
      href: "https://github.com/gawbi/robotics-from-scratch",
    },
  ],
};

/* ───────────────────────── 프로젝트 ───────────────────────── */

export type Visual = "threshold" | "bars" | "spectro" | "arm";

export type Project = {
  id: string;
  name: string;
  kicker: string;
  headline: string;
  body: string;
  metric?: { value: string; unit?: string; label: string };
  note?: string;
  tags: string[];
  href: string;
  live?: string;
  visual?: Visual;
  image?: string;
  video?: { src: string; poster: string };
  size: "lg" | "md" | "sm";
};

export const projects: Project[] = [
  {
    id: "haegeum",
    name: "haegeum-addon",
    kicker: "DAH 2026 해금팀 · UAV / UGV",
    headline: "센서가 조작됐는지, 재구성 오차로 잡는다",
    body: "ROS2 노드로 만든 UAV · UGV 이상탐지 모듈. 공격 에이전트를 따로 만들고, 같은 공격을 오프라인으로 주입해 방어 모듈을 검증했습니다. SHAP을 붙이는 과정에서 이전 분석의 오류를 찾아내 바로잡았습니다.",
    metric: { value: "0.041", unit: "ms", label: "p99 추론 · UGV (UAV 0.119 ms)" },
    note: "Apple M5 CPU 1스레드 기준 · 10 Hz 예산의 0.12 % 이하 · 합성 센서 데이터",
    tags: ["ROS2", "VAE", "SHAP", "Red Agent"],
    href: "https://github.com/gawbi/haegeum-addon",
    visual: "threshold",
    size: "lg",
  },
  {
    id: "hc-roberta",
    name: "hc-roberta-cross-attention",
    kicker: "이종 신호 융합",
    headline: "높은 F1이 어디서 왔는지부터 의심했다",
    body: "정형 수치 피처와 텍스트 임베딩을 Cross-Attention으로 융합하는 실험. 비교 모델(Simple Concat, Cross-Attention)을 직접 구현해 팀 제안 모델과 대조했고, 누수 감사로 F1의 대부분이 데이터셋의 표층 단서에서 온다는 것을 밝혔습니다.",
    metric: { value: "0.9832", unit: "F1", label: "± 0.0007 · 5-Run" },
    note: "TF-IDF 기준선만으로 F1 0.9744",
    tags: ["Cross-Attention", "RoBERTa", "누수 감사"],
    href: "https://github.com/gawbi/hc-roberta-cross-attention",
    visual: "bars",
    size: "md",
  },
  {
    id: "voice",
    name: "voice-deepfake-detection",
    kicker: "해커톤 출품작 · 음성",
    headline: "개선이 보여도, 원인은 단정하지 않았다",
    body: "멜 스펙트로그램과 웨이블릿 스칼로그램을 2채널로 ResNet-18에 넣는 이중 파이프라인. 두 실험의 입력 길이와 배치가 달라 웨이블릿 효과로 단정할 수 없다는 점을 README에 교란 변수 표로 명시했습니다.",
    metric: { value: "5.50 → 3.80", unit: "%", label: "dev EER (관찰값)" },
    note: "ASVspoof 2019 LA 5,000 utterance 서브셋 · 단일 시드",
    tags: ["Mel + Wavelet", "ResNet-18", "교란 변수 표"],
    href: "https://github.com/gawbi/voice-deepfake-detection",
    visual: "spectro",
    size: "md",
  },
  {
    id: "roadmap",
    name: "robotics-roadmap",
    kicker: "공부 기록 사이트 · Live",
    headline: "공부한 흔적을 지도 위에 남긴다",
    body: "강의 지도를 따라 공부하며 퀴즈 · 노트 · 구현을 커밋하면 지도에 칠해지는 사이트. Robot Learning · Manipulation 쪽에 최근 연구와 현업 도구를 다루는 강의를 더했습니다.",
    metric: { value: "62", unit: "강", label: "커리큘럼 · 132시간 분량" },
    tags: ["TypeScript", "GitHub Pages", "ACT"],
    href: "https://github.com/gawbi/robotics-roadmap",
    live: "https://gawbi.github.io/robotics-roadmap/#/me",
    video: { src: media("work/roadmap-tour.mp4"), poster: media("work/roadmap-tour.jpg") },
    size: "lg",
  },
  {
    id: "from-scratch",
    name: "robotics-from-scratch",
    kicker: "진행 중 · 기구학",
    headline: "FK · IK · 야코비안을 직접",
    body: "2링크 팔로 기구학을 바닥부터 구현합니다. 단계마다 완료 조건을 테스트로 먼저 정해 두었습니다. 지금은 1–2단계 개념 정리까지.",
    tags: ["Kinematics", "Test-first"],
    href: "https://github.com/gawbi/robotics-from-scratch",
    visual: "arm",
    size: "sm",
  },
  {
    id: "mendai",
    name: "MENDAI",
    kicker: "팀 프로젝트 · 비전",
    headline: "운동화 손상, 분류기와 탐지기로",
    body: "분류기(DINO)와 탐지기(DETR · YOLO) 실험. DETR 쪽은 신뢰구간과 conf 선택 기준을 적어 두었습니다.",
    tags: ["DINO", "DETR", "YOLO"],
    href: "https://github.com/gawbi/MENDAI",
    image: media("work/mendai.jpg"),
    size: "sm",
  },
  {
    id: "track",
    name: "track-digital-twin",
    kicker: "시뮬레이터 자산",
    headline: "실습 트랙의 디지털 트윈 도면",
    body: "라즈베리파이 자율주행 실습 트랙 매트를 시뮬레이터용 텍스처와 좌표 JSON으로. 치수마다 측정 · 사진 · 추정 출처를 구분해 표기했습니다.",
    tags: ["Digital Twin", "JSON"],
    href: "https://github.com/gawbi/track-digital-twin",
    image: media("work/track.jpg"),
    size: "sm",
  },
];

export const legacy = {
  name: "legacy-archive",
  body: "2020년 C/C++ 수업 실습 코드 — 흩어져 있던 5개 저장소를 주제별로 통합",
  href: "https://github.com/gawbi/legacy-archive",
};

/* ───────────────────────── 일하는 방식 ───────────────────────── */

export const principles = {
  statement: "검증 숫자가 없는 단계는 끝난 것으로 치지 않습니다.",
  receipts: [
    {
      tag: "누수 감사",
      what: "F1 0.9832를 받고, TF-IDF만으로 0.9744가 나온다는 것부터 보였습니다.",
      where: "hc-roberta-cross-attention",
    },
    {
      tag: "교란 변수 표",
      what: "EER이 5.50%에서 3.80%로 내려갔지만, 입력 길이와 배치가 달라 웨이블릿 효과로 단정하지 않았습니다.",
      where: "voice-deepfake-detection",
    },
    {
      tag: "오류 정정",
      what: "SHAP을 붙이는 과정에서 이전 분석의 오류를 찾아내 바로잡았습니다.",
      where: "haegeum-addon",
    },
    {
      tag: "표본 크기",
      what: "시드 1개로 얻은 +32%는 시드 1개라고 적고, 3개 반복을 다음 할 일로 남겼습니다.",
      where: "robotics-rl-study",
    },
    {
      tag: "출처 구분",
      what: "트랙 도면의 치수마다 측정 · 사진 · 추정 중 어디서 왔는지 구분해 표기했습니다.",
      where: "track-digital-twin",
    },
  ],
};

export const privateWork = {
  intro:
    "코드를 올릴 수 없는 작업들입니다. 데이터가 기관 소유이거나, 발표 전 연구이거나, 원 구현의 공개 동의가 아직 없습니다. 주제와 역할만 남깁니다.",
  rows: [
    {
      title: "VLM 보조 라벨링으로 사람 검토 줄이기",
      period: "2026-10",
      what: "로봇 과제의 성공/실패 라벨을 로컬 VLM이 먼저 달고 사람은 일부만 검토하는 파이프라인. HIL-SERL 보상 분류기용으로, 합성 데이터로 검토 정책을 비교했습니다. 실제 로봇 실험은 아직 전입니다.",
      why: "연구실 발표 전 연구",
    },
    {
      title: "보상 기반 critic shaping 연구 인수인계",
      period: "2026-10 ~",
      what: "지도교수의 연구를 인수인계 받아 원본 실험 결과를 재집계해 검증하고, 이어받기 위한 학습 교재와 재집계 도구를 작성했습니다.",
      why: "미발표 연구",
    },
    {
      title: "운동화 손상 탐지 — 슈도 라벨 파이프라인",
      period: "2026-10",
      what: "CVAT 사람 라벨로 YOLO를 학습하고, 라벨 없는 원본에 슈도 라벨을 달아 검수 뒤 재학습. 자동 라벨러 세 종(YOLO · Grounding DINO · SAM 3) 비교 스크립트 포함.",
      why: "원본 라벨 파일과 데이터 경로 포함",
    },
    {
      title: "라만 스펙트럼 전처리",
      period: "2026-01 ~ 07",
      what: "선행 연구자의 RSGAN · RSBPCNN 구현을 인수인계 받아 베이스라인 생성기와 쌍 지도학습으로 개선하고 재학습했습니다.",
      why: "원 구현의 공개 동의 전",
    },
  ],
};

/* ───────────────────────── 지나온 길 ───────────────────────── */

export const path = [
  {
    when: "2020",
    title: "C / C++",
    body: "프로그래밍 수업 실습. 지금은 legacy-archive에 주제별로 모아 두었습니다.",
    channel: "flat",
  },
  {
    when: "2024 — 2026",
    title: "신호 처리",
    body: "라만 스펙트럼 전처리, 웨이블릿 변환, 음성 딥페이크 탐지. 스펙트럼에서 시작해 음성으로.",
    channel: "wave",
  },
  {
    when: "2026",
    title: "이상 탐지",
    body: "VAE 재구성 오차로 센서 조작을 잡고, 이종 신호를 Cross-Attention으로 융합했습니다. 높은 숫자가 나오면 그 숫자부터 의심했습니다.",
    channel: "spike",
  },
  {
    when: "NOW",
    title: "로보틱스",
    body: "Isaac Lab에서 G1 보행을 학습하고, 상상부기를 걷게 만들 준비를 합니다.",
    channel: "gait",
  },
] as const;

export const tools = [
  "Isaac Sim",
  "Isaac Lab",
  "MuJoCo",
  "PyTorch",
  "RSL-RL",
  "ROS2",
  "ONNX Runtime",
  "YOLO",
  "Python",
  "NumPy",
  "scikit-learn",
  "Docker",
  "Ubuntu",
];

export const nextUp = [
  "휴머노이드 보행 정책의 sim-to-sim 검증 (Isaac Sim → MuJoCo)",
  "행동 청킹 기반 모방학습",
  "리더-팔로워 텔레오퍼레이션과 기구학 리타게팅",
  "시뮬레이터 기반 정책 검증과 실물 이전",
];
