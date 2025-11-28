# NeuroHome Architecture

## Overview

NeuroHome implements a three-layer architecture designed for edge intelligence, real-time processing, and AI-driven automation. This document provides a deep dive into the system design, data flow, and key technical decisions.

## System Layers

### Layer A: Edge Intelligence

Edge devices run lightweight AI models for real-time predictions and local decision-making.

#### Components

**1. Device Firmware**
- Platform: ESP32, Raspberry Pi
- Language: C++ (ESP-IDF framework)
- Responsibilities:
  - Sensor data acquisition
  - Local event generation
  - TinyML model execution
  - Communication with backend via NeuroBus

**2. Data Acquisition Module**
- Standardized sensor interfaces
- Support for:
  - Motion/presence sensors (PIR, mmWave)
  - Light sensors (ambient, RGB)
  - Temperature/humidity (DHT22, BME280)
  - Energy monitors (current sensors)
  - Actuators (relays, dimmers, servos)

**3. Behavior Embedding Generator**
- Runs on edge (for simple patterns) or backend (for complex patterns)
- Converts sensor sequences into vector embeddings
- Uses sliding window approach (configurable window size)

**4. Local Predictive Engine (TinyML)**
- TensorFlow Lite Micro models
- Predictions:
  - Next room prediction
  - Next action prediction
  - Energy usage prediction
- Model size: <100KB for ESP32 compatibility

**5. NeuroBus Protocol**
- Lightweight event bus similar to MQTT
- Message format: Protocol Buffers for efficiency
- QoS levels: 0 (fire-and-forget), 1 (at-least-once), 2 (exactly-once)
- Topics:
  - `device/{id}/sensor/{type}` - Sensor data
  - `device/{id}/state` - Device state
  - `device/{id}/command` - Control commands
  - `scene/{id}/trigger` - Scene triggers
  - `user/{id}/behavior` - Behavior events

### Layer B: Core Backend

Cloud/local hybrid backend for complex processing and long-term learning.

#### Architecture Pattern

- **Microservices**: Each service is independent and communicates via events
- **Event-Driven**: All services consume and produce events
- **CQRS**: Separate read and write models for scalability
- **Event Sourcing**: Complete event history for audit and replay

#### Services

**1. Event Processor**
- Technology: Node.js + TypeScript
- Message Queue: RabbitMQ
- Responsibilities:
  - Receive events from edge devices
  - Priority-based event handling
  - Event aggregation and batching
  - Real-time streaming to clients (WebSocket)
- Event Types:
  - `SensorEvent`: Raw sensor data
  - `StateChangeEvent`: Device state changes
  - `BehaviorEvent`: User behavior patterns
  - `EmotionalEvent`: Detected emotional states
  - `RuleEvent`: Rule execution events
  - `SceneEvent`: Scene activation events

**2. Behavior Modeler**
- Technology: Python + TensorFlow
- Model: Behavior2Vec (inspired by Word2Vec)
- Architecture:
  - Input: Sequence of user actions
  - Embedding Layer: 128-dimensional vectors
  - LSTM: For temporal patterns
  - Output: Behavior embeddings
- Training:
  - Online learning with incremental updates
  - Daily batch retraining for refinement
  - User-specific models (privacy-preserving)

**3. Emotional AI Engine**
- Technology: Python + scikit-learn
- Input Factors (10 total):
  1. Usage pattern consistency
  2. Light preference (warm/cool)
  3. Temperature preference
  4. Voice tone (if enabled)
  5. Control frequency
  6. Response latency to notifications
  7. Sleep pattern quality
  8. Activity level
  9. Time-of-day correlation
  10. Social interaction level
- Output States:
  - `calm`: Relaxed, comfortable
  - `stress`: Agitated, tense
  - `focus`: Concentrated, productive
  - `tired`: Low energy, sleepy
  - `active`: High energy, engaged
- Model: Random Forest Classifier (fast, interpretable)

