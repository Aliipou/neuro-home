# NeuroHome

**AI-Powered Smart Home System with Edge Intelligence**

NeuroHome is an open-source, AI-driven smart home platform that learns your behavior, understands your emotional state, and automatically creates personalized automation rules. Unlike traditional smart home systems that require manual configuration, NeuroHome uses edge AI and behavioral modeling to create a truly intelligent living space.

## Key Features

### Edge Intelligence
- **TinyML on ESP32**: Run AI models directly on edge devices for real-time predictions
- **Behavior2Vec**: Convert daily patterns into embeddings, inspired by Word2Vec
- **Local Processing**: Critical decisions happen on-device, ensuring privacy and low latency

### Emotional AI
- **State Detection**: Automatically detect user emotional states (calm, stress, focus, tired, active)
- **Context-Aware Automation**: Rules adapt based on your current mood and needs
- **Multi-Factor Analysis**: Combines usage patterns, lighting preferences, voice tone, and more

### Auto-Automation
- **Self-Learning Rules**: The system generates automation rules based on your behavior
- **Scene Orchestration**: Multi-layered scenes combining lighting, temperature, sound, and more
- **Safety Engine**: Prevents dangerous automation loops and over-activation

### Digital Twin
- **Real-Time Sync**: Bidirectional synchronization between physical and digital representations
- **Predictive Modeling**: Simulate scenarios before deploying them to physical devices
- **Event History**: Complete timeline of all behaviors, states, and rule changes

## Architecture

NeuroHome follows a three-layer architecture:

### Layer A: Edge Intelligence
- Device firmware (ESP32, Raspberry Pi)
- Data acquisition and sensor management
- Behavior embedding generation
- Local predictive engine (TinyML)
- Secure event bus (NeuroBus protocol)

### Layer B: Core Backend
- Event processing engine
- Long-term behavior modeling
- Emotional state engine
- Auto-rule generation AI
- Scene orchestration engine
- Device graph manager
- Digital twin engine
- API Gateway (REST + WebSocket)

### Layer C: Clients
- Mobile app (React Native)
- Wall panel (ESP32 + lightweight UI)
- Web dashboard (Next.js)
- Developer console (CLI - neuroctl)
- Automation grammar editor

## Project Structure

```
neurohome/
├── edge/                    # Edge devices and firmware
│   ├── firmware_esp32/      # ESP32 firmware
│   ├── firmware_rpi/        # Raspberry Pi firmware
│   ├── tinyml_models/       # Optimized ML models for edge
│   └── sensor_drivers/      # Device drivers
│
├── backend/                 # Core backend services
│   ├── services/
│   │   ├── event-processor/ # Event stream processing
│   │   ├── behavior-modeler/# Behavior2Vec implementation
│   │   ├── emotional-ai/    # Emotional state detection
│   │   ├── rule-engine/     # Auto-rule generation
│   │   ├── scene-engine/    # Scene orchestration
│   │   └── device-graph/    # Device management
│   ├── api/                 # REST API
│   ├── gateway/             # API Gateway + WebSocket
│   ├── data-pipeline/       # ETL and data processing
│   └── database/            # Database schemas and migrations
│
├── clients/                 # Client applications
│   ├── mobile/              # React Native mobile app
│   ├── dashboard/           # Next.js web dashboard
│   ├── wallpanel/           # ESP32 wall panel UI
│   └── cli/                 # neuroctl CLI tool
│
├── docs/                    # Documentation
│   ├── architecture/        # Architecture documentation
│   ├── api/                 # API documentation
│   ├── ml/                  # ML model documentation
│   └── guidelines/          # Development guidelines
│
└── tools/                   # Development tools
    ├── sim/                 # Home simulator
    ├── proto/               # Protocol definitions
    ├── test-env/            # Testing environment
    └── automation/          # Build and deployment automation
```

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (optional, for containerized deployment)
- PlatformIO (for ESP32 firmware development)
- Python >= 3.9 (for ML models)

### Installation

```bash
# Clone the repository
git clone https://github.com/aliipou/neurohome.git
cd neurohome

# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode
npm run dev
```

### Running Individual Components

```bash
# Start API Gateway
npm run gateway:dev

# Start Dashboard
npm run dashboard:dev

# Build and flash ESP32 firmware
cd edge/firmware_esp32
pio run -t upload

# Run the simulator
npm run simulator:run

# Use the CLI
npm run cli:build
./clients/cli/dist/neuroctl --help
```

## MVP Features (Current Release)

The current MVP includes:

- **ESP32 Firmware**: Support for light, temperature, and presence sensors
- **Event Engine**: Real-time event processing with priority queues
- **Rule Engine**: Auto-generation of rules with safety checks
- **Behavior2Vec**: Lightweight behavioral embedding model
- **Emotional AI**: Basic emotional state detection
- **Scene Engine**: "Relax Mode" auto-scene
- **CLI Tool**: Device management and debugging
- **Home Simulator**: Virtual home for testing
- **API Gateway**: REST + WebSocket support
- **Web Dashboard**: Real-time monitoring and control

## Technology Stack

### Backend
- **TypeScript** for type-safe backend services
- **Node.js** for runtime
- **Express** for REST API
- **Socket.IO** for WebSocket communication
- **PostgreSQL** for persistent storage
- **Redis** for caching and pub/sub
- **RabbitMQ** for event streaming

### Frontend
- **Next.js** for web dashboard
- **React Native** for mobile app
- **shadcn/ui** for component library
- **TailwindCSS** for styling

### Edge/Firmware
- **ESP32** (ESP-IDF framework)
- **C++** for firmware
- **TensorFlow Lite Micro** for TinyML
- **MQTT** for device communication

### ML/AI
- **Python** for model training
- **TensorFlow/Keras** for deep learning
- **scikit-learn** for classical ML
- **ONNX** for model export

## Development Principles

- **Clean Architecture**: Separation of concerns with clear boundaries
- **Event-Driven**: Micro-modules communicating via events
- **Fully Typed**: TypeScript with strict mode, Python with type hints
- **Test-Driven**: Comprehensive unit and integration tests
- **CI/CD**: Automated testing and deployment
- **Security First**: Zero-trust networking, end-to-end encryption
- **Privacy by Design**: Local processing, minimal cloud dependency

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed development phases and upcoming features.

## Architecture Documentation

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md).

## License

MIT License - see [LICENSE](LICENSE) for details.

## Community

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Discord**: Real-time community chat (coming soon)

## Acknowledgments

NeuroHome is inspired by modern AI research, edge computing advances, and the open-source community's commitment to privacy-first smart home solutions.

---

**Built with intelligence, designed for privacy, created for humanity.**
