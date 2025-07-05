#ifndef _SOUND_ENGINE_BYUM_H

#define _SOUND_ENGINE_BYUM_H

#define SOUND_ENGINE_TICK_TO_MS 10U

#include <Arduino.h>

#include "driver/i2s.h"
#include "./buttonEffect1.h"
#include "./buttonEffect_Alone.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include <list>

/*
SOUND ID ENUMURATION
enum            |file               |description
bootSound       |None               |bootSound
buttonEffect_1  |buttonEffect1.mp3  |
buttonEffect_2  |buttonEffect2.mp3  |

*/
typedef enum
{
    sound_boot,
    sound_buttonEffect_1,
    sound_buttonEffect_2
}soundID_t;

typedef struct
{
    const soundID_t soundID;
    const size_t soundLength;
    size_t currentPlay;
}soundEngine_sound;

class SoundEngine
{
    public :
        SoundEngine(uint8_t lrcPin, uint8_t bclkPin, uint8_t doutPin)
        {
            //initialize SoundEngineI2SSystem
            this->setupI2S(lrcPin, bclkPin, doutPin);

            //initialize SoundEngineThread
            BaseType_t taskReturnValue = xTaskCreatePinnedToCore(
                soundEngineThreadWrapper,
                "soundEngineThread",
                2048,   //TODO : optimize stack size
                this,   //static 내부에서도 member를 사용할 수 있게하는 매직.
                1,
                NULL,
                0
            );

            #ifdef _DEBUG_
            if(taskReturnValue == pdPASS)
            {
                Serial.println("[SoundEngine] xTaskCreated To Pin");
            }
            else
            {
                Serial.print("[SoundEngine] failed to Create xTask : ");
                Serial.println(taskReturnValue);
            }
            #endif
        };

        bool enqueSound(soundID_t soundID)
        {
            // TODO : add soundStructInstance into soundQueue
            return false;
        }
    private :
        std::list<soundEngine_sound> soundQueue;

        inline static int16_t mixSamples(int16_t a, int16_t b)
        {
            constexpr int32_t SAFE_INT16_MIN = -32768;
            constexpr int32_t SAFE_INT16_MAX = 32767;
            return  a < 0 && b < 0 ?
                    a + b + ((int32_t) a * b ) / SAFE_INT16_MIN :
                    a > 0 && b > 0 ?
                    a + b - ((int32_t) a * b ) / SAFE_INT16_MAX :
                    a + b;
        }

        void setupI2S(uint8_t lrcPin, uint8_t bclkPin, uint8_t doutPin)
        {
            //TODO : change hard-coded code with macro

            esp_err_t returnValue;

            const i2s_config_t config = {
                .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
                .sample_rate = 44100,
                .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
                .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
                .communication_format = I2S_COMM_FORMAT_I2S_MSB,
                .intr_alloc_flags = 0,
                .dma_buf_count = 4,
                .dma_buf_len = 256,
                .use_apll = false,
                .tx_desc_auto_clear = true,
                .fixed_mclk = 0
            };
            returnValue = i2s_driver_install(I2S_NUM_0, &config, 0, NULL);

            #ifdef _DEBUG_
            if(returnValue != ESP_OK)
            {
                Serial.print("[I2S Driver]");
                Serial.print(returnValue);
                Serial.println("error has occured");
            }
            else
            {
                Serial.println("I2S Driver Installed");
            }
            #endif

            i2s_pin_config_t pin_config = {
                .bck_io_num = bclkPin,
                .ws_io_num = lrcPin,
                .data_out_num = doutPin,
                .data_in_num = I2S_PIN_NO_CHANGE
            };
            i2s_set_pin(I2S_NUM_0, &pin_config);
            #ifdef _DEBUG_
            if(returnValue != ESP_OK)
            {
                Serial.print("[I2S PinConfig]");
                Serial.print(returnValue);
                Serial.println("error has occured");
            }
            else
            {
                Serial.println("I2S Pin Configuration Complete");
            }
            #endif

            #ifdef _DEBUG_
            returnValue = i2s_set_clk(I2S_NUM_0, 44100, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_MONO);
            if(returnValue != ESP_OK)
            {
                Serial.print("[I2S ClockSetting]");
                Serial.print(returnValue);
                Serial.println("error has occured");
            }
            else
            {
                Serial.println("I2S Clock Set");
            }
            #endif     
            return;
        }

        static void soundEngineThreadWrapper(void* param)
        {
            SoundEngine* self = static_cast<SoundEngine*>(param);
            self->soundEngineThread();
        }

        void soundEngineThread()
        {
            TickType_t currentCallTime = xTaskGetTickCount();
            while(true)
            {
                #ifdef _DEBUG_
                const int MaxPrintCount = 10;
                static int printCount = 0;
                if(printCount < MaxPrintCount)
                {
                    Serial.print("sound engine debug [time] : ");
                    Serial.println(millis());
                    printCount++;
                }
                #endif
                //TODO : mixing

                //TODO : delete item if it is done

                //TODO : writei2s
                xTaskDelayUntil(&currentCallTime, pdMS_TO_TICKS(SOUND_ENGINE_TICK_TO_MS)); // wait 10 ticks
            }
        }
        

};

#endif