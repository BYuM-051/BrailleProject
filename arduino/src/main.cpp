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

//#define _DEBUG_
#define _DEBUG_NOW

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

/* 
TODO : add more sounds and refine this section
SoundEngine Section
-----------------------------------------------------------------------
This section initializes the global sound engine instance.

The included headers define sound effect data used by the engine:
- buttonEffect_Alone.h : solo button press sound
    → SoundStruct instance: buttonEffect_Alone
- buttonEffect1.h      : additional layered button effects
    → SoundStruct instance: buttonEffect_1
- buttonEffect2.h      : optional alternate effect
    → SoundStruct instance: buttonEffect_2
(Add more headers and instances as needed)

All sound data is statically defined as `static constexpr` to ensure
safe duplication across compilation units and to avoid linker conflicts.
*/
#include "../include/soundEngine.h"
#include "../include/buttonEffect_Alone.h"
#include "../include/buttonEffect1.h"
SoundEngine* soundEngine;

constexpr int I2S_LRC_PIN = 1;
constexpr int I2S_BCLK_PIN = 2;
constexpr int I2S_DOUT_PIN = 3;

/*
Keyboard (InputSwitch) Section
-----------------------------------------------------------------------
This section initializes the 8-button input system for braille input.

The button configuration provides braille input functionality:
- Button_1 to Button_6: 6-dot braille system inputs
- Button_DEL: Delete/Backspace function
- Button_ENT: Enter/Submit function

Pin mapping and interrupt configuration:
- GPIO 5,6,7,8,9,10,17,18 for button inputs
- Internal pull-up resistors enabled
- Negative edge triggered interrupts
- Software debouncing with 200ms delay

Note: Pins 5,6,17,18 are currently disabled due to hardware issues.
*/
#define MAX_INPUT_SWITCHES 8
const int InputSwitchPin[MAX_INPUT_SWITCHES] = 
{5, 6, 7, 8, 9, 10, 17, 18};

enum ButtonID
{
    None = -1,
    Button_1 = 0,
    Button_2 = 1,
    Button_3 = 2,
    Button_4 = 3,
    Button_5 = 4,
    Button_6 = 5,
    Button_DEL = 6,
    Button_ENT = 7
};

#define DEBOUNCE_TIME_MS 200
unsigned long previousPressedTime[MAX_INPUT_SWITCHES];

volatile bool buttonPressedFlag = false;
volatile int pressedSwitchPin = -1;

bool onButtonEvent(int8_t buttinID);
void isr_Button(void* pin);
ButtonID getButtonID(int8_t buttonPin);

#define _BUTTON_BROKEN_

byte buttonStates = 0;

//Serial Protocol Control Bytes Below Here
constexpr byte ProtocolCMDNewLine = 0b01000000;
constexpr byte ProtocolCMDErase = 0b10000000;
/*
NeoPixel (WS2812B) Section
-----------------------------------------------------------------------
This section initializes the WS2812B LED strip for visual feedback.

The LED configuration provides status indication for button presses:
- 8 LEDs corresponding to each button input
- GPIO 21 (D10) for data line connection
- WS2812B protocol with GRB color format
- ESP32 RMT driver for precise timing

Hardware and library configuration:
- NeoPixelBus library for efficient LED control
- RMT peripheral for accurate timing requirements
- Boot sequence animation on startup
- Real-time status updates for button states

Color Description:
- Green (0, 254, 0): Button is pressed/active
- Black (0, 0, 0): Button is released/inactive  
- Red (254, 0, 0): Error state or invalid input
- Blue (0, 0, 254): System ready or waiting state

Color constants are defined as constexpr for compile-time optimization.
*/
#include "NeoPixelBus.h"

constexpr uint16_t LedCount = 8;
constexpr uint8_t ARGB_DOUT_PIN = 21;

NeoPixelBus<NeoGrbFeature, NeoEsp32Rmt0Ws2812xMethod> argb(LedCount, ARGB_DOUT_PIN);

void argbBootSequence(void* param);
void argbReset();
void serialListnerWrapper(void* param);

constexpr RgbColor Green(0, 254, 0);
constexpr RgbColor Black(0, 0, 0);
constexpr RgbColor Red(254, 0, 0);
constexpr RgbColor Blue(0, 0, 254);
constexpr RgbColor White(255, 255, 255);

