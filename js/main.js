var canvas = document.getElementById('myCanvas');

// returns a drawing context on the canvas,
// or null if the context identifier is not supported,
// or the canvas has already been set to a different context mode.
var context = canvas.getContext('2d');

/* -------------------------------------------
  Example : 우주 슈팅 게임
 -------------------------------------------*/

// 배경 이미지
var backgroundImage = new Image();
backgroundImage.src = 'images/space.png';

// 플레이어 전투기 이미지
var fighterImage = new Image();
fighterImage.src = 'images/fighter.png';

// 레이저 이미지
var laserImage = new Image();
laserImage.src = 'images/laser.png';

// 운석 이미지
var asteroidImage = new Image();
asteroidImage.src = 'images/asteroid.png';

// 운석 폭발 애니메이션 스프라이트 이미지
var explosionImage = new Image();
explosionImage.src = 'images/explode.png';

// 레이저 발사 오디오
var laserSound = new Audio('sounds/Laser.wav');

// 폭발 오디오
var fighterExplosionSound = new Audio('sounds/explosion.wav');
var laserExplosionSound = new Audio('sounds/explosion-02.wav');

// 게임 오버 오디오
var gameOverSound = new Audio('sounds/game_over.wav');
gameOverSound.loop = true;
gameOverSound.volume = .25;
gameOverSound.load();

// 게임 상태관리
var isGameOver = false; // 게임 오버 여부
var score = 0; // 게임 점수
var lives = 2; // 앞으로 남은 생명 갯수
var lastUpdateTime = 0; // 마지막으로 프레임을 업데이트한 시간
var acDelta = 0; // 마지막 프레임 업데이트로부터 몇 밀리초가 지났는지 기록
var msPerFrame = 1000; // 마지막 프레임 업데이트로부터 몇 밀리초가 지나야 프레임을 갱신할 지 시간 간격
var keysPressed = {}; // 누른 키 목록
var backgroundImageReady = false; // 배경 이미지 준비 상태
var laserImageReady = false; // 레이저 이미지 준비 상태
var lasers = []; // 현재 발사되어 화면에 보여지고 있는 레이저들 목록
var lasersTotal = 2; // 한번에 최대 발사할 수 있는 레이저 수
var fighter = { // 플레이어 전투기 상태
  ready: false, // 플레이어 전투기 이미지 준비 상태
  hit: false, // 플레이어 전투기가 운석에 맞았는지 여부
  x: 50, // 플레이어 전투기의 위치 X 좌표
  y: canvas.height / 2, // 플레이어 전투기의 위치 Y 좌표
  speed: 5 // 플레이어 전투기의 이동 속도
};
var asteroid = { // 운석 상태
  ready: false, // 운석 이미지 준비 상태
  hit: false, // 레이저가 운석에 명중했는지 여부
  x: canvas.width, // 운석의 위치 X 좌표
  y: Math.floor(350*Math.random()), // 운석의 위치 Y 좌표
  speed: getRandomNumber(5, 5), // 운석 이동 속도 5 ~ 10
  angle: 0, //
  scale: 0.6 // 운석 이미지 크기 조정 계수
};
var asteroidScales = [0.4, 0.6, 0.8, 1]; // 운석이 가질 수 있는 크기 조정 계수들
var explosion = { // 레이저 명중 시 운석 폭발 애니메이션 상태
  ready: false, // 폭발 스프라이트 이미지 준비 상태
  x: 0, // 레이저가 운석에 명중한 위치 X 좌표,
  y: 0, // 레이저가 운석에 명중한 위치 Y 좌표,
  sprite: 1, // 현재 재생 중인 운석 폭발 애니메이션 프레임 번호
};

// 캔버스 배경 이미지 로드에 성공하면
backgroundImage.onload = function () {
  backgroundImageReady = true;
};

// 플레이어 전투기 이미지 로드에 성공하면
fighterImage.onload = function () {
  fighter.ready = true;
};

// 레이저 이미지 로드에 성공하면
laserImage.onload = function () {
  laserImageReady = true;
};

// 운석 이미지 로드에 성공하면
asteroidImage.onload = function () {
  asteroid.ready = true;
};