**4. Rule Engine**
- Technology: Node.js + TypeScript
- Grammar: Custom DSL (Domain-Specific Language)
- Example Rule:
```
WHEN user.arrives_home AND emotional_state = "stress"
THEN execute_scene("calm_relax")
AND dim_lights_to(0.6, warmth=0.8)
AND play_ambient_sound("rain")
```
- Safety Checks:
  - Loop detection (prevents infinite triggers)
  - Rate limiting (max activations per hour)
  - Conflict resolution (priority-based)
  - Energy safety (prevents dangerous power draws)
  - User override capability

**5. Scene Orchestration Engine**
- Technology: Node.js + TypeScript
- Data Structure: Directed Acyclic Graph (DAG)
- Features:
  - Parallel action execution
  - Time-based delays
  - Conditional branching
  - Rollback on failure
- Scene Definition:
```typescript
{
  id: "calm_relax",
  name: "Calm & Relax",
  actions: [
    { device: "living_room_light", action: "dim", value: 0.6, offset: 0 },
    { device: "living_room_temp", action: "set", value: 22, offset: 0 },
    { device: "speaker", action: "play", value: "ambient_rain", offset: 2000 },
    { device: "curtains", action: "close", value: 0.7, offset: 5000 }
  ]
}
```

**6. Device Graph Manager**
- Technology: Node.js + TypeScript
- Graph Database: Neo4j (for relationship modeling)
- Responsibilities:
  - Device discovery and registration
  - Capability detection
  - Relationship mapping (room, zone, dependency)
  - Device health monitoring
- Graph Structure:
  - Nodes: Devices, Rooms, Zones, Users
  - Edges: located_in, controls, depends_on, owned_by

**7. Digital Twin Engine**
- Technology: Node.js + TypeScript
- Sync Protocol: WebSocket with delta updates
- Features:
  - Real-time bidirectional sync
  - Conflict resolution (last-write-wins with vector clocks)
  - State snapshots for rollback
  - Predictive simulation
- Data Model:
```typescript
{
  physicalDevice: {
    id: string,
    state: DeviceState,
    lastUpdated: timestamp
  },
  digitalTwin: {
    id: string,
    state: DeviceState,
    predicted: PredictedState,
    history: StateHistory[]
  }
}
```

**8. API Gateway**
- Technology: Node.js + Express + Socket.IO
- Features:
  - REST API for CRUD operations
  - WebSocket for real-time updates
  - Authentication (JWT)
  - Rate limiting
  - Request validation
  - API versioning
- Endpoints:
  - `GET /api/v1/devices` - List all devices
  - `POST /api/v1/devices/{id}/command` - Send command
  - `GET /api/v1/scenes` - List scenes
  - `POST /api/v1/scenes/{id}/execute` - Execute scene
  - `GET /api/v1/rules` - List automation rules
  - `WS /api/v1/stream` - Real-time event stream

### Layer C: Clients

#### 1. Mobile App (React Native)
- Platform: iOS + Android
- Features:
  - Real-time dashboard
  - Device control
  - Behavior timeline
  - Emotional state visualization
  - AI recommendations
  - Scene management
  - Rule editor

#### 2. Web Dashboard (Next.js)
- Platform: Web
- Features:
  - Comprehensive device management
  - Visual behavior modeling
  - Graphical rule editor
  - Analytics and insights
  - System configuration
  - User management

#### 3. Wall Panel (ESP32)
- Platform: ESP32 with touchscreen
- Features:
  - Quick scene triggers
  - Current status display
  - Temperature/light controls
  - Minimal UI for fast interaction

#### 4. CLI Tool (neuroctl)
- Platform: Node.js CLI
- Commands:
  - `neuroctl device list` - List devices
  - `neuroctl device deploy <firmware>` - Deploy firmware
  - `neuroctl rule generate` - Generate automation rules
  - `neuroctl behavior analyze` - Analyze behavior patterns
  - `neuroctl simulate run` - Run home simulator
  - `neuroctl debug <device-id>` - Debug device

## Data Flow

