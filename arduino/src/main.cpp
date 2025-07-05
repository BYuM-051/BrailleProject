#include <Arduino.h>

/*
PinMaps

Arduino |   ESP |Feature    
D2      |   5   |SW1
D3      |   6   |SW2
D4      |   7   |SW3
D5      |   8   |SW4
D6      |   9   |SW5
D7      |   10  |SW6
D8      |   17  |SW7
D9      |   18  |SW8
D10     |   21  |WS2812B_DIN
A0      |   1   |I2S_LRC
A1      |   2   |I2S_BLCK
A2      |   3   |I2S_DIN
*/

#define _DEBUG_

#include "../include/soundEngine.h"
#include "../include/buttonEffect_Alone.h"
#include "../include/buttonEffect1.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "driver/i2s.h"

#define MAX_INPUT_SWITCHES 8
const int InputSwitchPin[MAX_INPUT_SWITCHES] = 
{5, 6, 7, 8, 9, 10, 17, 18};

#define DEBOUNCE_TIME_MS 10
unsigned long previousPressedTime[MAX_INPUT_SWITCHES];

volatile bool buttonPressedFlag = false;
volatile int pressedSwitchPin = -1;

const int I2S_LRC_PIN = 1;
const int I2S_BCLK_PIN = 2;
const int I2S_DOUT_PIN = 3;

bool onButtonEvent(int8_t buttinID);

void setupI2S();
void serialListener();

void soundEngineThread(void* param);
void soundPlay(uint8_t soundID);
void soundEngine_LifeCycleManager(void* param);

void isr_Button(void* pin);

uint32_t taskCount[2]; 

//TaskHandle_t SerialListenerTask;
//TaskHandle_t SoundMixingTask;

SoundEngine* soundEngine;

void setup()
{
    //Serial initialize
    Serial.begin(115200);

    //I2S initialize

    //TODO : modify sound to boot sound [current it is sample sound]
    delay(3000);
    size_t bytes_written;
    //i2s_write(I2S_NUM_0, sound, sound_len * sizeof(int16_t), &bytes_written, 0);

    Serial.println(bytes_written);

    //soundEngineThreadDispatch
    // NOTE : moved into soundEngine.h

    //inputswitch initialize
    gpio_install_isr_service(0);

    for(int i = 0 ; i < MAX_INPUT_SWITCHES ; i++)
    {
        const gpio_config_t switchPinConfig = 
        {
            .pin_bit_mask = 1ULL << InputSwitchPin[i],
            .mode = GPIO_MODE_INPUT,
            .pull_up_en = GPIO_PULLUP_ENABLE,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .intr_type = GPIO_INTR_POSEDGE
        };
        gpio_config(&switchPinConfig);
    }

    for(int i = 0 ; i < MAX_INPUT_SWITCHES ; i++)
    {
        esp_err_t returnValue = gpio_isr_handler_add((gpio_num_t)InputSwitchPin[i], isr_Button, (void*)InputSwitchPin[i]);
        if(returnValue != ESP_OK)
        {
            #ifdef _DEBUG_
            Serial.print(i);
            Serial.print(" button has failed to init isr function : ");
            Serial.println(returnValue);
            #endif
        }
    }

    //TODO : important!!!!!!!!!!!!!!!!!! 5 6 17 18 pin switch has broken. I decided removing these pins
    gpio_isr_handler_remove((gpio_num_t)5);
    gpio_isr_handler_remove((gpio_num_t)6);
    gpio_isr_handler_remove((gpio_num_t)17);
    gpio_isr_handler_remove((gpio_num_t)18);

    //TODO : WS2812B initialize

    //TODO : Serial Listener Task Dispatch

}

void loop()
{
    

    //handle ISR
    if(buttonPressedFlag)
    {
        #ifdef _DEBUG_
        Serial.print("LOOP_");
        Serial.print("pressedButton : ");
        Serial.println(pressedSwitchPin);
        #endif
        if(!onButtonEvent(pressedSwitchPin)) {Serial.println("false returned from onButtonEvent");}
        buttonPressedFlag = false;
        pressedSwitchPin = -1;
    }
    
    
}

bool onButtonEvent(int8_t buttonPin)
{
    int buttonID = -1;
    for(int i = 0 ; i < MAX_INPUT_SWITCHES ; i++)
    {
        if(buttonPin == InputSwitchPin[i])
        buttonID = i;
    }

    #ifdef _DEBUG_
    Serial.println("ButtonEvent");
    Serial.print("buttonID : ");
    Serial.println(buttonID);
    #endif
    //reset Pressed Button
    buttonPressedFlag = false; // I think I should place this one another place :/

    //software debounce
    unsigned long pressedTime = millis();
    if(pressedTime < (previousPressedTime[buttonID] + DEBOUNCE_TIME_MS)) {return true;}
    previousPressedTime[buttonID] = pressedTime;
    
    #ifdef _DEBUG_
    Serial.println("after debounce code");
    #endif

    soundPlay(0);//TODO : modify argument to buttonify soundID
    //TODO : WS2812B code below here

    return true;
}

void IRAM_ATTR isr_Button(void* pin)
{
    buttonPressedFlag = true;
    pressedSwitchPin = (int)pin;
}



void serialListner()
{

}

void soundPlay(uint8_t soundID)
{

    //TODO : modify code below here enque sound data
    
}

void soundEngine_LifeCycleManager(void* param)
{
    
    //TODO : management sound's itself lifecycle (current Time line pointer)
    
    vTaskDelete(NULL); // it means return; [Check RTOS Thread]
}