// 운석 폭발 애니메이션 스프라이트 이미지
explosionImage.onload = function () {
  explosion.ready = true;
};

// 게임 오버 시에 나타나는 [RESTART] 버튼 클릭 이벤트입니다.
document.getElementById('restart').addEventListener('click', function () {
  restartGame(); // 게임을 재시작합니다.
});

// 키보드 입력이 감지되면 어떤 키를 눌렀는지 기록합니다.
document.addEventListener('keydown', function (event) {
  keysPressed[event.keyCode] = true;

  // 입력한 키가 스페이스 키이고, 아직 발사 가능한 레이저가 남아 있을 경우에 실행합니다.
  if (event.keyCode === 32 && lasers.length < lasersTotal) {
    lasers.push({ // 새로운 레이저를 발사하고 발사된 레이저 목록에 추가합니다.
      x: fighter.x + 50,
      y: fighter.y + 10,
    });
    playSound(laserSound); // 레이저 발사음을 재생합니다.
  }
}, false);

// 키보드 입력이 해제될 때 키 입력 기록을 제거합니다.
document.addEventListener('keyup', function (event) {
  delete keysPressed[event.keyCode];
}, false);

// 게임을 시작합니다.
var background = new Background();
rewriteLives();
resetAsteroid();
main();

/**
 * 게임 프레임 상황을 업데이트 합니다.
 */
function main() {
  update();
  if (!isGameOver) render(); // 게임 오버 상태가 아닐 때에만 게임 프레임을 진행시킵니다.
  requestAnimationFrame(main);
}

/**
 * 입력된 키에 따라 플레이어 전투기의 위치를 변경합니다.
 */
function update() {
  if (87 in keysPressed) { // up w
    fighter.y -= fighter.speed;
  } if (83 in keysPressed) { // down s
    fighter.y += fighter.speed;
  } if (65 in keysPressed) { // left a
    fighter.x -= fighter.speed;
  } if (68 in keysPressed) { // right d
    fighter.x += fighter.speed;
  }

  // 캔버스 영역을 벗어나지 않도록 이동 가능 위치 제한
  if (fighter.x <= 0) fighter.x = 0;
  if (fighter.x >= canvas.width - 60) fighter.x = canvas.width - 60;
  if (fighter.y <= 0) fighter.y = 0;
  if (fighter.y >= canvas.height - 30) fighter.y = canvas.height - 30;

  // 레이저가 운석에 명중했는지 여부를 체크합니다.
  detectCollision();
}

/**
 * 게임 화면을 새로 그립니다.
 */
function render() {
  const delta = Date.now() - lastUpdateTime; // 마지막 프레임 업데이트로부터 몇 밀리초가 지나서 실행되는 건지 계산

  // 마지막 프레임 업데이트로부터 충분한 시간(msPerFrame)이 경과되었으면 프레임을 업데이트 합니다.
  if (acDelta > msPerFrame) {
    acDelta = 0; // 지금 프레임 업데이트를 할 것이므로, 마지막 프레임 업데이트로부터의 경과 시간 기록을 초기화합니다.

    // 게임 프레임을 다시 그립니다.
    if (backgroundImageReady) background.render(); // 배경 이미지
    if (fighter.ready) { // 플레이어 전투기 이미지
      if (fighter.hit) {
        drawFighterImage(fighter.x += 1, fighter.y); // 현재 플레이어 전투기 이미지 위치보다 우측으로 1px 뒤에 그립니다.
        if (fighter.x >= 50) fighter.hit = false; // 플레이어 전투기 이미지가 원래 위치로 돌아오면 피격 상태를 해제한다.
      } else {
        drawFighterImage(fighter.x, fighter.y); // 플레이어 전투기 이미지를 그립니다.
      }
    }
    if (asteroid.ready) { // 운석 이미지
      moveAsteroid(); // 운석의 다음 위치를 계산하여 그립니다.
    }
    if (laserImageReady) { // 레이저 이미지
      drawLaserImage(); // 캔버스에 현재 발사된 레이저들 이미지를 그립니다.
      moveLaser(); // 발사된 레이저들의 다음 위치를 계산합니다.
    }
    if (explosion.ready && asteroid.hit) drawExplosion(); // 레이저가 운석에 명중한 경우 폭발 애니메이션 재생합니다.

  } else {
    // 마지막 프레임 업데이트로부터 아직 충분한 시간(msPerFrame)이 경과되지 않았다면 조금 더 기다립니다.
    acDelta += delta; // 마지막 프레임 업데이트로부터 지난 시간을 업데이트 합니다.
  }
}

