let handPose;
let video;
let hands = [];

let port;
let connectBtn;
let redTimeSlider, yellowTimeSlider, greenTimeSlider;

// 아두이노에서 받은 정보
let arduinoColor = "R";         // 예: "R","Y","G","B" 등
let arduinoBrightness = 0;      // 0 ~ 255
let arduinoMode = "OFF";        // "OFF", "EMERGENCY", "BLINKING", "ON"

// 깜빡임(블링킹)용 타이머
let blinkState = false;
let lastBlinkMillis = 0;
const BLINK_INTERVAL = 500;

// 이전에 전송한 모드 저장 변수 (일반 모드 변경 비교용)
let lastSentMode = "";
// lockedMode: 토글 모드가 고정되면 해당 제스처 문자열 저장, 아니면 빈 문자열
let lockedMode = "";

// 디바운스 관련 변수: 모드 전환 명령이 너무 자주 갱신되지 않도록 함.
let lastModeUpdateTime = 0;
const MODE_DEBOUNCE = 500; // 500ms

function preload() {
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(640, 480);
  
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);
  
  port = createSerial();
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 9600);
  }
  connectBtn = createButton("Connect to Arduino");
  connectBtn.position(40, 10);
  connectBtn.mousePressed(connectBtnClick);
  
  redTimeSlider = createSlider(100, 5000, 2000);
  redTimeSlider.position(40, 245);
  redTimeSlider.size(150);
  redTimeSlider.input(changeSlider);
  
  yellowTimeSlider = createSlider(100, 5000, 500);
  yellowTimeSlider.position(40, 285);
  yellowTimeSlider.size(150);
  yellowTimeSlider.input(changeSlider);
  
  greenTimeSlider = createSlider(100, 5000, 3000);
  greenTimeSlider.position(40, 325);
  greenTimeSlider.size(150);
  greenTimeSlider.input(changeSlider);
  
  textSize(16);
  textAlign(LEFT, CENTER);
}

function draw() {
  background(220);
  
  image(video, 0, 0, 640, 480);
  let gesture = "Unknown";
  let angle = 0;
  
  if (hands.length > 0) {
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
      angle = getHandAngle(hand);
      gesture = detectGesture(hand);
      
      for (let j = 0; j < hand.keypoints.length; j++) {
        let keypoint = hand.keypoints[j];
        fill(255, 0, 0);
        noStroke();
        circle(640 - keypoint.x, keypoint.y, 10);
      }
      
      fill(255);
      textSize(20);
      text("각도: " + nf(angle, 2, 2) + "°", 40, 380 + i * 50);
      text("동작: " + gesture, 40, 400 + i * 50);
      
      // LED 시간 조절 (각 제스처에 따라)
      if (gesture === "Down ring") { // 빨간 LED
        let mappedValue = getMappedLEDTime(angle);
        redTimeSlider.value(mappedValue);
        console.log("Red LED time set to: " + mappedValue);
      } else if (gesture === "Down index") { // 파란 LED (LED 시간 조절만)
        let mappedValue = getMappedLEDTime(angle);
        greenTimeSlider.value(mappedValue);
        console.log("Blue LED time set to: " + mappedValue);
      } else if (gesture === "Down middle") { // 노란 LED
        let mappedValue = getMappedLEDTime(angle);
        yellowTimeSlider.value(mappedValue);
        console.log("Yellow LED time set to: " + mappedValue);
      }
      
      // ── 모드 전환 처리 ──
      // 토글 대상 제스처: "Fist", "blink", "pinkyUp Sign"
      let toggleGestures = ["Fist", "blink", "pinkyUp Sign"];
      
      // 디바운스 조건: 마지막 모드 전환 후 MODE_DEBOUNCE 시간 이상 지났는지 체크
      if (millis() - lastModeUpdateTime > MODE_DEBOUNCE) {
        if (lockedMode !== "") {
          if (toggleGestures.indexOf(gesture) === -1) {
            lockedMode = "";
            sendModeCommand(gesture);
            lastSentMode = gesture;
            lastModeUpdateTime = millis();
            console.log("Locked mode released, mode set to: " + gesture);
          }
        } else {
          if (toggleGestures.indexOf(gesture) !== -1) {
            lockedMode = gesture;
            sendModeCommand(gesture);
            lastSentMode = gesture;
            lastModeUpdateTime = millis();
            console.log("Locked mode set to: " + gesture);
          } else {
            if (gesture !== lastSentMode) {
              if (gesture !== "Down index") { // "Down index"은 모드 전환 없이 LED 시간 조절만
                sendModeCommand(gesture);
                lastModeUpdateTime = millis();
              }
              lastSentMode = gesture;
            }
          }
        }
      }
    }
  }
  
  if (port.available()) {
    let str = port.readUntil("\n").trim();
    if (str.length > 0) {
      console.log("Serial Data Received: " + str);
      let data = str.split(",");
      if (data.length === 3) {
        arduinoColor = data[0];
        arduinoBrightness = int(data[1]);
        arduinoMode = data[2];
      }
    }
  }
  
  if (arduinoMode === "BLINKING") {
    if (millis() - lastBlinkMillis >= BLINK_INTERVAL) {
      blinkState = !blinkState;
      lastBlinkMillis = millis();
    }
  } else {
    blinkState = true;
  }
  
  let barX = 40, barY = 130, barWidth = 310, barHeight = 7;
  let brightnessBar = map(arduinoBrightness, 0, 255, 0, barWidth);
  fill(180);
  rect(barX, barY, barWidth, barHeight, 5);
  fill(0, 200, 0);
  rect(barX, barY, brightnessBar, barHeight, 5);
  
  drawTrafficLight(120, "red");
  drawTrafficLight(200, "yellow");
  drawTrafficLight(280, "green");
  
  fill(0);
  text("밝기: " + arduinoBrightness, 40, 160);
  text("LED 상태: " + arduinoColor, 40, 190);
  text("모드: " + arduinoMode, 40, 220);
  
  text("빨간불 시간: " + redTimeSlider.value() + "ms", 210, 255);
  text("노란불 시간: " + yellowTimeSlider.value() + "ms", 210, 295);
  text("초록불 시간: " + greenTimeSlider.value() + "ms", 210, 335);
  
  changeSlider();
}

