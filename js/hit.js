export var asteroid = { // 운석 상태
  ready: false, // 운석 이미지 준비 상태
  x: canvas.width, // 운석의 위치 X 좌표
  y: Math.floor(350 * Math.random()), // 운석의 위치 Y 좌표
  speed: getRandomNumber(5, 5), // 운석 이동 속도 5 ~ 10
  angle: 0, // 운석 이미지 회전 각도
  scale: 0.6 // 운석 이미지 크기 조정 계수
};
