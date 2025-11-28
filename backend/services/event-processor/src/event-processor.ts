import { v4 as uuidv4 } from 'uuid';
import {
  Event,
  EventHandler,
  EventProcessorConfig,
  EventType,
  EventPriority,
} from './types';

class PriorityQueue<T> {
  private items: Array<{ priority: number; item: T }> = [];

  enqueue(item: T, priority: number): void {
    const element = { priority, item };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (element.priority > this.items[i].priority) {
        this.items.splice(i, 0, element);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(element);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  peek(): T | undefined {
    return this.items[0]?.item;
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }
}

export class EventProcessor {
  private queue: PriorityQueue<Event>;
  private handlers: Map<EventType, Set<EventHandler>>;
  private processing: boolean = false;
  private config: Required<EventProcessorConfig>;
  private batchTimer: NodeJS.Timeout | null = null;
  private metrics: {
    totalProcessed: number;
    totalErrors: number;
    averageProcessingTime: number;
  };

  constructor(config: EventProcessorConfig = {}) {
    this.queue = new PriorityQueue<Event>();
    this.handlers = new Map();
    this.config = {
      maxQueueSize: config.maxQueueSize ?? 10000,
      batchSize: config.batchSize ?? 100,
      batchInterval: config.batchInterval ?? 1000,
      processingTimeout: config.processingTimeout ?? 5000,
    };
    this.metrics = {
      totalProcessed: 0,
      totalErrors: 0,
      averageProcessingTime: 0,
    };
  }

  addEvent(event: Partial<Event>): string {
    if (this.queue.size >= this.config.maxQueueSize) {
      throw new Error('Event queue is full');
    }

    const fullEvent: Event = {
      id: event.id ?? uuidv4(),
      type: event.type ?? EventType.SENSOR_DATA,
      priority: event.priority ?? EventPriority.NORMAL,
      timestamp: event.timestamp ?? new Date(),
      deviceId: event.deviceId,
      userId: event.userId,
      data: event.data ?? {},
    };

    this.queue.enqueue(fullEvent, fullEvent.priority);

    if (!this.processing) {
      this.startProcessing();
    }

    return fullEvent.id;
  }

  on(eventType: EventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  off(eventType: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  private async startProcessing(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (!this.queue.isEmpty()) {
      const batch: Event[] = [];

      for (let i = 0; i < this.config.batchSize && !this.queue.isEmpty(); i++) {
        const event = this.queue.dequeue();
        if (event) {
          batch.push(event);
        }
      }

      await this.processBatch(batch);

      if (this.queue.isEmpty()) {
        await this.delay(this.config.batchInterval);
      }
    }

    this.processing = false;
  }

  private async processBatch(events: Event[]): Promise<void> {
    const promises = events.map((event) => this.processEvent(event));
    await Promise.allSettled(promises);
  }

  private async processEvent(event: Event): Promise<void> {
    const startTime = Date.now();

    try {
      const handlers = this.handlers.get(event.type);
      if (!handlers || handlers.size === 0) {
        return;
      }

      const promises = Array.from(handlers).map((handler) =>
        Promise.race([
          handler(event),
          this.timeout(this.config.processingTimeout),
        ])
      );

      await Promise.all(promises);

      this.metrics.totalProcessed++;
      this.updateAverageProcessingTime(Date.now() - startTime);
    } catch (error) {
      this.metrics.totalErrors++;
      console.error(`Error processing event ${event.id}:`, error);
    }
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout')), ms);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private updateAverageProcessingTime(time: number): void {
    const total = this.metrics.totalProcessed;
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime * (total - 1) + time) / total;
  }

  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  clear(): void {
    this.queue.clear();
    this.processing = false;
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  shutdown(): void {
    this.clear();
    this.handlers.clear();
  }
}