function gotHands(results) {
  hands = results;
}

function getHandAngle(hand) {
  let wrist = hand.keypoints[0];
  let indexMCP = hand.keypoints[5];
  let dx = indexMCP.x - wrist.x;
  let dy = indexMCP.y - wrist.y;
  let angle = degrees(atan2(dy, dx));
  if (angle < 0) {
    angle += 360;
  }
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

// 수정된 isFingerUp: tip이 base보다 10픽셀 이상 위에 있어야 'up'으로 판단
function isFingerUp(hand, tipIndex, baseIndex) {
  return hand.keypoints[tipIndex].y < hand.keypoints[baseIndex].y - 10;
}

function isThumbHorizontal(hand) {
  let base = hand.keypoints[2];
  let tip = hand.keypoints[4];
  let dx = tip.x - base.x;
  let dy = tip.y - base.y;
  return abs(dx) > abs(dy);
}

function detectGesture(hand) {
  let indexUp = isFingerUp(hand, 8, 5);
  let middleUp = isFingerUp(hand, 12, 9);
  let ringUp = isFingerUp(hand, 16, 13);
  let pinkyUp = isFingerUp(hand, 20, 17);
  
  if (!isThumbHorizontal(hand) && indexUp && middleUp && !ringUp && pinkyUp) {
    return "Down ring"; // red value
  } else if (!indexUp && middleUp && ringUp && pinkyUp) {
    return "Down index";   // blue value (LED 시간 조절만)
  } else if (indexUp && middleUp && ringUp && pinkyUp) {
    return "Open Hand";  // 기본 상태
  } else if (isThumbHorizontal(hand) && !indexUp && !middleUp && !ringUp && !pinkyUp) {
    return "Fist";       // emergency (토글 대상)
  } else if (isThumbHorizontal(hand) && indexUp && !middleUp && !ringUp && pinkyUp) {
    return "blink";      // blinking (토글 대상)
  } else if (indexUp && !middleUp && ringUp && pinkyUp) {
    return "Down middle"; // yellow value
  } else if (!indexUp && !middleUp && !ringUp && pinkyUp) {
    return "pinkyUp Sign"; // on/off (토글 대상)
  }
  return "Unknown";
}

function getMappedLEDTime(angle) {
  let clampedAngle = constrain(angle, 45, 135);
  return int(map(clampedAngle, 45, 135, 100, 5000));
}

function sendModeCommand(gesture) {
  let command = "";
  switch (gesture) {
    case "Down ring":
      command = "R";
      break;
    case "Open Hand":
      command = "OPEN";
      break;
    case "Fist":
      command = "EMERGENCY";
      break;
    case "blink":
      command = "BLINKING";
      break;
    case "Down middle":
      command = "Y";
      break;
    case "pinkyUp Sign":
      command = "ONOFF";
      break;
    default:
      command = "UNKNOWN";
      break;
  }
  let fullCommand = "MODE:" + command + "\n";
  port.write(fullCommand);
  console.log("Sent mode command: " + fullCommand);
}

function changeSlider() {
  let data = redTimeSlider.value() + "," +
             yellowTimeSlider.value() + "," +
             greenTimeSlider.value() + "\n";
  port.write(data);
  console.log("Sent slider values: " + data);
}

function drawTrafficLight(x, colorName) {
  let c = [80, 80, 80];
  
  if (arduinoMode === "OFF") {
    // 모두 꺼진 상태
  } else if (arduinoMode === "EMERGENCY") {
    if (colorName === "red") {
      c = [255, 0, 0];
    } else {
      c = [50, 50, 50];
    }
  } else if (arduinoMode === "BLINKING") {
    if (blinkState) {
      if (colorName === "red")    c = [255, 0, 0];
      if (colorName === "yellow") c = [255, 255, 0];
      if (colorName === "green")  c = [0, 255, 0];
    } else {
      c = [50, 50, 50];
    }
  } else if (arduinoMode === "ON") {
    let currentLetter = arduinoColor;
    if (colorName === "red") {
      if (currentLetter === "R") {
        c = [255, 0, 0];
      } else {
        c = [50, 0, 0];
      }
    } else if (colorName === "yellow") {
      if (currentLetter === "Y") {
        c = [255, 255, 0];
      } else {
        c = [70, 70, 0];
      }
    } else if (colorName === "green") {
      if (currentLetter === "G") {
        c = [0, 255, 0];
      } else if (currentLetter === "B") {
        c = [0, 60, 0];
      } else {
        c = [0, 40, 0];
      }
    }
  }
  fill(c);
  circle(x, 80, 40);
}

function connectBtnClick() {
  if (port.opened()) {
    port.close();
  } else {
    port.open(9600);
  }
}