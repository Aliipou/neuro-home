export enum EventType {
  SENSOR_DATA = 'sensor_data',
  STATE_CHANGE = 'state_change',
  BEHAVIOR = 'behavior',
  EMOTIONAL = 'emotional',
  RULE_EXECUTION = 'rule_execution',
  SCENE_ACTIVATION = 'scene_activation',
  DEVICE_CONNECTED = 'device_connected',
  DEVICE_DISCONNECTED = 'device_disconnected',
}

export enum EventPriority {
  LOW = 0,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

export interface BaseEvent {
  id: string;
  type: EventType;
  priority: EventPriority;
  timestamp: Date;
  deviceId?: string;
  userId?: string;
  data: Record<string, unknown>;
}

export interface SensorEvent extends BaseEvent {
  type: EventType.SENSOR_DATA;
  data: {
    sensorType: string;
    value: number;
    unit: string;
  };
}

export interface StateChangeEvent extends BaseEvent {
  type: EventType.STATE_CHANGE;
  data: {
    previousState: string;
    newState: string;
    reason?: string;
  };
}

export interface BehaviorEvent extends BaseEvent {
  type: EventType.BEHAVIOR;
  data: {
    action: string;
    context: Record<string, unknown>;
  };
}

export interface EmotionalEvent extends BaseEvent {
  type: EventType.EMOTIONAL;
  data: {
    state: 'calm' | 'stress' | 'focus' | 'tired' | 'active';
    confidence: number;
    factors: Record<string, number>;
  };
}

export type Event =
  | SensorEvent
  | StateChangeEvent
  | BehaviorEvent
  | EmotionalEvent
  | BaseEvent;

export interface EventHandler {
  (event: Event): Promise<void> | void;
}

export interface EventProcessorConfig {
  maxQueueSize?: number;
  batchSize?: number;
  batchInterval?: number;
  processingTimeout?: number;
}
