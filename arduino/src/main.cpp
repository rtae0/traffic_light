#include <Arduino.h>
#include <TaskScheduler.h>
#include <PinChangeInterrupt.h>

// ------------------- 핀 설정 -------------------
const int EMERGENCY_BUTTON = 2; // 비상 버튼 핀
const int BLINKING_BUTTON = 4;  // 점멸 버튼 핀
const int ON_OFF_BUTTON = 6;    // ON/OFF 버튼 핀

const int RED_LED = 9;     // 빨간 LED 핀
const int YELLOW_LED = 10; // 노란 LED 핀
const int GREEN_LED = 11;  // 초록 LED 핀

const int POT_PIN = A0; // 가변저항 핀

// ------------------- 모드 및 상태 -------------------
enum Mode
{
    OFF,       // 시스템 꺼짐
    EMERGENCY, // 비상 모드 (빨간불만 켜짐)
    BLINKING,  // 모든 LED가 점멸
    NORMAL     // 정상 교통 신호 모드
};

Mode currentMode = NORMAL; // 초기 상태: NORMAL 모드

// NORMAL 모드에서의 신호 상태 (0=RED, 1=YELLOW, 2=GREEN, 3=GREEN_BLINK)
int trafficState = 0;

// ------------------- 시간 설정(기본값) -------------------
int RED_TIME = 2000;
int YELLOW_TIME = 500;
int GREEN_TIME = 2000;

// LED 점멸 간격 (BLINKING 모드에서 사용)
const int BLINK_INTERVAL = 500;

// ------------------- 전역 변수 -------------------
Scheduler ts;                                          // TaskScheduler 객체 생성
Task tStateMachine(50, TASK_FOREVER, NULL, &ts, true); // 50ms 간격으로 stateMachineTask 실행

unsigned long lastStateChange = 0; // 마지막 상태 변경 시간
int ledBrightness = 255;           // 가변저항 값으로 조절할 LED 밝기 (0~255)

// Green LED 점멸 상태 저장 변수
bool gGreenLEDIsOn = false;

// ------------------- 함수 선언 -------------------
void stateMachineTask();
void onEmergencyButton();
void onBlinkingButton();
void onPowerButton();
void receiveTimeFromP5();
void sendStateToP5(const String &mode);
String getColorName(int state);

void setup()
{
    Serial.begin(9600);

    // LED 핀을 출력으로 설정
    pinMode(RED_LED, OUTPUT);
    pinMode(YELLOW_LED, OUTPUT);
    pinMode(GREEN_LED, OUTPUT);

    // 버튼 핀을 입력 풀업 모드로 설정 (LOW가 눌림 상태)
    pinMode(EMERGENCY_BUTTON, INPUT_PULLUP);
    pinMode(BLINKING_BUTTON, INPUT_PULLUP);
    pinMode(ON_OFF_BUTTON, INPUT_PULLUP);

    // 버튼 인터럽트 설정
    attachPCINT(digitalPinToPCINT(EMERGENCY_BUTTON), onEmergencyButton, CHANGE);
    attachPCINT(digitalPinToPCINT(BLINKING_BUTTON), onBlinkingButton, CHANGE);
    attachPCINT(digitalPinToPCINT(ON_OFF_BUTTON), onPowerButton, CHANGE);

    // stateMachineTask 함수를 주기적으로 실행하도록 설정
    tStateMachine.setCallback(stateMachineTask);
}

void loop()
{
    receiveTimeFromP5(); // p5.js에서 시간 데이터를 받아오기
    ts.execute();        // TaskScheduler 실행
}

// --------------------------------------------------
// 버튼 인터럽트
// --------------------------------------------------
void onEmergencyButton()
{
    // 비상 버튼이 눌렸을 때 (LOW 상태일 때)
    if (digitalRead(EMERGENCY_BUTTON) == LOW)
    {
        // 현재 모드가 비상 모드라면 NORMAL 모드로 변경
        if (currentMode == EMERGENCY)
        {
            currentMode = NORMAL;
            trafficState = 0; // 신호등 상태를 초기화
        }
        else
        {
            // 그렇지 않다면 비상 모드로 전환
            currentMode = EMERGENCY;
        }
    }
}

void onBlinkingButton()
{
    if (digitalRead(BLINKING_BUTTON) == LOW)
    {
        if (currentMode == BLINKING)
        {
            currentMode = NORMAL;
            trafficState = 0;
        }
        else
        {
            currentMode = BLINKING;
        }
    }
}

void onPowerButton()
{
    if (digitalRead(ON_OFF_BUTTON) == LOW)
    {
        if (currentMode == OFF)
        {
            currentMode = NORMAL;
            trafficState = 0;
        }
        else
        {
            currentMode = OFF;
        }
    }
}

