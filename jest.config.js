module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // File extensions for test files
  moduleFileExtensions: ['js'],
  
  // Directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Collect coverage information from the specified directories
  collectCoverageFrom: [
    'background.js',
    'utils/**/*.js'
  ],
  
  // The root directory that Jest should scan for tests
  roots: [
    '<rootDir>/tests'
  ],
  
  // A list of paths to directories that Jest should use to search for files in
  moduleDirectories: [
    'node_modules',
    '<rootDir>'
  ],
  
  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Ignore specific directories
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  
  // The test runner to use
  testRunner: 'jest-circus/runner',
  
  // Display test results with specified style
  verbose: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Allow ES module syntax even though Node.js doesn't fully support it
  transformIgnorePatterns: [
    '/node_modules/(?!.*\\.js$)'
  ]
}; 