//=============================================================================================================

void setup()
{
    //Serial initialize
    delay(1000);
    Serial.begin(115200); // I remember that esp32 doesn need to set baud cuz it has native usb serial

    #ifdef _DEBUG_
    Serial.println("Serial Begin");
    #endif
    
    //WS2812B initialize
    argb.Begin();
    argb.Show();
    
    xTaskCreatePinnedToCore
    (
        argbBootSequence,
        "argbBootSequence",
        1024,
        NULL,
        1,
        NULL,
        1
    );

    //SoundEngine Initialize
    soundEngine = new SoundEngine(I2S_LRC_PIN, I2S_BCLK_PIN, I2S_DOUT_PIN);
    soundEngine->enqueSound(&ButtonEffect_Alone); // TODO : change bootEffect Code

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
            .intr_type = GPIO_INTR_NEGEDGE
        };
        gpio_config(&switchPinConfig);
    }

    for(int i = 0 ; i < MAX_INPUT_SWITCHES ; i++)
    {
        esp_err_t returnValue = gpio_isr_handler_add((gpio_num_t)InputSwitchPin[i], isr_Button, (void*)InputSwitchPin[i]);
        #ifdef _DEBUG_
        if(returnValue != ESP_OK)
        {
            Serial.print(i);
            Serial.print(" button has failed to init isr function : ");
            Serial.println(returnValue);
        }
        #endif
    }

    #ifdef _BUTTON_BROKEN_
    //TODO : important!!!!!!!!!!!!!!!!!! 5 6 17 18 pin switch has broken. I decided removing these pins
    gpio_isr_handler_remove((gpio_num_t)5);
    gpio_isr_handler_remove((gpio_num_t)6);
    gpio_isr_handler_remove((gpio_num_t)17);
    gpio_isr_handler_remove((gpio_num_t)18);
    #endif
    
    // Serial Listener Task Dispatch
    xTaskCreatePinnedToCore
    (
        serialListnerWrapper,
        "serialListnerWrapper",
        2048,
        NULL,
        1,
        NULL,
        1
    );

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
    ButtonID buttonID = getButtonID(buttonPin);
    
    if(buttonID == None) {return false;}

    #ifdef _DEBUG_
    Serial.println("ButtonEvent");
    Serial.print("buttonID : ");
    Serial.println(static_cast<int>(buttonID));
    #endif

    //software debounce
    unsigned long pressedTime = millis();
    int buttonIndex = static_cast<int>(buttonID);
    if(pressedTime < (previousPressedTime[buttonIndex] + DEBOUNCE_TIME_MS)) {return true;}
    previousPressedTime[buttonIndex] = pressedTime;
    
    #ifdef _DEBUG_
    Serial.println("after debounce code");
    Serial.print("buttonID : ");
    Serial.println(static_cast<int>(buttonID));
    #endif

    switch(buttonID)
    {
        case None:
            #ifdef _DEBUG_
            Serial.println("None button pressed");
            #endif
            return false;
        case Button_1:
        case Button_2:
        case Button_3:
        case Button_4:
        case Button_5:
        case Button_6:
            buttonStates ^= (1 << static_cast<int>(buttonID));  // 비트 토글
            (buttonStates & (1 << static_cast<int>(buttonID))) ? 
                argb.SetPixelColor(static_cast<int>(buttonID), Green) :
                argb.SetPixelColor(static_cast<int>(buttonID), Black);
            argb.Show();
            soundEngine->enqueSound(&ButtonEffect_1); // TODO : modify argument to ButtonSound
            return true;
        case Button_DEL:
            if(buttonStates == 0)
            {
                Serial.print(ProtocolCMDErase);
            }
            else
            {
                buttonStates = 0;
                argbReset();
            }
            soundEngine->enqueSound(&ButtonEffect_1); // TODO : modify argument to DeleteSound
            return true;
        case Button_ENT:
            if(buttonStates == 0)
            {
                Serial.print(ProtocolCMDNewLine);
            }
            else
            {
                Serial.print(buttonStates);
                buttonStates = 0;
                argbReset();
            }
            soundEngine->enqueSound(&ButtonEffect_1); // TODO : modify argument to EnterSound
            return true;
        default:
            return false;
    }
    
    return false;
}