// --------------------------------------------------
// stateMachineTask: 50ms 간격
// --------------------------------------------------
void stateMachineTask()
{
    // 가변저항으로 밝기값 읽어오기
    ledBrightness = map(analogRead(POT_PIN), 0, 1023, 0, 255);

    static bool greenBlinkActive = false;
    static unsigned long greenBlinkStart = 0;
    static unsigned long greenBlinkLastToggle = 0;
    static int greenBlinkToggleCount = 0;
    static bool greenLEDState = false; // stateMachineTask 내에서만 사용하는 Green LED ON/OFF

    switch (currentMode)
    {
    case OFF:
        digitalWrite(RED_LED, LOW);
        digitalWrite(YELLOW_LED, LOW);
        digitalWrite(GREEN_LED, LOW);
        // Green LED 상태를 전역 변수에 반영
        gGreenLEDIsOn = false;
        sendStateToP5("OFF");
        break;

    case EMERGENCY:
        digitalWrite(RED_LED, HIGH);
        digitalWrite(YELLOW_LED, LOW);
        digitalWrite(GREEN_LED, LOW);
        // Green LED 상태를 전역 변수에 반영
        gGreenLEDIsOn = false;
        sendStateToP5("EMERGENCY");
        break;

    case BLINKING:
    {
        static unsigned long lastBlink = 0;
        static bool ledState = false;
        if (millis() - lastBlink >= BLINK_INTERVAL)
        {
            ledState = !ledState;
            digitalWrite(RED_LED, ledState);
            digitalWrite(YELLOW_LED, ledState);
            digitalWrite(GREEN_LED, ledState);
            lastBlink = millis();
        }
        // Green LED 상태를 전역 변수에 반영
        gGreenLEDIsOn = digitalRead(GREEN_LED);
        sendStateToP5("BLINKING");
        break;
    }

    case NORMAL:
    {
        unsigned long now = millis();

        // GREEN 끝난 뒤 깜빡이는 상태
        if (trafficState == 3)
        {
            if (now - greenBlinkStart >= 2000 || greenBlinkToggleCount >= 6)
            {
                trafficState = 0;
                lastStateChange = now;
                greenBlinkActive = false;
                digitalWrite(GREEN_LED, LOW);
                gGreenLEDIsOn = false;
            }
            else
            {
                if (now - greenBlinkLastToggle >= 333)
                {
                    greenLEDState = !greenLEDState;
                    analogWrite(GREEN_LED, greenLEDState ? ledBrightness : 0);
                    greenBlinkLastToggle = now;
                    greenBlinkToggleCount++;
                    // Green LED 상태를 전역 변수에 반영
                    gGreenLEDIsOn = greenLEDState;
                }
                digitalWrite(RED_LED, LOW);
                digitalWrite(YELLOW_LED, LOW);
            }
            sendStateToP5("ON");
            break;
        }

        switch (trafficState)
        {
        case 0: // RED
            analogWrite(RED_LED, ledBrightness);
            digitalWrite(YELLOW_LED, LOW);
            digitalWrite(GREEN_LED, LOW);
            gGreenLEDIsOn = false;

            if (now - lastStateChange > RED_TIME)
            {
                trafficState = 1;
                lastStateChange = now;
            }
            break;

        case 1: // YELLOW
            digitalWrite(RED_LED, LOW);
            analogWrite(YELLOW_LED, ledBrightness);
            digitalWrite(GREEN_LED, LOW);
            gGreenLEDIsOn = false;

            if (now - lastStateChange > YELLOW_TIME)
            {
                trafficState = 2;
                lastStateChange = now;
            }
            break;

        case 2: // GREEN
            digitalWrite(RED_LED, LOW);
            digitalWrite(YELLOW_LED, LOW);
            analogWrite(GREEN_LED, ledBrightness);
            gGreenLEDIsOn = true;

            if (now - lastStateChange > GREEN_TIME)
            {
                trafficState = 3;
                greenBlinkActive = true;
                greenBlinkStart = now;
                greenBlinkLastToggle = now;
                greenBlinkToggleCount = 0;
                greenLEDState = false;
                digitalWrite(GREEN_LED, LOW);
                gGreenLEDIsOn = false;

                lastStateChange = now;
            }
            break;
        }
        sendStateToP5("ON");
        break;
    }
    }
}

// --------------------------------------------------
// p5.js -> 아두이노 : "R,Y,G" 형태
// --------------------------------------------------
void receiveTimeFromP5()
{
    if (Serial.available())
    {
        String input = Serial.readStringUntil('\n');
        input.trim();

        int r, y, g;
        if (sscanf(input.c_str(), "%d,%d,%d", &r, &y, &g) == 3)
        {
            RED_TIME = r;
            YELLOW_TIME = y;
            GREEN_TIME = g;
        }
    }
}

// --------------------------------------------------
// 아두이노 -> p5.js (시간은 보내지 않음)
// --------------------------------------------------
void sendStateToP5(const String &mode)
{
    // trafficState에 따른 색상 문자열 얻어오기
    String color = getColorName(trafficState);

    Serial.print(color); // 예: "R", "Y", "G", "B"
    Serial.print(",");
    Serial.print(ledBrightness);
    Serial.print(",");
    Serial.println(mode);
}

// --------------------------------------------------
// state(0~3) + gGreenLEDIsOn(ON/OFF)에 따라 문자열 리턴
// --------------------------------------------------
String getColorName(int state)
{
    switch (state)
    {
    case 0:
        return "R";
    case 1:
        return "Y";
    case 2:
        return "G";
    case 3:
        // 깜빡이는 상태일 때, 실제 LED가 켜져 있으면 "G", 꺼져 있으면 "B"
        return (gGreenLEDIsOn ? "G" : "B");
    default:
        return "X";
    }
}