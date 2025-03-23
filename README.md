# Arduino + p5.js Traffic Light Controller

영상링크 : https://youtu.be/aVH0v-0G_DE

이 프로젝트는 **Arduino와 p5.js**를 활용하여 교통 신호 제어 시스템을 구현하는 프로젝트입니다.  
Arduino에서 LED 신호등을 제어하고, 웹 브라우저에서 p5.js를 통해 신호 변경 및 제어 상태를 확인할 수 있습니다.  

## 주요 기능
- 교통 신호 시스템 구현
  - 정상 신호 모드 (RED → YELLOW → GREEN → GREEN BLINK)
  - 비상 모드 (빨간불 ON)
  - 점멸 모드 (모든 LED 깜빡임)
  - 전원 OFF 모드 (모든 LED OFF)
- 가변저항(POT)으로 LED 밝기 조절
- p5.js 웹 UI를 통해 신호등 시간 변경 가능
- WebSerial을 활용한 실시간 Arduino ↔ 웹 통신

## 사용 기술
- **Arduino (PlatformIO)**
- **p5.js (JavaScript)**
- **WebSerial API**
- **HTML / CSS / JavaScript**
- **VS Code + PlatformIO**

---
![arduinoCircuit_simulation](images/arduinoCircuit_simulation.png)
![arduinoCircuit](images/arduinoCircuit.png)
## 핀 번호 및 기능 설명
| 기능              | 핀 번호 | 설명 |
|------------------|--------|---------------------------------|
| 비상 버튼       | `2`    | 비상 모드 ON/OFF |
| 점멸 버튼       | `4`    | 점멸 모드 ON/OFF |
| 전원 ON/OFF 버튼 | `6`    | 전체 시스템 ON/OFF |
| 빨간 LED        | `9`    | 신호등의 RED |
| 노란 LED        | `10`   | 신호등의 YELLOW |
| 초록 LED        | `11`   | 신호등의 GREEN |
| 가변저항 (POT)  | `A0`   | LED 밝기 조절 |

---
## 프로젝트 구조
```
TRAFFIC_LIGHT
├── arduino/              # Arduino 관련 코드 폴더
│   ├── src/              # Arduino 소스 코드
│   │   ├── main.cpp      # Arduino 코드 (LED 및 버튼 제어)
│   ├── include/          # 프로젝트 헤더 파일 (필요 시 추가)
│   ├── lib/              # 추가 라이브러리 폴더 (필요 시 추가)
│   ├── test/             # 테스트 관련 파일
│   ├── .gitignore        # Git 무시할 파일 설정
│   ├── platformio.ini    # PlatformIO 설정 파일
├── .pio/                 # PlatformIO 빌드 파일 (자동 생성됨)
├── .vscode/              # VS Code 설정 파일
│   ├── c_cpp_properties.json
│   ├── extensions.json
│   ├── launch.json
├── p5/                   # 웹 UI 파일 (p5.js)
│   ├── index.html        # 웹 UI (p5.js + WebSerial 포함)
│   ├── sketch.js         # p5.js 스크립트 (Arduino와 시리얼 통신)
│   ├── style.css         # 웹 UI 스타일 (선택 사항)
├── README.md             # 프로젝트 설명 파일
```
---


## 📌 사용 방법  

### 🎬 1. **아두이노와 웹 UI 연결하기**  
1. **아두이노 보드를 PC에 연결**합니다.  
2. 아두이노가 정상적으로 인식되었는지 확인합니다.  
3. `Arduino IDE` 또는 `PlatformIO`를 사용하여 아두이노 코드(`.ino` 파일)를 업로드합니다.  
4. **p5.js 웹 UI를 실행**한 후, `Connect to Arduino` 버튼을 눌러 연결합니다.  

---

### 🔘 2. **신호등 모드 변경하기**  
아두이노 보드에 연결된 버튼을 눌러 신호등 모드를 변경할 수 있습니다.  

- **비상 버튼(2번 핀, EMERGENCY 모드)** → 빨간불만 켜짐  
- **점멸 버튼(4번 핀, BLINKING 모드)** → 모든 LED가 500ms 간격으로 깜빡임  
- **ON/OFF 버튼(6번 핀, OFF/NORMAL 모드 전환)** → 신호등을 끄거나 다시 켜기  

**🔹 버튼 조작 예시**  
1. `비상 버튼`을 누르면 모든 신호가 꺼지고 빨간불만 켜집니다.  
2. `점멸 버튼`을 누르면 모든 불이 깜빡이는 상태가 됩니다.  
3. `ON/OFF 버튼`을 누르면 신호등이 꺼지거나 다시 정상 작동을 합니다.  

---

