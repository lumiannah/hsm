#include <Wire.h>
#include "SHTSensor.h"
#include <bits/stdc++.h>
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <WiFiClientSecureBearSSL.h>
using namespace std;

ESP8266WiFiMulti WiFiMulti;

SHTSensor sht(SHTSensor::SHT3X);

#define API_DEVICES "http://***.***.**.**:****/devices"
#define API_DATA    "http://***.***.**.**:****/data"

#define WLANID          "******"
#define WLANPW          "******"
#define AUTH_USER       "******"
#define AUTH_PASSWORD   "******"

const int samplesToMeasure = 10;
const int samplingInterval = 5000;
int temperatures[samplesToMeasure];
int humidities[samplesToMeasure];
int loopCount = 0;
bool initialized = false;
String mac;
String deviceId;

void setup()
{
  Wire.begin();
  Serial.begin(9600);
  delay(1000);
  sht.init();
  sht.setAccuracy(SHTSensor::SHT_ACCURACY_HIGH);
  WiFi.mode(WIFI_STA);
  WiFiMulti.addAP(WLANID, WLANPW);
  mac = WiFi.macAddress();
}

void loop()
{
  if (!initialized)
    initDevice();

  if (initialized)
  {
    if(loopCount == samplesToMeasure)
    {
      loopCount = 0;
      bubbleSort(temperatures, samplesToMeasure);
      bubbleSort(humidities, samplesToMeasure);
      int medianTemp = temperatures[(samplesToMeasure/2)-1];
      int medianHum = humidities[(samplesToMeasure/2)-1];

      sendDataToAPI(medianTemp, medianHum);
    }

    sht.readSample();
    temperatures[loopCount] = sht.getTemperature() * 100;
    humidities[loopCount] = sht.getHumidity() * 100;
    
    loopCount++;
  }
  
  delay(samplingInterval);
}

void initDevice()
{
  if ((WiFiMulti.run() == WL_CONNECTED))
  {
    WiFiClient client;
    HTTPClient http;
    
    http.begin(client, API_DEVICES);
    http.setAuthorization(AUTH_USER, AUTH_PASSWORD);
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST("{\"mac\":\""+ mac +"\"}");

    if(httpCode == 200)
    {
      initialized = true;
      deviceId = http.getString();
      http.end();
    } 
  }
}

void sendDataToAPI(int temp, int hum)
{
  if ((WiFiMulti.run() == WL_CONNECTED))
  {
    String humidity = String(int(hum));
    String temperature = String(int(temp));

    WiFiClient client;
    HTTPClient http;

    http.begin(client, API_DATA);
    http.setAuthorization(AUTH_USER, AUTH_PASSWORD);
    http.addHeader("Content-Type", "application/json");

    http.POST("[{\"deviceId\":\""+ deviceId +"\",\"temperature\":\""+ temperature +"\",\"humidity\":\""+ humidity +"\"}]");
    http.end();
  }
}

void bubbleSort(int arr[], int n)
{
  int i, j;
  for (i = 0; i < n - 1; i++)
  
  for (j = 0; j < n - i - 1; j++)
    if (arr[j] > arr[j + 1])
      swap(arr[j], arr[j + 1]);
}