/**
 * 게임 오버 처리를 합니다.
 */
function gameOver() {
  isGameOver = true; // 게임 오버 상태를 true 로 변경합니다.

  // 게임 오버 사운드를 재생합니다.
  gameOverSound.currentTime = 0;
  gameOverSound.play();

  // fixme: jQuery 사용하지 않고 구현하기
  $('#game-over').css('display', 'block');
}

/**
 * 게임을 재시작합니다.
 */
function restartGame() {
  // 게임 상태를 업데이트 합니다.
  isGameOver = false; // 게임 오버 상태를 false 로 변경합니다.
  lives = 2; // 남은 목숨을 다시 2 개로 초기화합니다.
  score = 0; // 쌓은 점수를 다시 0 점으로 초기화합니다.

  // 업데이트한 남은 목숨과 쌓은 점수를 화면에 표시합니다.
  rewriteLives();
  rewriteScore();

  // 게임 오버 사운드를 중단합니다.
  gameOverSound.currentTime = 0;
  gameOverSound.pause();

  // fixme: jQuery 사용하지 않고 구현하기
  $('#game-over').css('display', 'none');
}

/**
 * 레이저 이미지와 운석 이미지가 겹쳤는지,
 * 운석 이미지와 플레이어 전투기 이미지가 겹쳤는지
 * 두 가지 여부를 체크합니다. (명중 여부 체크)
 */
function detectCollision() {

  // 운석 이미지 사이즈 확인
  const asteroidImageWidth = asteroid.scale*asteroidImage.width; // 현재 운석 이미지의 너비 사이즈입니다.
  const asteroidImageHeight = asteroid.scale*asteroidImage.height; // 현재 운석 이미지의 높이 사이즈입니다.

  // 플레이어 전투기 이미지에 명중했는지 체크합니다.
  if (
    (asteroid.x < fighter.x && fighter.x < asteroid.x + asteroidImageWidth
      && asteroid.y < fighter.y && fighter.y < asteroid.y + asteroidImageHeight) ||
    (asteroid.x < fighter.x + fighterImage.width && fighter.x + fighterImage.width < asteroid.x + asteroidImageWidth
      && asteroid.y < fighter.y && fighter.y < asteroid.y + asteroidImageHeight) ||
    (asteroid.x < fighter.x && fighter.x < asteroid.x + asteroidImageWidth
      && asteroid.y < fighter.y + fighterImage.height && fighter.y + fighterImage.height < asteroid.y + asteroidImageHeight) ||
    (asteroid.x < fighter.x + fighterImage.width && fighter.x + fighterImage.width < asteroid.x + asteroidImageWidth
      && asteroid.y < fighter.y + fighterImage.height && fighter.y + fighterImage.height < asteroid.y + asteroidImageHeight)) {

    // 플레이어 전투기를 명중시킨 운석을 처리합니다.
    fighter.hit = true; // 플레이어 전투기 이미지의 피격 상태를 true 로 변경합니다.
    asteroid.hit = true; // 운석의 명중 여부 상태를 true 로 변경합니다.
    explosion.x = asteroid.x; // 폭발 애니메이션 재생 위치의 X 좌표를 현재 운석 위치의 X 좌표로 설정합니다.
    explosion.y = asteroid.y; // 폭발 애니메이션 재생 위치의 X 좌표를 현재 운석 위치의 Y 좌표로 설정합니다.

    updateLives(); // 운석과 충돌하면 생명 수치를 1 뺀다.
    rewriteLives(); // 업데이트된 잔여 생명 갯수를 화면에 표시합니다.

    resetAsteroid(); // 현재 운석의 상태를 초기화합니다.
    resetFighter(); // 플레이어 전투기 위치를 초기화합니다.

    playSound(fighterExplosionSound); // 플레이어 전투기 폭발 오디오를 재생합니다.
  }

  // 현재 캔버스에 보이는 레이저가 하나라도 있을 때에만 실행합니다.
  if (lasers.length) {
    // 현재 캔버스에 보이는 레이저들 각각을 하나씩 체크합니다.
    for (let i = 0 ; i < lasers.length ; i++) {
      // 레이저 이미지 위치가 운석 이미지 안에 위치하는 경우, 명중한 것으로 판단합니다.
      if (asteroid.x < lasers[i].x && lasers[i].x < asteroid.x + asteroidImageWidth
        && asteroid.y < lasers[i].y && lasers[i].y < asteroid.y + asteroidImageHeight) {

        // 레이저에 맞은 운석을 처리합니다.
        explosion.x = lasers[i].x; // 폭발 애니메이션 재생 위치의 X 좌표를 현재 레이저 위치의 X 좌표로 설정합니다.
        explosion.y = lasers[i].y; // 폭발 애니메이션 재생 위치의 X 좌표를 현재 레이저 위치의 Y 좌표로 설정합니다.
        asteroid.hit = true; // 운석의 명중 여부 상태를 true 로 변경합니다.

        // 운석을 맞춘 레이저를 처리합니다.
        lasers.splice(i, 1); // 명중한 레이저는 현재 발사된 레이저 목록에서 제거합니다.
        resetAsteroid(); // 새 운석을 다시 그립니다.
        playSound(laserExplosionSound, 0.5); // 레이저 폭발 오디오를 재생합니다.

        // 점수 추가 처리합니다.
        updateScore(); // 운석을 레이저로 명중시키면 점수를 추가한다.
        rewriteScore(); // 업데이트된 점수를 화면에 표시합니다.
      }
    }
  }
}