### 1. Sensor Event Flow
```
ESP32 Sensor → NeuroBus → Event Processor → RabbitMQ →
  ├─> Behavior Modeler (update embeddings)
  ├─> Emotional AI (update state)
  ├─> Rule Engine (evaluate rules)
  └─> Digital Twin (sync state)
```

### 2. Automation Rule Execution
```
Trigger Event → Rule Engine (evaluate conditions) →
  └─> Scene Engine (execute actions) →
      └─> Device Graph (send commands) →
          └─> NeuroBus → ESP32 Actuators
```

### 3. Behavior Learning
```
User Action → Event Processor → Behavior Modeler →
  ├─> Generate Embedding
  ├─> Update User Model
  └─> Rule Engine (suggest new rules)
```

## Database Schema

### PostgreSQL Tables

**devices**
- id (UUID, PK)
- name (VARCHAR)
- type (ENUM: sensor, actuator, hybrid)
- capabilities (JSONB)
- room_id (UUID, FK)
- status (ENUM: online, offline, error)
- metadata (JSONB)
- created_at, updated_at (TIMESTAMP)

**events**
- id (UUID, PK)
- device_id (UUID, FK)
- type (VARCHAR)
- data (JSONB)
- timestamp (TIMESTAMP)
- processed (BOOLEAN)

**behaviors**
- id (UUID, PK)
- user_id (UUID, FK)
- pattern (JSONB)
- embedding (VECTOR)
- frequency (INTEGER)
- last_seen (TIMESTAMP)

**rules**
- id (UUID, PK)
- name (VARCHAR)
- condition (TEXT)
- action (JSONB)
- enabled (BOOLEAN)
- auto_generated (BOOLEAN)
- priority (INTEGER)
- created_at, updated_at (TIMESTAMP)

**scenes**
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- actions (JSONB)
- created_by (UUID, FK)
- created_at, updated_at (TIMESTAMP)

## Security Architecture

### 1. Network Security
- TLS 1.3 for all communications
- Certificate pinning for mobile apps
- Zero-trust network model
- Device authentication via pre-shared keys

### 2. Data Security
- Encryption at rest (AES-256)
- Encryption in transit (TLS)
- End-to-end encryption for sensitive data
- Minimal data retention policy

### 3. Authentication & Authorization
- JWT tokens for API access
- OAuth 2.0 for third-party integrations
- Role-based access control (RBAC)
- Device-level permissions

### 4. Privacy
- Local-first processing
- Optional cloud sync
- User data ownership
- GDPR compliance
- Data anonymization for ML training

## Scalability

### Horizontal Scaling
- Stateless services (easy to replicate)
- Load balancing (NGINX)
- Database sharding by user_id
- Redis cluster for caching

### Vertical Scaling
- Optimized queries with indexes
- Connection pooling
- Lazy loading
- Batch processing

## Monitoring & Observability

### Metrics
- Prometheus for metrics collection
- Grafana for visualization
- Custom dashboards for:
  - Event throughput
  - Model accuracy
  - Device health
  - API latency

### Logging
- Structured logging (JSON format)
- Log aggregation (ELK stack)
- Log levels: DEBUG, INFO, WARN, ERROR

### Tracing
- Distributed tracing (Jaeger)
- Request correlation IDs
- Performance profiling

## Deployment

### Development
- Docker Compose for local development
- Hot reload for all services
- Mock devices for testing

### Production
- Kubernetes for orchestration
- Helm charts for deployment
- Rolling updates
- Health checks and auto-recovery

## Future Enhancements

1. **Multi-Home Support**: Manage multiple homes from one account
2. **Voice Interface**: Natural language control
3. **Advanced ML Models**: Transformer-based models for better predictions
4. **Federated Learning**: Privacy-preserving collaborative learning
5. **Energy Optimization**: AI-driven energy saving strategies
6. **Anomaly Detection**: Detect unusual patterns (security, safety)
7. **Integration Ecosystem**: Connect with existing smart home platforms

---

This architecture is designed to be modular, scalable, and privacy-first, ensuring NeuroHome can grow with user needs while maintaining performance and security.
