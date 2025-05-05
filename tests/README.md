# Paper-to-GDrive Tests

This directory contains automated tests for the Paper-to-GDrive Chrome extension. It is generated with Claude 3.7 Sonnet.

## Test Structure

- `test-setup.js` - Contains mock implementations of Chrome APIs used by all tests
- `test-title-extraction.js` - Tests for the title extraction functionality
- `test-url-detection.js` - Tests for URL pattern detection and handling
- `test-html-capture.js` - Tests for HTML capture functionality
- `mock-pages/` - Contains mock HTML pages for testing different website types

## Running Tests

### Using the Automated Test Runner

The easiest way to run all tests is to use the provided test runner script:

```bash
# Make the script executable
chmod +x run-tests.sh

# Run all tests
./run-tests.sh

# Run a specific test file
./run-tests.sh tests/test-url-detection.js
```

The script will:
1. Set up a conda environment if conda is available
2. Install all necessary dependencies
3. Run the specified tests or all tests in the `tests` directory

### Manual Test Execution

If you prefer to run tests manually, follow these steps:

1. Ensure Node.js is installed
2. Install Jest and other dependencies:
   ```bash
   npm install --save-dev jest @babel/preset-env babel-jest
   ```
3. Run tests:
   ```bash
   npx jest tests/
   ```

## Writing New Tests

When writing new tests:

1. Import the module under test:
   ```javascript
   const { functionName } = require('../path/to/module.js');
   ```

2. Import the test setup:
   ```javascript
   require('./test-setup.js');
   ```

3. Write tests using Jest's `describe`, `test`, and `expect` functions:
   ```javascript
   describe('Module Name Tests', () => {
     test('should do something specific', () => {
       // Arrange
       // Act
       // Assert
       expect(result).toBe(expectedValue);
     });
   });
   ```

4. If needed, modify the mock implementations in `test-setup.js` to match your test requirements.

## Mocking Chrome Extension APIs

The tests use Jest's mocking capabilities to simulate Chrome's extension APIs. See `test-setup.js` for examples of how to mock:

- `chrome.identity`
- `chrome.scripting`
- `chrome.tabs`
- `chrome.runtime`
- `chrome.storage`
- `fetch` API
- And other browser APIs

## Test Coverage

Run tests with coverage information:

```bash
./run-tests.sh --coverage
```

This will generate a coverage report in the `coverage` directory. 