void IRAM_ATTR isr_Button(void* pin)
{
    if(gpio_get_level((gpio_num_t)((int)pin)) == LOW)
    {
        buttonPressedFlag = true;
        pressedSwitchPin = (int)pin;
    }
}

void argbBootSequence(void* param)
{
    #ifdef _DEBUG_NOW
    Serial.println("ARGB Boot Sequence");
    #endif
    argbReset();
    for(int i = 0 ; i < LedCount ; i++)
    {
        argb.SetPixelColor(i, Red);
    }
    argb.Show();
    vTaskDelay(200 / portTICK_PERIOD_MS);
    for(int i = 0 ; i < LedCount ; i++)
    {
        argb.SetPixelColor(i, Green);
    }
    argb.Show();
    vTaskDelay(200 / portTICK_PERIOD_MS);
    for(int i = 0 ; i < LedCount ; i++)
    {
        argb.SetPixelColor(i, Blue);
    }
    argb.Show();
    // TODO : NextVersion, I think add more boot sequence animation
    #ifdef _DEBUG_NOW
    Serial.println("ARGB Boot Sequence finished");
    #endif
    vTaskDelete(NULL);
}

void argbReset()
{
    argb.ClearTo(Black);
    argb.Show();
}



ButtonID getButtonID(int8_t buttonPin)
{
    for(int i = 0 ; i < MAX_INPUT_SWITCHES ; i++)
    {
        if(buttonPin == InputSwitchPin[i])
        {
            return static_cast<ButtonID>(i);
        }
    }
    return None;
}


void serialListner()
{
    if (Serial.available()) 
    {
        String input = Serial.readStringUntil('\n');
        input.trim();
        
        #ifdef _DEBUG_
        Serial.print("Received: ");
        Serial.println(input);
        #endif
        
        #ifdef _DEBUG_NOW
        if (input.startsWith("BUTTON_TEST")) 
        {
            // Test all button states and report their current status
            Serial.println("Testing all buttons...");
            for (int i = 0; i < MAX_INPUT_SWITCHES; i++) 
            {
                Serial.print("Button ");
                Serial.print(i);
                Serial.print(" (Pin ");
                Serial.print(InputSwitchPin[i]);
                Serial.print("): ");
                Serial.println(gpio_get_level((gpio_num_t)InputSwitchPin[i]) == LOW ? "PRESSED" : "RELEASED");
            }
        }
        else if (input.startsWith("SOUND_TEST")) 
        {
            // Test sound engine functionality
            Serial.println("Testing sound engine...");
            soundEngine->enqueSound(&ButtonEffect_Alone);
        }
        else if (input.startsWith("LED_TEST")) 
        {
            // Test LED sequence with white color
            Serial.println("Testing LED sequence...");
            argbReset();
            for (int i = 0; i < LedCount; i++) 
            {
                argb.SetPixelColor(i, White);
            }
            argb.Show();
            vTaskDelay(pdMS_TO_TICKS(1000));
            argbReset();
        }
        else if (input.startsWith("STATUS")) 
        {
            Serial.println("=== SYSTEM STATUS ===");
            Serial.print("Button pressed flag: ");
            Serial.println(buttonPressedFlag);
            Serial.print("Pressed switch pin: ");
            Serial.println(pressedSwitchPin);
            Serial.print("Button states: 0b");
            Serial.println(buttonStates, BIN);
            Serial.println("===================");
        }
        else if (input.startsWith("RESET")) 
        {
            // Reset all system states to initial values
            Serial.println("Resetting system...");
            buttonStates = 0;
            argbReset();
            buttonPressedFlag = false;
            pressedSwitchPin = -1;
        }
        else if (input.startsWith("HELP"))
        {
            // Display available commands if unknown command received
            Serial.println("Available commands:");
            Serial.println("  BUTTON_TEST - Test all button states");
            Serial.println("  SOUND_TEST - Test sound engine");
            Serial.println("  LED_TEST - Test LED sequence");
            Serial.println("  STATUS - Show system status");
            Serial.println("  RESET - Reset system");
        }
        #endif
        
    }
}

void serialListnerWrapper(void* param)
{
    while(true) {
        serialListner();
        vTaskDelay(10 / portTICK_PERIOD_MS);
    }
}