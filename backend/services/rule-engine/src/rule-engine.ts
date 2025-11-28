import { v4 as uuidv4 } from 'uuid';
import {
  Rule,
  Condition,
  Action,
  RuleExecutionContext,
  SafetyCheckResult,
  RuleEngineConfig,
} from './types';

export class RuleEngine {
  private rules: Map<string, Rule> = new Map();
  private executionHistory: Map<string, Date[]> = new Map();
  private config: Required<RuleEngineConfig>;
  private executionGraph: Map<string, Set<string>> = new Map();

  constructor(config: RuleEngineConfig = {}) {
    this.config = {
      maxActivationsPerHour: config.maxActivationsPerHour ?? 60,
      defaultCooldownMs: config.defaultCooldownMs ?? 60000,
      maxExecutionTime: config.maxExecutionTime ?? 5000,
      enableSafetyChecks: config.enableSafetyChecks ?? true,
    };
  }

  addRule(rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): string {
    const fullRule: Rule = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      cooldownMs: this.config.defaultCooldownMs,
      maxActivationsPerHour: this.config.maxActivationsPerHour,
      ...rule,
    };

    if (this.config.enableSafetyChecks) {
      const safetyCheck = this.checkRuleSafety(fullRule);
      if (!safetyCheck.safe) {
        throw new Error(
          `Rule safety check failed: ${safetyCheck.violations.join(', ')}`
        );
      }
    }

