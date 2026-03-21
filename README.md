<div align="center">

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&amp;logo=python)](https://python.org)
[![TinyML](https://img.shields.io/badge/TinyML-ESP32-E7352C?style=flat&amp;logo=espressif)](https://www.espressif.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

# NeuroHome

**Edge-AI smart home platform that learns your behavior and adapts automatically.**

</div>

## The Idea

Most smart home systems require you to program automation rules manually. NeuroHome observes your daily patterns, builds a behavioral model, and creates those rules for you. Over time it gets more accurate, and you spend less time configuring devices.

## Architecture

```
Sensors and Devices (ESP32 + peripherals)
        |
        v
[Edge Inference]     TinyML models run directly on ESP32
        |                No cloud round-trip for real-time decisions
        v
[Behavior2Vec]       Daily patterns encoded as behavioral embeddings
        |
        v
[Prediction Engine]  Forecasts next actions, schedules automations
        |
        v
[Automation Layer]   Executes: lights, thermostat, appliances
```

## Key Capabilities

**Edge Intelligence**
TinyML models run on ESP32 microcontrollers for sub-100ms response times. No cloud dependency for real-time control.

**Behavioral Modeling**
Behavior2Vec encodes your routines as dense vectors, enabling semantic similarity between behavioral patterns across different days.

**Adaptive Automation**
The system generates automation rules dynamically based on learned patterns. Rules update as your behavior changes.

**Emotional Awareness**
Environmental sensors (sound, light levels, temperature) inform the system about your likely state, enabling context-aware responses.

## Hardware Requirements

- ESP32 development board
- DHT22 temperature and humidity sensor
- PIR motion sensor
- Relay module for appliance control
- Optional: microphone for sound level monitoring

## Quick Start

```bash
git clone https://github.com/Aliipou/neuro-home.git
cd neuro-home
pip install -r requirements.txt
python server/main.py
# Flash ESP32 firmware from firmware/ directory
```

## License

MIT