/**
 * 발사된 레이저들의 다음 위치를 계산합니다.
 */
function moveLaser() {
  for (let i = 0 ; i < lasers.length ; i++) {
    if (lasers[i].x > 0) lasers[i].x += 20; // 레이저가 이동 중이면 다음 위치를 오른쪽으로 20px 이동시킵니다.
    if (lasers[i].x > 600) lasers.splice(i, 1); // 레이저가 캔버스 오른쪽에 도착하면 목록에서 제거합니다.
  }
}

/**
 * 운석의 다음 위치를 계산합니다.
 */
function moveAsteroid() {

  // 캔버스에 그려야 할 운석 이미지 사이즈를 계산합니다.
  const asteroidWidth = asteroid.scale*asteroidImage.width;
  const asteroidHeight = asteroid.scale*asteroidImage.height;

  // 캔버스에 그려야 할 운석 이미지의 위치를 설정합니다.
  const asteroidDeltaX = asteroid.scale*asteroidImage.width/2;
  const asteroidDeltaY = asteroid.scale*asteroidImage.height/2;

  // 캔버스에 운석 이미지를 그립니다.
  context.save(); //
  context.translate(asteroid.x + asteroidDeltaX, asteroid.y + asteroidDeltaY); //
  context.rotate(Math.PI*(asteroid.angle += 5)/180); // 운석 이미지 회전시킵니다.
  context.translate(-(asteroid.x + asteroidDeltaX), -(asteroid.y + asteroidDeltaY));
  context.drawImage(asteroidImage, asteroid.x -= asteroid.speed, asteroid.y, asteroidWidth, asteroidHeight);
  context.restore(); //

  // 운석이 플레이어 전투기 위치까지 도달하면
  if (asteroid.x < -100) {
    resetAsteroid(); // 현재 운석의 상태를 초기화합니다. (즉, 새 운석이 캔버스에 표시됩니다.)
  }
}

/**
 * 현재 운석의 상태를 초기화합니다.
 */
function resetAsteroid() {
  // 운석의 이동속도를 재설정합니다.
  asteroid.speed = getRandomNumber(5, 5);

  // 운석의 크기 조정 계수를 재설정합니다.
  asteroid.scale = takeRandomSampleFrom(asteroidScales);

  // 운석 이미지를 초기 위치로 재배치합니다.
  asteroid.x = canvas.width;
  asteroid.y = getRandomNumber(0, 350);

  // 운석이 위치할 수 있는 Y 좌표 범위를 40px ~ 360px 범위로 제한합니다.
  if (asteroid.y < 40) asteroid.y = 40;
  if (asteroid.y > 360) asteroid.y = 360;
}

