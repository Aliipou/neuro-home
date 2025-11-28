import { v4 as uuidv4 } from 'uuid';

interface SimulatedDevice {
  id: string;
  type: 'sensor' | 'actuator';
  name: string;
  room: string;
  state: Record<string, unknown>;
}

interface SimulatedUser {
  id: string;
  name: string;
  location: string;
  emotionalState: 'calm' | 'stress' | 'focus' | 'tired' | 'active';
}

class HomeSimulator {
  private devices: Map<string, SimulatedDevice> = new Map();
  private users: Map<string, SimulatedUser> = new Map();
  private running: boolean = false;

  constructor() {
    this.initializeHome();
  }

  private initializeHome(): void {
    // Add simulated devices
    this.addDevice({
      id: uuidv4(),
      type: 'sensor',
      name: 'Living Room Temperature',
      room: 'living_room',
      state: { temperature: 22, unit: 'C' },
    });

    this.addDevice({
      id: uuidv4(),
      type: 'sensor',
      name: 'Living Room Motion',
      room: 'living_room',
      state: { motion: false },
    });

    this.addDevice({
      id: uuidv4(),
      type: 'actuator',
      name: 'Living Room Light',
      room: 'living_room',
      state: { on: false, brightness: 0 },
    });

    this.addDevice({
      id: uuidv4(),
      type: 'sensor',
      name: 'Bedroom Temperature',
      room: 'bedroom',
      state: { temperature: 20, unit: 'C' },
    });

    this.addDevice({
      id: uuidv4(),
      type: 'actuator',
      name: 'Bedroom Light',
      room: 'bedroom',
      state: { on: false, brightness: 0 },
    });

    // Add simulated user
    this.addUser({
      id: uuidv4(),
      name: 'Test User',
      location: 'outside',
      emotionalState: 'calm',
    });

    console.info('Home initialized with', this.devices.size, 'devices and', this.users.size, 'users');
  }

  private addDevice(device: SimulatedDevice): void {
    this.devices.set(device.id, device);
  }

  private addUser(user: SimulatedUser): void {
    this.users.set(user.id, user);
  }

  start(): void {
    console.info('Starting Home Simulator...');
    this.running = true;

    // Simulate user behavior
    setInterval(() => this.simulateUserBehavior(), 5000);

    // Simulate environmental changes
    setInterval(() => this.simulateEnvironment(), 10000);

    console.info('Simulator running. Press Ctrl+C to stop.');
  }

  private simulateUserBehavior(): void {
    const user = Array.from(this.users.values())[0];
    if (!user) return;

    const locations = ['living_room', 'bedroom', 'kitchen', 'outside'];
    const newLocation = locations[Math.floor(Math.random() * locations.length)];

    if (newLocation !== user.location) {
      user.location = newLocation;
      console.info(`[USER] ${user.name} moved to ${newLocation}`);

      // Trigger motion sensors
      for (const [_, device] of this.devices) {
        if (device.type === 'sensor' && device.name.includes('Motion') && device.room === newLocation) {
          device.state.motion = true;
          console.info(`[SENSOR] Motion detected in ${device.room}`);

          setTimeout(() => {
            device.state.motion = false;
          }, 3000);
        }
      }

      // Auto turn on lights when user enters room
      for (const [_, device] of this.devices) {
        if (device.type === 'actuator' && device.name.includes('Light') && device.room === newLocation) {
          device.state.on = true;
          device.state.brightness = 80;
          console.info(`[ACTUATOR] ${device.name} turned on`);
        }
      }
    }
  }

  private simulateEnvironment(): void {
    for (const [_, device] of this.devices) {
      if (device.type === 'sensor' && device.name.includes('Temperature')) {
        const currentTemp = device.state.temperature as number;
        const change = (Math.random() - 0.5) * 2;
        device.state.temperature = Math.round((currentTemp + change) * 10) / 10;
        console.info(`[SENSOR] ${device.name}: ${device.state.temperature}°C`);
      }
    }
  }

  getStatus(): void {
    console.info('\n=== HOME STATUS ===');
    console.info('\nDEVICES:');
    for (const [_, device] of this.devices) {
      console.info(`  ${device.name} (${device.room}):`, JSON.stringify(device.state));
    }

    console.info('\nUSERS:');
    for (const [_, user] of this.users) {
      console.info(`  ${user.name}: ${user.location} (${user.emotionalState})`);
    }
    console.info('==================\n');
  }

  stop(): void {
    this.running = false;
    console.info('Simulator stopped.');
  }
}

// Run simulator
const simulator = new HomeSimulator();
simulator.start();

// Show status every 15 seconds
setInterval(() => simulator.getStatus(), 15000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.info('\nShutting down...');
  simulator.stop();
  process.exit(0);
});
