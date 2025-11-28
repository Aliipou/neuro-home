import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventProcessor } from './event-processor';
import { EventType, EventPriority, Event } from './types';

describe('EventProcessor', () => {
  let processor: EventProcessor;

  beforeEach(() => {
    processor = new EventProcessor();
  });

  describe('addEvent', () => {
    it('should add an event and generate ID', () => {
      const eventId = processor.addEvent({
        type: EventType.SENSOR_DATA,
        data: { sensorType: 'temperature', value: 22, unit: 'C' },
      });

      expect(eventId).toBeDefined();
      expect(eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should throw error when queue is full', async () => {
      const smallProcessor = new EventProcessor({ maxQueueSize: 1, batchInterval: 10000 });

      // Fill the queue
      smallProcessor.addEvent({ type: EventType.SENSOR_DATA, data: {} });

      // Try to add another when full
      expect(() => {
        smallProcessor.addEvent({ type: EventType.SENSOR_DATA, data: {} });
      }).toThrow('Event queue is full');

      smallProcessor.shutdown();
    });

    it('should use provided ID if given', () => {
      const customId = 'custom-id-123';
      const eventId = processor.addEvent({
        id: customId,
        type: EventType.SENSOR_DATA,
        data: {},
      });

      expect(eventId).toBe(customId);
    });
  });

  describe('priority handling', () => {
    it('should process high priority events first', async () => {
      const results: number[] = [];
      const testProcessor = new EventProcessor({ batchSize: 10, batchInterval: 50 });

      testProcessor.on(EventType.SENSOR_DATA, async (event) => {
        results.push(event.priority);
        await new Promise(r => setTimeout(r, 10)); // Small delay to ensure order
      });

      testProcessor.addEvent({
        type: EventType.SENSOR_DATA,
        priority: EventPriority.LOW,
        data: {},
      });

      testProcessor.addEvent({
        type: EventType.SENSOR_DATA,
        priority: EventPriority.HIGH,
        data: {},
      });

      testProcessor.addEvent({
        type: EventType.SENSOR_DATA,
        priority: EventPriority.CRITICAL,
        data: {},
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(results[0]).toBe(EventPriority.CRITICAL);
      expect(results.length).toBe(3);

      testProcessor.shutdown();
    });
  });

  describe('event handlers', () => {
    it('should register and call event handlers', async () => {
      const handler = vi.fn();
      processor.on(EventType.SENSOR_DATA, handler);

      processor.addEvent({
        type: EventType.SENSOR_DATA,
        data: { value: 100 },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.SENSOR_DATA,
          data: { value: 100 },
        })
      );
    });

    it('should support multiple handlers for same event type', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      processor.on(EventType.SENSOR_DATA, handler1);
      processor.on(EventType.SENSOR_DATA, handler2);

      processor.addEvent({
        type: EventType.SENSOR_DATA,
        data: {},
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should remove event handlers', async () => {
      const handler = vi.fn();
      processor.on(EventType.SENSOR_DATA, handler);
      processor.off(EventType.SENSOR_DATA, handler);

      processor.addEvent({
        type: EventType.SENSOR_DATA,
        data: {},
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('batch processing', () => {
    it('should process events in batches', async () => {
      const handler = vi.fn();
      processor.on(EventType.SENSOR_DATA, handler);

      for (let i = 0; i < 150; i++) {
        processor.addEvent({
          type: EventType.SENSOR_DATA,
          data: { index: i },
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(handler).toHaveBeenCalledTimes(150);
    });
  });

  describe('metrics', () => {
    it('should track processed events', async () => {
      processor.on(EventType.SENSOR_DATA, async () => {});

      processor.addEvent({ type: EventType.SENSOR_DATA, data: {} });
      processor.addEvent({ type: EventType.SENSOR_DATA, data: {} });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const metrics = processor.getMetrics();
      expect(metrics.totalProcessed).toBe(2);
      expect(metrics.averageProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it('should track errors', async () => {
      processor.on(EventType.SENSOR_DATA, async () => {
        throw new Error('Processing error');
      });

      processor.addEvent({ type: EventType.SENSOR_DATA, data: {} });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const metrics = processor.getMetrics();
      expect(metrics.totalErrors).toBe(1);
    });
  });

  describe('timeout handling', () => {
    it('should timeout slow handlers', async () => {
      const slowHandler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 6000));
      });

      const fastProcessor = new EventProcessor({ processingTimeout: 100 });
      fastProcessor.on(EventType.SENSOR_DATA, slowHandler);

      fastProcessor.addEvent({ type: EventType.SENSOR_DATA, data: {} });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const metrics = fastProcessor.getMetrics();
      expect(metrics.totalErrors).toBe(1);
    });
  });

  describe('shutdown', () => {
    it('should clear queue and handlers on shutdown', () => {
      const handler = vi.fn();
      processor.on(EventType.SENSOR_DATA, handler);
      processor.addEvent({ type: EventType.SENSOR_DATA, data: {} });

      processor.shutdown();

      expect(processor.getQueueSize()).toBe(0);
    });
  });
});