    this.rules.set(fullRule.id, fullRule);
    return fullRule.id;
  }

  updateRule(ruleId: string, updates: Partial<Rule>): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const updatedRule: Rule = {
      ...rule,
      ...updates,
      id: rule.id,
      updatedAt: new Date(),
    };

    if (this.config.enableSafetyChecks) {
      const safetyCheck = this.checkRuleSafety(updatedRule);
      if (!safetyCheck.safe) {
        throw new Error(
          `Rule safety check failed: ${safetyCheck.violations.join(', ')}`
        );
      }
    }

    this.rules.set(ruleId, updatedRule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.executionHistory.delete(ruleId);
    this.executionGraph.delete(ruleId);
  }

  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  async evaluateRules(context: RuleExecutionContext): Promise<Rule[]> {
    const matchingRules: Rule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      if (await this.evaluateCondition(rule.condition, context)) {
        if (this.canExecuteRule(rule)) {
          matchingRules.push(rule);
        }
      }
    }

    return matchingRules.sort((a, b) => b.priority - a.priority);
  }

  async executeRule(ruleId: string, context: RuleExecutionContext): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    if (!rule.enabled) {
      throw new Error(`Rule ${ruleId} is disabled`);
    }

    if (!this.canExecuteRule(rule)) {
      throw new Error(`Rule ${ruleId} cannot be executed due to rate limiting`);
    }

    try {
      for (const action of rule.actions) {
        await this.executeAction(action, context);
      }

      this.recordExecution(rule.id);
      rule.lastExecuted = new Date();
      rule.executionCount++;
    } catch (error) {
      console.error(`Error executing rule ${ruleId}:`, error);
      throw error;
    }
  }

  private async evaluateCondition(
    condition: Condition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    switch (condition.type) {
      case 'and':
        return this.evaluateAnd(condition, context);
      case 'or':
        return this.evaluateOr(condition, context);
      case 'not':
        return this.evaluateNot(condition, context);
      case 'simple':
        return this.evaluateSimple(condition, context);
      default:
        return false;
    }
  }

  private async evaluateAnd(
    condition: Condition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    if (!condition.conditions || condition.conditions.length === 0) {
      return true;
    }

    for (const subCondition of condition.conditions) {
      if (!(await this.evaluateCondition(subCondition, context))) {
        return false;
      }
    }

    return true;
  }

  private async evaluateOr(
    condition: Condition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    if (!condition.conditions || condition.conditions.length === 0) {
      return false;
    }

    for (const subCondition of condition.conditions) {
      if (await this.evaluateCondition(subCondition, context)) {
        return true;
      }
    }

    return false;
  }

  private async evaluateNot(
    condition: Condition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    if (!condition.conditions || condition.conditions.length === 0) {
      return false;
    }

    return !(await this.evaluateCondition(condition.conditions[0], context));
  }

  private async evaluateSimple(
    condition: Condition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    if (!condition.field || !condition.operator) {
      return false;
    }

    const fieldValue = this.getNestedValue(context.data, condition.field);

    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'gt':
        return Number(fieldValue) > Number(condition.value);
      case 'lt':
        return Number(fieldValue) < Number(condition.value);
      case 'gte':
        return Number(fieldValue) >= Number(condition.value);
      case 'lte':
        return Number(fieldValue) <= Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      return current && typeof current === 'object' && key in current
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj);
  }

  private async executeAction(
    action: Action,
    _context: RuleExecutionContext
  ): Promise<void> {
    switch (action.type) {
      case 'device_command':
        console.info(
          `Executing device command: ${action.command} on ${action.deviceId}`,
          action.parameters
        );
        break;
      case 'scene_execution':
        console.info(`Executing scene: ${action.sceneId}`);
        break;
      case 'notification':
        console.info(`Sending notification: ${action.message}`);
        break;
      case 'delay':
        await this.delay(action.delayMs ?? 0);
        break;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private canExecuteRule(rule: Rule): boolean {
    if (rule.lastExecuted && rule.cooldownMs) {
      const timeSinceLastExecution = Date.now() - rule.lastExecuted.getTime();
      if (timeSinceLastExecution < rule.cooldownMs) {
        return false;
      }
    }

    const history = this.executionHistory.get(rule.id) ?? [];
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentExecutions = history.filter((date) => date > oneHourAgo);

    if (
      rule.maxActivationsPerHour &&
      recentExecutions.length >= rule.maxActivationsPerHour
    ) {
      return false;
    }

    return true;
  }

  private recordExecution(ruleId: string): void {
    const history = this.executionHistory.get(ruleId) ?? [];
    history.push(new Date());

    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentHistory = history.filter((date) => date > oneHourAgo);

    this.executionHistory.set(ruleId, recentHistory);
  }

  private checkRuleSafety(rule: Rule): SafetyCheckResult {
    const violations: string[] = [];

    if (this.detectLoop(rule)) {
      violations.push('Potential infinite loop detected');
    }

    if (rule.actions.length === 0) {
      violations.push('Rule has no actions');
    }

    if (rule.actions.length > 20) {
      violations.push('Too many actions (max 20)');
    }

    const deviceCommands = rule.actions.filter((a) => a.type === 'device_command');
    if (deviceCommands.length > 10) {
      violations.push('Too many device commands in single rule (max 10)');
    }

    if (rule.maxActivationsPerHour && rule.maxActivationsPerHour > 100) {
      violations.push('Max activations per hour too high (max 100)');
    }

    return {
      safe: violations.length === 0,
      violations,
    };
  }

  private detectLoop(rule: Rule): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (ruleId: string): boolean => {
      visited.add(ruleId);
      recursionStack.add(ruleId);

      const triggers = this.executionGraph.get(ruleId) ?? new Set();
      for (const triggeredRule of triggers) {
        if (!visited.has(triggeredRule)) {
          if (dfs(triggeredRule)) {
            return true;
          }
        } else if (recursionStack.has(triggeredRule)) {
          return true;
        }
      }

      recursionStack.delete(ruleId);
      return false;
    };

    return dfs(rule.id);
  }

  clearHistory(): void {
    this.executionHistory.clear();
  }

  getExecutionStats(ruleId: string): {
    executionCount: number;
    lastExecuted?: Date;
    recentExecutions: number;
  } {
    const rule = this.rules.get(ruleId);
    const history = this.executionHistory.get(ruleId) ?? [];
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentExecutions = history.filter((date) => date > oneHourAgo).length;

    return {
      executionCount: rule?.executionCount ?? 0,
      lastExecuted: rule?.lastExecuted,
      recentExecutions,
    };
  }
}
