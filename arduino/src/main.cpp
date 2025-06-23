#include <Arduino.h>
#include "freertos/FreeRTOS.h"

void serialListener();
void soundMixer();

uint32_t taskCount[2]; 

TaskHandle_t SerialListenerTask;
TaskHandle_t SoundMixingTask;

void setup()
{
    Serial.begin(115200);
}



void loop()
{
    
}

void serialListner()
{

}