### 🖥️ 3. **웹 UI에서 신호 시간 조절하기**  
웹 UI에서 신호등의 시간을 직접 설정할 수 있습니다.  

1. `빨간불`, `노란불`, `초록불`의 지속 시간을 조절하는 **슬라이더를 조작**합니다.  
2. 슬라이더를 조정하면 변경된 값이 **아두이노로 전송**됩니다.  
3. 설정한 시간이 반영된 신호등이 **즉시 업데이트**됩니다.  

**🔹 웹 UI 조작 예시**  
- **빨간불 지속 시간을 2초 → 4초로 변경**하면, 신호 주기가 조정됨  
- **노란불 지속 시간을 0.5초 → 1초로 변경**하면, 신호 전환이 늦어짐  
- **초록불 지속 시간을 2초 → 3초로 변경**하면, 초록불이 더 오래 유지됨  

---

### 🎛️ 4. **가변저항을 사용하여 LED 밝기 조절**  
아두이노 보드에 연결된 **가변저항(A0 핀)**을 돌려 LED의 밝기를 조절할 수 있습니다.  
- 밝기를 조절하면 웹 UI에서 **밝기 막대 그래프**가 실시간으로 업데이트됩니다.  
- LED 밝기는 `0 ~ 255` 범위로 조절됩니다.  

**🔹 조작 예시**  
1. 가변저항을 오른쪽으로 돌리면 → LED 밝기가 증가  
2. 가변저항을 왼쪽으로 돌리면 → LED 밝기가 감소  
3. 웹 UI에서 **실시간으로 밝기 변경 상황을 확인 가능**  

---

## 📌 시스템 개요  

### 🔹 **아두이노 (Arduino)**
- **신호등 상태를 관리하고, 웹 UI와 시리얼 통신을 수행**합니다.  
- **버튼 입력을 받아 신호등 모드를 변경**합니다.  
- **가변저항 입력을 받아 LED 밝기를 조절**합니다.  
- **p5.js에서 받은 데이터를 바탕으로 신호 시간 설정을 조정**합니다.  

### 🔹 **p5.js (웹 UI)**
- **아두이노의 신호등 상태를 실시간으로 표시**합니다.  
- **슬라이더를 이용하여 신호 시간 조절 기능을 제공합니다.**  
- **아두이노에서 LED 밝기 데이터를 받아 그래프 형태로 출력**합니다.  

---

## 기능 상세 설명
### Arduino 동작
- `src/main.cpp`에서 **TaskScheduler**를 사용하여 **50ms 간격**으로 신호를 업데이트합니다.
- 버튼 인터럽트(`attachPCINT`)를 이용해 모드를 변경합니다.
- `Serial.readStringUntil('\n')`을 통해 **p5.js에서 전송한 신호 변경 데이터**를 수신합니다.

### p5.js(Web UI) 동작
- `p5.webserial.js`를 사용하여 **Arduino와 시리얼 통신**합니다.
- 신호등 상태를 시각적으로 표시하고, 버튼을 눌러 제어할 수 있습니다.
- 사용자가 입력한 시간 값(`2000,500,2000` 형식)을 Arduino로 전송하여 신호 변경 속도를 조절할 수 있습니다.

---
## 📌 프로젝트 주요 함수 정리  

아두이노와 p5.js 간의 신호등 제어 시스템에서 사용된 주요 함수들을 정리한 문서입니다.  
각 함수는 신호등의 동작을 관리하고, 아두이노와 p5.js 간의 데이터 송수신을 담당합니다.  

---

## 🔹 아두이노 (Arduino) 주요 함수  

### `void setup()`
아두이노 초기 설정을 담당하는 함수입니다.  
- `Serial.begin(9600);` → p5.js와의 시리얼 통신을 설정합니다.  
- `pinMode(LED_PIN, OUTPUT);` → LED 핀을 출력 모드로 설정합니다.  
- `pinMode(BUTTON_PIN, INPUT_PULLUP);` → 버튼 핀을 입력 모드로 설정하고 내부 풀업 저항을 활성화합니다.  
- `attachPCINT(digitalPinToPCINT(BUTTON_PIN), onButtonPress, CHANGE);` → 버튼 인터럽트를 설정합니다.  
- `tStateMachine.setCallback(stateMachineTask);` → TaskScheduler를 이용해 신호등 상태를 주기적으로 업데이트합니다.  

---

### `void loop()`
아두이노의 메인 실행 루프입니다.  
- `receiveTimeFromP5();` → p5.js에서 신호등 시간을 가져옵니다.  
- `ts.execute();` → TaskScheduler를 실행하여 `stateMachineTask`를 주기적으로 호출합니다.  

---

