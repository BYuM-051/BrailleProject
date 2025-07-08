#ifndef _SOUND_ENGINE_BYUM_H

#define _SOUND_ENGINE_BYUM_H

//#define _DEBUG_SOUNDENGINE_
//#define _DEBUG_SOUNDENGINE_NOW

/*
READ ME BEFORE MODIFY CONSTANTS BELOW HERE
------------------------------------------
Audio slicing is done per tick (e.g. 44.1kHz * 10ms = 441 samples)
If soundLength % samplesPerTick != 0, tail samples may be dropped
ex) 1325 samples = 441 * 3 + 2 → last 2 samples discarded
*/
constexpr unsigned int SOUND_ENGINE_TICK_TO_MS = 10U;
constexpr double SAMPLE_RATE = 44100.0;
constexpr double TICK_MS = static_cast<double>(SOUND_ENGINE_TICK_TO_MS);
constexpr size_t SAMPLES_PER_TICK = static_cast<size_t>(SAMPLE_RATE * TICK_MS / 1000.0);

#include <Arduino.h>

#include "driver/i2s.h"

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
struct SoundEngine_Sound
{
    const int16_t* soundArray;
    const size_t soundLength;
    size_t currentPlay = 0;
    
    SoundEngine_Sound(const int16_t* array, size_t length)
        : soundArray(array), soundLength(length), currentPlay(0) {}
};

typedef struct
{
    const int16_t* soundArray;
    const size_t soundLength;
} SoundStruct;

class SoundEngine
{
    public :
        SoundEngine(uint8_t lrcPin, uint8_t bclkPin, uint8_t doutPin)
        {
            //initialize SoundEngineI2SSystem
            this->setupI2S(lrcPin, bclkPin, doutPin);

            //initialize SoundEngineThread
            BaseType_t taskReturnValue = xTaskCreatePinnedToCore
            (
                soundEngineThreadWrapper,
                "soundEngineThread",
                8196,   //TODO : optimize stack size
                this,   //static 내부에서도 member를 사용할 수 있게하는 매직.
                3,
                NULL,
                0
            );

            #ifdef _DEBUG_SOUNDENGINE_
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

        bool enqueSound(const SoundStruct* sound)
        {
            SoundEngine_Sound* newSound = new SoundEngine_Sound(sound->soundArray, sound->soundLength);
         
            if(newSound)
            {
                soundQueue.push_back(newSound);
                return true;
            }
            return false;
        }
    private :
        std::list<SoundEngine_Sound*> soundQueue;

        //deprecated due to sound rip problem
        // inline static int16_t mixSamples(int16_t a, int16_t b)
        // {
        //     constexpr int32_t SAFE_INT16_MIN = -32768;
        //     constexpr int32_t SAFE_INT16_MAX = 32767;
        //     return  a < 0 && b < 0 ?
        //             a + b + ((int32_t) a * b ) / SAFE_INT16_MIN :
        //             a > 0 && b > 0 ?
        //             a + b - ((int32_t) a * b ) / SAFE_INT16_MAX :
        //             a + b;
        // }
        inline static int16_t mixSamples(int16_t a, int16_t b)
        {
            float fa = static_cast<float>(a) / 32768.0f;
            float fb = static_cast<float>(b) / 32768.0f;
            
            float mixed = (fa + fb) / 2.0f;  // or just (fa + fb) * 0.5f
            
            // optional soft saturation (gain = 1.5 정도까지 실험 가능)
            float gain = 1.0f;
            mixed = tanhf(mixed * gain);

            return static_cast<int16_t>(mixed * 32767.0f);
        }

        void setupI2S(uint8_t lrcPin, uint8_t bclkPin, uint8_t doutPin)
        {
            //TODO : change hard-coded code with macro

            esp_err_t returnValue;

            const i2s_config_t config = 
            {
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

            #ifdef _DEBUG_SOUNDENGINE_
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

            i2s_pin_config_t pin_config = 
            {
                .bck_io_num = bclkPin,
                .ws_io_num = lrcPin,
                .data_out_num = doutPin,
                .data_in_num = I2S_PIN_NO_CHANGE
            };
            i2s_set_pin(I2S_NUM_0, &pin_config);
            #ifdef _DEBUG_SOUNDENGINE_
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

            #ifdef _DEBUG_SOUNDENGINE_
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
            int16_t mixBuffer[SAMPLES_PER_TICK];
            while(true)
            {
                #ifdef _DEBUG_SOUNDENGINE_
                uint32_t startTime = micros();

                const int MaxPrintCount = 10;
                static int printCount = 0;
                if(printCount < MaxPrintCount)
                {
                    Serial.print("sound engine debug [time] : ");
                    Serial.println(millis());
                    printCount++;
                }
                #endif

                if(!soundQueue.empty())
                {
                    for(auto i = soundQueue.begin() ; i != soundQueue.end() ; )
                    {
                        SoundEngine_Sound* s = *i;

                        size_t remaining = s->soundLength - s->currentPlay;
                        size_t samplesToMix = std::min(SAMPLES_PER_TICK, remaining);

                        for(size_t j = 0; j < samplesToMix; ++j) 
                            {mixBuffer[j] = mixSamples(mixBuffer[j], s->soundArray[s->currentPlay + j]);}
                        s->currentPlay += samplesToMix;

                        if(s->currentPlay >= s->soundLength) 
                        {
                            delete s;
                            i = soundQueue.erase(i);
                        } 
                        else 
                            {++i;}
                    }

                    size_t bytesWritten;
                    i2s_write(I2S_NUM_0, mixBuffer, sizeof(mixBuffer), &bytesWritten, pdMS_TO_TICKS(SOUND_ENGINE_TICK_TO_MS));
                    memset(mixBuffer, 0, sizeof(mixBuffer));
                }
                #ifdef _DEBUG_SOUNDENGINE_
                uint32_t finishTime = micros();
                Serial.print("SoundEngine Computing Time : ");
                Serial.println(finishTime - startTime);
                #endif
                xTaskDelayUntil(&currentCallTime, pdMS_TO_TICKS(SOUND_ENGINE_TICK_TO_MS)); // wait 10 ticks
            }
        }
        

};

#endif