/**
 * 플레이어 전투기 위치를 초기화합니다.
 */
function resetFighter() {
  fighter.x = 0;
  fighter.y = canvas.width/2;
}

/**
 * 캔버스에 운석 폭발 애니메이션을 그립니다.
 */
function drawExplosion() {
  context.drawImage( // 현재 운석 폭발 스프라이트 이미지를 캔버스에 그립니다.
    explosionImage,
    39*explosion.sprite, 0,
    39, 40,
    explosion.x, explosion.y,
    39*(1 + asteroid.scale),
    40*(1 + asteroid.scale)
  );
  explosion.sprite++; // 다음 운석 폭발 스프라이트 이미지 프레임을 재생하도록 합니다.

  // 모든 폭발 애니메이션 프레임을 재생한 경우에 실행합니다.
  if (explosion.sprite > 13) {
    explosion.sprite = 1; // 다시 첫 폭발 프레임으로 되돌립니다.
    asteroid.hit = false; // 다시 명중 전 상태로 되돌립니다.
  }
}

/**
 * 캔버스에 플레이어 전투기 이미지를 그립니다.
 * @param x {number}
 * @param y {number}
 */
function drawFighterImage(x, y) {
  context.drawImage(fighterImage, x, y); // image, x, y
}

/**
 * 캔버스에 현재 발사된 레이저들 이미지를 그립니다.
 */
function drawLaserImage() {
  if (lasers.length > 0) {
    for (let i = 0 ; i < lasers.length ; i++) {
      context.drawImage(laserImage, lasers[i].x, lasers[i].y);
    }
  }
}

/**
 * 운석과 충돌하면 생명 수치를 1 뺀다.
 */
function updateLives() {
  if (lives <= 0) { // 0 이하로 내려가지 못하게 한다.
    lives = 0;
    gameOver(); // 게임 오버 처리를 합니다.
  } else { // 일반적인 상황에서는 정상적으로 1 만큼 차감한다.
    --lives;
  }
}

/**
 * 운석을 레이저로 명중시키면 점수를 추가한다.
 */
function updateScore() {
  score += 100; // 운석을 명중시킬 때마다 100 점씩 추가한다.
}

/**
 * 현재 남은 생명 수를 화면에 업데이트 합니다.
 */
function rewriteLives() {
  document.getElementById('lives').textContent = `${lives}`;
}

/**
 * 현재 점수를 화면에 업데이트 합니다.
 */
function rewriteScore() {
  document.getElementById('score').textContent = `${score}`;
}

/**
 * 레이저 발사음을 재생합니다.
 * @param audio {HTMLAudioElement}
 * @param volume {number}
 */
function playSound(audio, volume = 0.12) {
  audio.volume = volume;
  audio.load();
  audio.play();
}

/**
 * 배경 클래스
 * @constructor
 */
function Background() {
  this.x = 0; // 캔버스 배경 시작 위치 X 좌표
  this.y = 0; // 캔버스 배경 시작 위치 Y 좌표

  /**
   * 캔버스에 배경 이미지를 그립니다.
   */
  this.render = function () {
    context.drawImage(backgroundImage, this.x--, 0); // image, dx, dy

    // 캔버스 배경 시작 위치가 -600px 를 넘어가면, 배경 시작 위치를 0px 지점으로 되돌립니다.
    if (this.x <= -600) this.x = 0;
  }

}

/**
 * 전달받은 배열 객체 내에서 임의의 항목 1개를 추출하여 반환합니다.
 * (배열 객체를 변화시키지 않습니다.)
 * @param array {Array}
 */
function takeRandomSampleFrom(array) {
  const randomIndex = Math.floor(array.length*Math.random());
  return array[randomIndex];
}

/**
 * minimum ~ minimum + intervalLength 사이의 랜덤 숫자를 반환합니다.
 * @param minimum {number}
 * @param intervalLength {number}
 * @return {number}
 */
function getRandomNumber(minimum, intervalLength) {
  return minimum + Math.floor(intervalLength*Math.random());
}