### `void stateMachineTask()`
신호등의 상태를 관리하는 함수로, 50ms마다 실행됩니다.  
- `ledBrightness = map(analogRead(POT_PIN), 0, 1023, 0, 255);` → 가변저항 값을 읽어 LED 밝기를 설정합니다.  
- `switch (currentMode)`를 이용하여 현재 모드에 따라 신호등을 제어합니다.  

##### **각 모드별 동작**
1. `OFF` 모드 → 모든 LED OFF  
2. `EMERGENCY` 모드 → 빨간불만 ON  
3. `BLINKING` 모드 → 모든 LED 깜빡임  
4. `NORMAL` 모드 → 빨간 → 노란 → 초록 → 초록 깜빡임 순서대로 진행  

---

### `void receiveTimeFromP5()`
p5.js에서 신호 시간을 받아오는 함수입니다.  
- `Serial.available()`을 통해 **새로운 데이터가 들어왔는지 확인**합니다.  
- 데이터가 있으면 `sscanf()`를 이용해 **빨간불, 노란불, 초록불 시간을 분리하여 저장**합니다.  
- **다음 신호 사이클에서 변경된 시간이 적용됨**  

---

### `void sendStateToP5(const String &mode)`
아두이노의 현재 신호 상태를 p5.js로 전송하는 함수입니다.  
- `getColorName()` 함수를 사용하여 **현재 신호 색상을 문자열로 변환**합니다.  
- LED 밝기 값과 현재 모드를 함께 전송하여 **웹 UI에서 실시간으로 표시할 수 있도록 설정**합니다.  

---

### `String getColorName(int state)`
현재 신호 상태를 문자열로 변환하는 함수입니다.  
- `trafficState` 값에 따라 `"R"`, `"Y"`, `"G"`, `"B"` 값을 반환합니다.  
- `"B"` 값은 **초록불이 깜빡이는 상태를 의미**합니다.  

---

## 🔹 p5.js 주요 함수  

### `function setup()`
웹 UI 초기 설정을 담당하는 함수입니다.  
- `createCanvas(400, 370);` → 신호등을 표시할 캔버스를 생성합니다.  
- `port = createSerial();` → 아두이노와의 시리얼 통신을 설정합니다.  
- `createButton("Connect to Arduino")` → 아두이노 연결 버튼을 생성합니다.  
- `createSlider(100, 5000, 2000);` → 신호등 시간을 조절하는 슬라이더를 생성합니다.  

---

### `function draw()`
UI 화면을 지속적으로 업데이트하는 함수입니다.  
- `background(220);` → 화면을 새로 그려줍니다.  
- `port.readUntil("\n").trim();` → 아두이노에서 받은 데이터를 읽어 저장합니다.  
- `drawTrafficLight(120, "red");` → 빨간불을 화면에 표시합니다.  
- `drawTrafficLight(200, "yellow");` → 노란불을 화면에 표시합니다.  
- `drawTrafficLight(280, "green");` → 초록불을 화면에 표시합니다.  

---

### `function changeSlider()`
웹 UI에서 신호등 시간을 변경하면 아두이노에 새로운 값을 전송하는 함수입니다.  
- `port.write(data);` → 변경된 신호 시간 데이터를 아두이노로 전송합니다.  

---

### `function drawTrafficLight(x, colorName)`
신호등의 색상을 웹 UI에 표시하는 함수입니다.  
- `fill(c);` → 현재 신호 상태에 따라 색상을 설정합니다.  
- `circle(x, 80, 40);` → 신호등 모양을 화면에 출력합니다.  

---

### `function connectBtnClick()`
아두이노와 웹 UI 간의 연결을 제어하는 함수입니다.  
- `port.open(9600);` → 버튼을 클릭하면 아두이노와 연결합니다.  
- `port.close();` → 버튼을 다시 클릭하면 연결을 해제합니다.  

✅ **이 함수들을 활용하여 신호등의 동작을 제어하고, 아두이노와 p5.js 간 데이터를 주고받을 수 있습니다.**
---
## 필요 환경
### 하드웨어
- Arduino Uno (또는 호환 보드)
- LED (빨강, 노랑, 초록)
- 저항 (각 LED에 맞는 저항값 사용)
- 버튼 3개
- 가변저항 (POT)

### 소프트웨어
- VS Code
- PlatformIO
- 웹 브라우저

---

## 참고 자료
- [p5.js 공식 문서](https://p5js.org/)
- [WebSerial API](https://github.com/gohai/p5.webserial)
- [PlatformIO 공식 문서](https://platformio.org/)
- [Arduino 공식 문서](https://www.arduino.cc/reference/en/)

---

## 라이선스
이 프로젝트는 MIT License를 따릅니다.
