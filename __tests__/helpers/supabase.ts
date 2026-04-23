import { vi } from "vitest";

export type MockResult = {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
};

export function createMockSupabase(defaults?: MockResult) {
  const mock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn(),
    single: vi.fn(),
  };
  if (defaults) {
    const { data = null, error = null, count = null } = defaults;
    mock.range.mockResolvedValue({ data, error, count });
    mock.single.mockResolvedValue({ data, error });
  }
  return mock;
}
