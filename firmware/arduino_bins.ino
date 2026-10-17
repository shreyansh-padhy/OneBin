/*
 * OneBin: Physical IoT Smart Waste Sorter Firmware
 * Compatible with Arduino Uno / Nano / Mega / Leonardo & ESP32.
 *
 * Hardware Wiring:
 *   - Servo 1 (Compost - 🟢 Green Lid):    Signal -> Pin 9
 *   - Servo 2 (Recycling - 🔵 Blue Lid):   Signal -> Pin 10
 *   - Servo 3 (Trash - ⚫ Black Lid):       Signal -> Pin 11
 *   - Power: 5V external power supply (common ground with microcontroller)
 *
 * Serial Protocol (9600 baud):
 *   'C' -> Open Compost Lid
 *   'R' -> Open Recycling Lid
 *   'T' -> Open Trash Lid
 *   'X' -> Close all lids immediately
 */

#include <Servo.h>

const int PIN_COMPOST = 9;
const int PIN_RECYCLING = 10;
const int PIN_TRASH = 11;

const int ANGLE_CLOSED = 0;
const int ANGLE_OPEN = 95;
const unsigned long OPEN_DURATION_MS = 4000; // Hold open for 4 seconds then auto-close

Servo servoCompost;
Servo servoRecycling;
Servo servoTrash;

unsigned long lidOpenTime = 0;
int activeLid = 0; // 0 = none, 1 = compost, 2 = recycling, 3 = trash

void closeAllLids() {
  servoCompost.write(ANGLE_CLOSED);
  servoRecycling.write(ANGLE_CLOSED);
  servoTrash.write(ANGLE_CLOSED);
  activeLid = 0;
}

void openCompost() {
  closeAllLids();
  servoCompost.write(ANGLE_OPEN);
  lidOpenTime = millis();
  activeLid = 1;
  Serial.println(F("OK: COMPOST_OPEN"));
}

void openRecycling() {
  closeAllLids();
  servoRecycling.write(ANGLE_OPEN);
  lidOpenTime = millis();
  activeLid = 2;
  Serial.println(F("OK: RECYCLING_OPEN"));
}

void openTrash() {
  closeAllLids();
  servoTrash.write(ANGLE_OPEN);
  lidOpenTime = millis();
  activeLid = 3;
  Serial.println(F("OK: TRASH_OPEN"));
}

void setup() {
  Serial.begin(9600);
  servoCompost.attach(PIN_COMPOST);
  servoRecycling.attach(PIN_RECYCLING);
  servoTrash.attach(PIN_TRASH);
  closeAllLids();
  Serial.println(F("READY: ONEBIN_IOT_ONLINE"));
}

void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == 'C' || cmd == 'c') {
      openCompost();
    } else if (cmd == 'R' || cmd == 'r') {
      openRecycling();
    } else if (cmd == 'T' || cmd == 't') {
      openTrash();
    } else if (cmd == 'X' || cmd == 'x') {
      closeAllLids();
      Serial.println(F("OK: ALL_CLOSED"));
    }
  }

  // Auto-close lid after duration expires
  if (activeLid != 0 && (millis() - lidOpenTime >= OPEN_DURATION_MS)) {
    closeAllLids();
    Serial.println(F("OK: AUTO_CLOSED"));
  }
}
