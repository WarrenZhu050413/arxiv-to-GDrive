const background = require('../background.js');

// Import test setup
require('./test-setup.js');

describe('HTML Capture Functionality Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('should capture HTML content from a webpage', async () => {
    // Mock tab for testing
    const tab = {
      id: 123,
      url: 'https://example.com/test-page',
      title: 'Test Webpage'
    };

    // Mock fetch for the title fetch
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>Test Webpage Title</title></head><body></body></html>')
      })
    );

    // Mock chrome.scripting.executeScript
    chrome.scripting.executeScript.mockImplementationOnce(() => 
      Promise.resolve([{
        result: {
          html: '<!DOCTYPE html><html><head><title>Test Webpage Title</title></head><body><p>Test content</p></body></html>',
          url: 'https://example.com/test-page',
          title: 'Test Webpage Title'
        }
      }])
    );

    // Call handleGenericWebpage
    const result = await background.handleGenericWebpage(tab);

    // Verify that executeScript was called with the correct parameters
    expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: tab.id },
      function: expect.any(Function)
    });

    // Check the result
    expect(result).toHaveProperty('name', 'Test Webpage Title.html');
    expect(result).toHaveProperty('isBlob', true);
    expect(result).toHaveProperty('content');
    
    // Check that content is a Blob
    expect(result.content).toBeInstanceOf(Blob);
    expect(result.content.type).toBe('text/html');
  });

  test('should use title from fetch if available', async () => {
    // Mock tab for testing
    const tab = {
      id: 123,
      url: 'https://example.com/another-page',
      title: 'Tab Title (Not Used if Fetch Succeeds)'
    };

    // Mock fetch to return a different title
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>Better Title From HTML</title></head><body></body></html>')
      })
    );

    // Mock chrome.scripting.executeScript
    chrome.scripting.executeScript.mockImplementationOnce(() => 
      Promise.resolve([{
        result: {
          html: '<!DOCTYPE html><html><head><title>Better Title From HTML</title></head><body><p>Content</p></body></html>',
          url: 'https://example.com/another-page',
          title: 'Tab Title'
        }
      }])
    );

    // Call handleGenericWebpage
    const result = await background.handleGenericWebpage(tab);

    // Check that title from fetch was used
    expect(result.name).toBe('Better Title From HTML.html');
  });

  test('should fall back to tab title if fetch fails', async () => {
    // Mock tab for testing
    const tab = {
      id: 123,
      url: 'https://example.com/error-page',
      title: 'Fallback Tab Title'
    };

    // Mock fetch to fail
    global.fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Fetch failed'))
    );

    // Mock chrome.scripting.executeScript
    chrome.scripting.executeScript.mockImplementationOnce(() => 
      Promise.resolve([{
        result: {
          html: '<!DOCTYPE html><html><head><title>Title in content</title></head><body><p>Content</p></body></html>',
          url: 'https://example.com/error-page',
          title: 'Tab Title'
        }
      }])
    );

    // Call handleGenericWebpage
    const result = await background.handleGenericWebpage(tab);

    // Check that fallback to tab title was used
    expect(result.name).toBe('Fallback Tab Title.html');
  });

  test('should handle scripting execution failures', async () => {
    // Mock tab for testing
    const tab = {
      id: 123,
      url: 'https://example.com/scripting-error',
      title: 'Scripting Error Page'
    };

    // Mock fetch
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>Title</title></head><body></body></html>')
      })
    );

    // Mock chrome.scripting.executeScript to fail
    chrome.scripting.executeScript.mockImplementationOnce(() => 
      Promise.reject(new Error('Script execution failed'))
    );

    // Call handleGenericWebpage and expect it to throw
    await expect(background.handleGenericWebpage(tab)).rejects.toThrow();
  });

  test('should handle malformed script result', async () => {
    // Mock tab for testing
    const tab = {
      id: 123,
      url: 'https://example.com/malformed-result',
      title: 'Malformed Result'
    };

    // Mock fetch
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>Title</title></head><body></body></html>')
      })
    );

    // Mock chrome.scripting.executeScript to return malformed result
    chrome.scripting.executeScript.mockImplementationOnce(() => 
      Promise.resolve([{ result: null }])
    );

    // Call handleGenericWebpage and expect it to throw
    await expect(background.handleGenericWebpage(tab)).rejects.toThrow('Failed to capture webpage content');
  });

  test('should sanitize title for filename safety', async () => {
    // Mock tab for testing
    const tab = {
      id: 123,
      url: 'https://example.com/unsafe-title',
      title: 'Unsafe/Title:With*Invalid?Chars'
    };

    // Mock fetch to fail (so we use the tab title)
    global.fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Fetch failed'))
    );

    // Mock chrome.scripting.executeScript
    chrome.scripting.executeScript.mockImplementationOnce(() => 
      Promise.resolve([{
        result: {
          html: '<html><body>Content</body></html>',
          url: 'https://example.com/unsafe-title',
          title: 'Title'
        }
      }])
    );

    // Call handleGenericWebpage
    const result = await background.handleGenericWebpage(tab);

    // Check that title was sanitized
    expect(result.name).toBe('Unsafe-Title-With-Invalid-Chars.html');
  });
}); 