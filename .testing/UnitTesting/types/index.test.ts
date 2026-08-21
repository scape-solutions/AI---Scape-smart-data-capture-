import { describe, it, expect } from 'vitest';
import { OperationType } from '../../../src/types/index';

describe('OperationType Enum', () => {
  it('should have correct enum values', () => {
    expect(OperationType.CREATE).toBe('create');
    expect(OperationType.UPDATE).toBe('update');
    expect(OperationType.DELETE).toBe('delete');
    expect(OperationType.LIST).toBe('list');
    expect(OperationType.GET).toBe('get');
    expect(OperationType.WRITE).toBe('write');
  });
});
