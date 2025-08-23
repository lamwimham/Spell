/**
 * Jest测试环境Polyfills
 * 提供测试环境所需的全局函数和对象
 */

// TextEncoder/TextDecoder polyfill for Node.js environment
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Crypto polyfill for Node.js environment
import { webcrypto } from 'crypto';
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
});

// Fetch polyfill
import fetch from 'node-fetch';
global.fetch = fetch as any;

// URL polyfill
import { URL, URLSearchParams } from 'url';
global.URL = URL as any;
global.URLSearchParams = URLSearchParams as any;

// FormData polyfill
import FormData from 'form-data';
global.FormData = FormData as any;

// Blob polyfill
class MockBlob {
  constructor(parts: any[], options: any = {}) {
    this.size = 0;
    this.type = options.type || '';
  }

  size: number;
  type: string;

  slice() {
    return new MockBlob([], {});
  }

  stream() {
    return new ReadableStream();
  }

  text() {
    return Promise.resolve('');
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
}

global.Blob = MockBlob as any;

// File polyfill
class MockFile extends MockBlob {
  constructor(parts: any[], name: string, options: any = {}) {
    super(parts, options);
    this.name = name;
    this.lastModified = options.lastModified || Date.now();
  }

  name: string;
  lastModified: number;
}

global.File = MockFile as any;

// FileReader polyfill
class MockFileReader {
  readyState = 0;
  result: any = null;
  error: any = null;

  onload: any = null;
  onerror: any = null;
  onabort: any = null;
  onloadstart: any = null;
  onloadend: any = null;
  onprogress: any = null;

  readAsText(blob: any) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'mock file content';
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }

  readAsDataURL(blob: any) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=';
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }

  readAsArrayBuffer(blob: any) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = new ArrayBuffer(0);
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }

  abort() {
    this.readyState = 2;
    if (this.onabort) this.onabort({ target: this });
  }
}

global.FileReader = MockFileReader as any;

// localStorage polyfill
const mockStorage = {
  _data: {} as Record<string, string>,

  getItem(key: string): string | null {
    return this._data[key] || null;
  },

  setItem(key: string, value: string): void {
    this._data[key] = String(value);
  },

  removeItem(key: string): void {
    delete this._data[key];
  },

  clear(): void {
    this._data = {};
  },

  get length(): number {
    return Object.keys(this._data).length;
  },

  key(index: number): string | null {
    const keys = Object.keys(this._data);
    return keys[index] || null;
  },
};

global.localStorage = mockStorage;
global.sessionStorage = { ...mockStorage, _data: {} };

// Performance polyfill
global.performance = {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByType: () => [],
  getEntriesByName: () => [],
  clearMarks: () => {},
  clearMeasures: () => {},
} as any;

// RequestAnimationFrame polyfill
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 16);
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// IntersectionObserver polyfill
class MockIntersectionObserver {
  constructor(callback: any, options: any = {}) {
    this.callback = callback;
    this.options = options;
  }

  callback: any;
  options: any;

  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = MockIntersectionObserver as any;

// ResizeObserver polyfill
class MockResizeObserver {
  constructor(callback: any) {
    this.callback = callback;
  }

  callback: any;

  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver as any;

// MutationObserver polyfill
class MockMutationObserver {
  constructor(callback: any) {
    this.callback = callback;
  }

  callback: any;

  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

global.MutationObserver = MockMutationObserver as any;

// Console polyfill enhancements
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

// Date polyfill for consistent testing
const RealDate = Date;

class MockDate extends RealDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      // Use a fixed timestamp for consistent testing
      super(1640995200000); // 2022-01-01 00:00:00 UTC
    } else {
      super(...(args as any));
    }
  }

  static now() {
    return 1640995200000; // Fixed timestamp
  }
}

// Uncomment the next line to use fixed dates in tests
// global.Date = MockDate as any;

// Math.random polyfill for deterministic testing
const originalRandom = Math.random;
let mockRandomValue = 0.5;

Math.random = jest.fn(() => mockRandomValue);

// Helper to set mock random value in tests
global.setMockRandomValue = (value: number) => {
  mockRandomValue = value;
};

// Helper to restore original Math.random
global.restoreRandomValue = () => {
  Math.random = originalRandom;
};

// Error boundary for test components
global.TestErrorBoundary = class TestErrorBoundary extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TestErrorBoundary';
  }
};
