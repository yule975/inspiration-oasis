module.exports = {
  // 使用 ts-jest 预设
  preset: 'ts-jest',
  
  // 测试环境
  testEnvironment: 'node',
  
  // 根目录
  rootDir: './',
  
  // TypeScript 配置
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/tests/**/*.test.ts'
  ],
  
  // 模块解析
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // 覆盖率配置
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/scripts/**',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 测试超时时间
  testTimeout: 30000,
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // 清除 mock
  clearMocks: true,
  restoreMocks: true,
  
  // 详细输出
  verbose: true,
  
  // 最大并发数
  maxConcurrency: 4,
  
  // 失败时立即停止
  bail: false,
  
  // 开启并行运行
  maxWorkers: '50%'
};
