// tests/test-setup.js
// Mock implementation of Chrome APIs

// Chrome API mock
global.chrome = {
  identity: {
    getAuthToken: jest.fn((options, callback) => {
      callback('mock-token-123');
    })
  },
  scripting: {
    executeScript: jest.fn().mockImplementation(({ target, function: scriptFn }) => {
      // Return a mock result simulating the content captured from a webpage
      return Promise.resolve([{
        result: {
          html: '<!DOCTYPE html><html><head><title>Mock Page Title</title></head><body>Mock content</body></html>',
          url: 'https://example.com',
          title: 'Mock Page Title'
        }
      }]);
    })
  },
  tabs: {
    query: jest.fn().mockImplementation((queryInfo, callback) => {
      callback([{
        id: 123,
        url: 'https://example.com',
        title: 'Example Page'
      }]);
    })
  },
  runtime: {
    lastError: null,
    sendMessage: jest.fn().mockImplementation((message, callback) => {
      if (callback) callback({ success: true });
    }),
    onMessage: {
      addListener: jest.fn()
    }
  },
  commands: {
    onCommand: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys, callback) => {
        callback({ folderPath: 'papers/test' });
      }),
      set: jest.fn().mockImplementation((data, callback) => {
        if (callback) callback();
      })
    }
  },
  notifications: {
    create: jest.fn()
  }
};

// Mock fetch API
global.fetch = jest.fn().mockImplementation((url) => {
  let responseText = '';
  
  // Different responses based on URL pattern
  if (url.includes('arxiv.org/abs')) {
    responseText = '<html><head><title>[2411.02134] Mock arXiv Paper Title</title></head><body>Mock arXiv abstract</body></html>';
  } else if (url.includes('arxiv.org/pdf')) {
    // Mock PDF response
    return Promise.resolve({
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock pdf content'], { type: 'application/pdf' }))
    });
  } else if (url.includes('dl.acm.org/doi')) {
    responseText = '<html><head><title>Mock ACM Paper Title</title></head><body>Mock ACM paper</body></html>';
  } else if (url.includes('usenix.org')) {
    responseText = '<html><head><title>Mock NSDI Paper Title</title></head><body>Mock NSDI paper</body></html>';
  } else if (url.includes('googleapis.com')) {
    // Mock Google Drive API responses
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        files: [{ id: 'folder-id-123' }],
        id: 'file-id-456'
      }),
      text: () => Promise.resolve('{}')
    });
  } else {
    responseText = '<html><head><title>Generic Webpage Title</title></head><body>Generic webpage content</body></html>';
  }
  
  return Promise.resolve({
    ok: true,
    text: () => Promise.resolve(responseText),
    blob: () => Promise.resolve(new Blob(['mock content'], { type: 'text/html' }))
  });
});

// Mock FormData
global.FormData = class FormData {
  constructor() {
    this.data = {};
  }
  append(key, value) {
    this.data[key] = value;
  }
};

// Mock Blob
if (typeof Blob !== 'function') {
  global.Blob = class Blob {
    constructor(content, options) {
      this.content = content;
      this.options = options;
      this.type = options.type;
    }
  };
}

// Set up Jest mocks for utilities
jest.mock('../utils/common/window_utils.js', () => ({
  openExtensionPopup: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../utils/common/storage_utils.js', () => ({
  stateManager: {
    setCustomTitleMode: jest.fn().mockResolvedValue(undefined),
    getCustomTitleData: jest.fn().mockResolvedValue({
      isCustomTitleFlow: true,
      originalTitle: 'Mock Original Title',
      identifier: 'mock-id',
      idType: 'arXiv',
      pdfUrl: 'https://arxiv.org/pdf/2411.02134'
    }),
    getFolderPath: jest.fn().mockResolvedValue('papers/test')
  }
}));

jest.mock('../utils/common/notification_utils.js', () => ({
  showNotification: jest.fn()
}));

jest.mock('../utils/common/error_utils.js', () => ({
  errorHandler: {
    handleChromeError: jest.fn().mockReturnValue(true),
    formatErrorMessage: jest.fn().mockImplementation((error, prefix) => `${prefix}: ${error.message || 'Unknown error'}`)
  }
})); 