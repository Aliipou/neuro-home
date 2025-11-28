#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// Configuration
#define WIFI_SSID "YourWiFiSSID"
#define WIFI_PASSWORD "YourWiFiPassword"
#define MQTT_SERVER "192.168.1.100"
#define MQTT_PORT 1883
#define DEVICE_ID "neurohome-esp32-001"

// Pin definitions
#define DHT_PIN 4
#define PIR_PIN 5
#define LIGHT_SENSOR_PIN 34
#define LED_PIN 2

// Sensor configuration
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// MQTT Client
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// State
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 5000; // 5 seconds

// Function prototypes
void setupWiFi();
void setupMQTT();
void reconnectMQTT();
void readSensors();
void publishSensorData(const char* sensorType, float value, const char* unit);
void mqttCallback(char* topic, byte* payload, unsigned int length);

void setup() {
  Serial.begin(115200);
  Serial.println("NeuroHome ESP32 Firmware v0.1.0");

  // Initialize pins
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  // Initialize sensors
  dht.begin();

  // Setup connections
  setupWiFi();
  setupMQTT();

  Serial.println("Setup complete!");
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // Read sensors periodically
  unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;
    readSensors();
  }
}

void setupWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void setupMQTT() {
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  reconnectMQTT();
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");

    if (mqttClient.connect(DEVICE_ID)) {
      Serial.println("connected");

      // Subscribe to command topic
      char commandTopic[64];
      snprintf(commandTopic, sizeof(commandTopic), "device/%s/command", DEVICE_ID);
      mqttClient.subscribe(commandTopic);

      Serial.print("Subscribed to: ");
      Serial.println(commandTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void readSensors() {
  // Read temperature
  float temperature = dht.readTemperature();
  if (!isnan(temperature)) {
    publishSensorData("temperature", temperature, "C");
  }

  // Read humidity
  float humidity = dht.readHumidity();
  if (!isnan(humidity)) {
    publishSensorData("humidity", humidity, "%");
  }

  // Read motion
  int motion = digitalRead(PIR_PIN);
  publishSensorData("motion", motion, "bool");

  // Read light level
  int lightLevel = analogRead(LIGHT_SENSOR_PIN);
  float lightPercent = (lightLevel / 4095.0) * 100.0;
  publishSensorData("light", lightPercent, "%");
}

void publishSensorData(const char* sensorType, float value, const char* unit) {
  StaticJsonDocument<256> doc;
  char topic[64];
  char payload[256];

  // Build topic
  snprintf(topic, sizeof(topic), "device/%s/sensor/%s", DEVICE_ID, sensorType);

  // Build payload
  doc["deviceId"] = DEVICE_ID;
  doc["type"] = "sensor_data";
  doc["priority"] = 5;
  doc["timestamp"] = millis();
  doc["data"]["sensorType"] = sensorType;
  doc["data"]["value"] = value;
  doc["data"]["unit"] = unit;

  serializeJson(doc, payload);

  // Publish
  mqttClient.publish(topic, payload);

  Serial.print("Published: ");
  Serial.println(payload);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received [");
  Serial.print(topic);
  Serial.print("]: ");

  // Parse JSON payload
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.println("Failed to parse JSON");
    return;
  }

  // Handle command
  const char* command = doc["command"];

  if (strcmp(command, "led_on") == 0) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("LED turned ON");
  } else if (strcmp(command, "led_off") == 0) {
    digitalWrite(LED_PIN, LOW);
    Serial.println("LED turned OFF");
  } else {
    Serial.print("Unknown command: ");
    Serial.println(command);
  }
}
