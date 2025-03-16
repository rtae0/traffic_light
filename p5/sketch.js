let port;
let connectBtn;
let redTimeSlider, yellowTimeSlider, greenTimeSlider;

// 아두이노에서 받은 정보
let arduinoColor = "R";         // 첫 번째 데이터("R","Y","G","B" 등)
let arduinoBrightness = 0;      // 두 번째 데이터(0~255)
let arduinoMode = "OFF";        // 세 번째 데이터("OFF","EMERGENCY","BLINKING","ON")

// 깜빡임(블링킹) 표시용 타이머
let blinkState = false;         // true면 켜짐, false면 꺼짐
let lastBlinkMillis = 0;        // 마지막으로 깜빡 상태가 바뀐 시각
const BLINK_INTERVAL = 500;     // 500ms 간격 깜빡

function setup() {
  createCanvas(400, 370);

  // 시리얼 포트 생성/열기
  port = createSerial();
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 9600);
  }

  connectBtn = createButton("Connect to Arduino");
  connectBtn.position(40, 10);
  connectBtn.mousePressed(connectBtnClick);

  // 빨간/노란/초록 시간 설정 슬라이더
  redTimeSlider = createSlider(100, 5000, 2000);
  redTimeSlider.position(40, 245);
  redTimeSlider.size(150);
  redTimeSlider.mouseReleased(changeSlider);

  yellowTimeSlider = createSlider(100, 5000, 500);
  yellowTimeSlider.position(40, 285);
  yellowTimeSlider.size(150);
  yellowTimeSlider.mouseReleased(changeSlider);

  greenTimeSlider = createSlider(100, 5000, 3000);
  greenTimeSlider.position(40, 325);
  greenTimeSlider.size(150);
  greenTimeSlider.mouseReleased(changeSlider);

  textSize(16);
  textAlign(LEFT, CENTER);
}

function draw() {
  background(220);

  // ▼▼▼▼▼ 시리얼 데이터 읽기 ▼▼▼▼▼
  if (port.available()) {
    let str = port.readUntil("\n").trim(); 
    if (str.length > 0) {
      console.log(str); // 시리얼 데이터 콘솔 출력
      
      // "R,128,ON" 또는 "B,100,BLINKING" 등 형태
      let data = str.split(",");
      if (data.length === 3) {
        arduinoColor = data[0];       // "R","Y","G","B", ...
        arduinoBrightness = int(data[1]);
        arduinoMode = data[2];       // "OFF","EMERGENCY","BLINKING","ON"
      }
    }
  }
  // ▲▲▲▲▲ 시리얼 데이터 읽기 ▲▲▲▲▲

  // 모드가 BLINKING이면 500ms마다 깜빡임 상태 토글
  if (arduinoMode === "BLINKING") {
    if (millis() - lastBlinkMillis >= BLINK_INTERVAL) {
      blinkState = !blinkState;
      lastBlinkMillis = millis();
    }
  } else {
    // BLINKING 모드 아닐 땐 항상 ON 상태로 처리
    blinkState = true;
  }

  // ---------- 밝기 바 그래프 ----------
  let barX = 40, barY = 130, barWidth = 310, barHeight = 7;
  let brightnessBar = map(arduinoBrightness, 0, 255, 0, barWidth);
  fill(180);
  rect(barX, barY, barWidth, barHeight, 5);
  fill(0, 200, 0);
  rect(barX, barY, brightnessBar, barHeight, 5);

  // ---------- 신호등 표시 ----------
  noStroke();
  drawTrafficLight(120, "red");
  drawTrafficLight(200, "yellow");
  drawTrafficLight(280, "green");

  // ---------- 텍스트 ----------
  fill(0);
  text("밝기: " + arduinoBrightness, 40, 160);
  text("LED 상태: " + arduinoColor, 40, 190);
  text("모드: " + arduinoMode, 40, 220);

  text("빨간불 시간: " + redTimeSlider.value() + "ms", 210, 255);
  text("노란불 시간: " + yellowTimeSlider.value() + "ms", 210, 295);
  text("초록불 시간: " + greenTimeSlider.value() + "ms", 210, 335);

  connectBtn.html(port.opened() ? "Disconnect" : "Connect to Arduino");
}

// ------------------------------------------------
// 아두이노에 새로운 시간 값 전송 (슬라이더 변경 시)
// ------------------------------------------------
function changeSlider() {
  let data = redTimeSlider.value() + "," +
             yellowTimeSlider.value() + "," +
             greenTimeSlider.value() + "\n";
  port.write(data);
}

// ------------------------------------------------
// 신호등(동그라미) 하나를 그리는 함수
// ------------------------------------------------
function drawTrafficLight(x, colorName) {
  // 각 불(동그라미)을 그릴 색상
  let c = [80, 80, 80]; // 기본 꺼진 회색

  // --------- OFF 모드 ---------
  if (arduinoMode === "OFF") {
    // 모든 색 꺼짐 (c 그대로 회색)
  }

  // --------- EMERGENCY 모드 ---------
  else if (arduinoMode === "EMERGENCY") {
    // 빨간불만 켜짐
    if (colorName === "red") {
      c = [255, 0, 0];
    } else {
      c = [50, 50, 50];
    }
  }

  // --------- BLINKING 모드 ---------
  else if (arduinoMode === "BLINKING") {
    // blinkState == true일 때 세 불 모두 켜고, false일 땐 꺼짐
    if (blinkState) {
      // 켜졌을 때: 빨/노/초 전부 "밝게"
      if (colorName === "red")    c = [255, 0, 0];
      if (colorName === "yellow") c = [255, 255, 0];
      if (colorName === "green")  c = [0, 255, 0];
    } else {
      // 꺼졌을 때: 전부 어둡게
      c = [50, 50, 50];
    }
  }

  // --------- ON(정상) 모드 ---------
  else if (arduinoMode === "ON") {
    // 아두이노에서 받은 arduinoColor(R,Y,G,B)에 따라 표시
    // 우선 "R","Y","G","B"를 실제 색으로 변환하자
    let currentLetter = arduinoColor; // "R","Y","G","B"
    
    // 이 신호등(drawing)은 colorName( "red" / "yellow" / "green")이 맞으면 켜준다
    if (colorName === "red") {
      if (currentLetter === "R") {
        c = [255, 0, 0]; // 빨간불 켜짐
      } else {
        c = [50, 0, 0];  // 빨간불 꺼짐
      }
    }
    else if (colorName === "yellow") {
      if (currentLetter === "Y") {
        c = [255, 255, 0]; // 노란불 켜짐
      } else {
        c = [70, 70, 0];   // 노란불 꺼짐
      }
    }
    else if (colorName === "green") {
      // "G"면 초록 켜짐, "B"면 깜빡임(꺼짐 상태)
      if (currentLetter === "G") {
        c = [0, 255, 0];   // 초록 켜짐
      } else if (currentLetter === "B") {
        c = [0, 60, 0];    // 초록 꺼짐
      } else {
        c = [0, 40, 0];    // 그 외 (초록 아님)
      }
    }
  }

  fill(c);
  circle(x, 80, 40);
}

// ------------------------------------------------
// 연결/해제 버튼
// ------------------------------------------------
function connectBtnClick() {
  if (port.opened()) {
    port.close();
  } else {
    port.open(9600);
  }
}