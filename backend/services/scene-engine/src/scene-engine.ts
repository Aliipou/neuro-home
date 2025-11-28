import { v4 as uuidv4 } from 'uuid';

export interface SceneAction {
  id: string;
  deviceId: string;
  action: string;
  value: unknown;
  offsetMs: number;
  dependencies?: string[];
}

export interface Scene {
  id: string;
  name: string;
  description?: string;
  actions: SceneAction[];
  rollbackOnFailure: boolean;
  createdAt: Date;
}

export class SceneEngine {
  private scenes: Map<string, Scene> = new Map();
  private executionLog: Map<string, { sceneId: string; timestamp: Date; success: boolean }[]> = new Map();

  addScene(scene: Omit<Scene, 'id' | 'createdAt'>): string {
    const fullScene: Scene = {
      id: uuidv4(),
      createdAt: new Date(),
      ...scene,
    };

    this.scenes.set(fullScene.id, fullScene);
    return fullScene.id;
  }

  getScene(sceneId: string): Scene | undefined {
    return this.scenes.get(sceneId);
  }

  async executeScene(sceneId: string): Promise<void> {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    const executedActions: SceneAction[] = [];

    try {
      const sortedActions = this.topologicalSort(scene.actions);

      for (const action of sortedActions) {
        await this.delay(action.offsetMs);
        await this.executeAction(action);
        executedActions.push(action);
      }

      this.logExecution(sceneId, true);
    } catch (error) {
      this.logExecution(sceneId, false);

      if (scene.rollbackOnFailure) {
        await this.rollback(executedActions);
      }

      throw error;
    }
  }

  private async executeAction(action: SceneAction): Promise<void> {
    console.info(`Executing action ${action.action} on device ${action.deviceId} with value ${action.value}`);
  }

  private async rollback(actions: SceneAction[]): Promise<void> {
    for (const action of actions.reverse()) {
      console.info(`Rolling back action ${action.id}`);
    }
  }

  private topologicalSort(actions: SceneAction[]): SceneAction[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const action of actions) {
      graph.set(action.id, action.dependencies ?? []);
      inDegree.set(action.id, 0);
    }

    for (const [_, deps] of graph) {
      for (const dep of deps) {
        inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    const sorted: SceneAction[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const action = actions.find((a) => a.id === id)!;
      sorted.push(action);

      const deps = graph.get(id) ?? [];
      for (const dep of deps) {
        const degree = inDegree.get(dep)! - 1;
        inDegree.set(dep, degree);
        if (degree === 0) {
          queue.push(dep);
        }
      }
    }

    return sorted.length === actions.length ? sorted : actions;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private logExecution(sceneId: string, success: boolean): void {
    const log = this.executionLog.get(sceneId) ?? [];
    log.push({ sceneId, timestamp: new Date(), success });
    this.executionLog.set(sceneId, log);
  }
}
