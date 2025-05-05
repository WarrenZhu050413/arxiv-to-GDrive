const background = require('../background.js');

// Import test setup
require('./test-setup.js');

describe('URL Detection and Handling Tests', () => {
  beforeEach(() => {
    global.fetch.mockClear();
  });

  test('should detect and process arXiv abstract URL', async () => {
    // Mock tab with arXiv abstract URL
    const tab = {
      id: 123,
      url: 'https://arxiv.org/abs/2411.02134',
      title: 'arXiv Abstract Page'
    };

    // Mock fetch to return a title for the abstract page
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>[2411.02134] Advancing Large Language Models</title></head><body></body></html>')
      })
    );

    const result = await background.getUrlAndName(tab);
    
    // Check the result structure: [pdfUrl, title, identifier, type]
    expect(result).toHaveLength(4);
    expect(result[0]).toBe('https://arxiv.org/pdf/2411.02134.pdf'); // PDF URL
    expect(result[1]).toBe('Advancing Large Language Models'); // Title
    expect(result[2]).toBe('2411.02134'); // Identifier
    expect(result[3]).toBe('arXiv'); // Type
  });

  test('should detect and process arXiv PDF URL', async () => {
    // Mock tab with arXiv PDF URL
    const tab = {
      id: 123,
      url: 'https://arxiv.org/pdf/2411.02134.pdf',
      title: 'arXiv PDF Page'
    };

    // Mock fetch to return a title for the abstract page
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>[2411.02134] Advancing Large Language Models</title></head><body></body></html>')
      })
    );

    const result = await background.getUrlAndName(tab);
    
    expect(result).toHaveLength(4);
    expect(result[0]).toBe('https://arxiv.org/pdf/2411.02134.pdf'); // PDF URL
    expect(result[1]).toBe('Advancing Large Language Models'); // Title
    expect(result[2]).toBe('2411.02134'); // Identifier
    expect(result[3]).toBe('arXiv'); // Type
  });

  test('should detect and process ACM abstract URL', async () => {
    // Mock tab with ACM abstract URL
    const tab = {
      id: 123,
      url: 'https://dl.acm.org/doi/10.1145/3528548.3572734',
      title: 'ACM Abstract Page'
    };

    // Mock fetch to return a title for the abstract page
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>The Machine Learning Lifecycle</title></head><body></body></html>')
      })
    );

    const result = await background.getUrlAndName(tab);
    
    expect(result).toHaveLength(4);
    expect(result[0]).toBe('https://dl.acm.org/doi/pdf/10.1145/3528548.3572734'); // PDF URL
    expect(result[1]).toBe('The Machine Learning Lifecycle'); // Title
    expect(result[2]).toBe('10.1145/3528548.3572734'); // Identifier
    expect(result[3]).toBe('DOI'); // Type
  });

  test('should detect and process ACM PDF URL', async () => {
    // Mock tab with ACM PDF URL
    const tab = {
      id: 123,
      url: 'https://dl.acm.org/doi/pdf/10.1145/3528548.3572734',
      title: 'ACM PDF Page'
    };

    // Mock fetch to return a title for the abstract page
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>The Machine Learning Lifecycle</title></head><body></body></html>')
      })
    );

    const result = await background.getUrlAndName(tab);
    
    expect(result).toHaveLength(4);
    expect(result[0]).toBe('https://dl.acm.org/doi/pdf/10.1145/3528548.3572734'); // PDF URL
    expect(result[1]).toBe('The Machine Learning Lifecycle'); // Title
    expect(result[2]).toBe('10.1145/3528548.3572734'); // Identifier
    expect(result[3]).toBe('DOI'); // Type
  });

  test('should detect and process USENIX PDF URL', async () => {
    // Mock tab with USENIX PDF URL
    const tab = {
      id: 123,
      url: 'https://www.usenix.org/system/files/nsdi23-lee.pdf',
      title: 'USENIX PDF Page'
    };

    // Mock fetch to return a title for the presentation page
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>ScaleNet: Optimizing Large-Scale Distributed Systems</title></head><body></body></html>')
      })
    );

    const result = await background.getUrlAndName(tab);
    
    expect(result).toHaveLength(4);
    expect(result[0]).toBe('https://www.usenix.org/system/files/nsdi23-lee.pdf'); // PDF URL
    expect(result[1]).toBe('ScaleNet- Optimizing Large-Scale Distributed Systems'); // Title
    expect(result[2]).toBe('nsdi23_lee'); // Identifier
    expect(result[3]).toBe('Usenix'); // Type
  });

  test('should detect and process USENIX presentation URL', async () => {
    // Mock tab with USENIX presentation URL
    const tab = {
      id: 123,
      url: 'https://www.usenix.org/conference/nsdi23/presentation/lee',
      title: 'USENIX Presentation Page'
    };

    // Mock fetch to return a title for the presentation page
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>ScaleNet: Optimizing Large-Scale Distributed Systems</title></head><body></body></html>')
      })
    );

    const result = await background.getUrlAndName(tab);
    
    expect(result).toHaveLength(4);
    expect(result[0]).toBe('https://www.usenix.org/system/files/nsdi23-lee.pdf'); // PDF URL
    expect(result[1]).toBe('ScaleNet- Optimizing Large-Scale Distributed Systems'); // Title
    expect(result[2]).toBe('nsdi23_lee'); // Identifier
    expect(result[3]).toBe('Usenix'); // Type
  });

  test('should return null for unsupported URL', async () => {
    // Mock tab with a generic URL
    const tab = {
      id: 123,
      url: 'https://example.com/some-webpage',
      title: 'Generic Webpage'
    };

    const result = await background.getUrlAndName(tab);
    
    expect(result).toBeNull();
  });

  test('should handle fetch errors gracefully', async () => {
    // Mock tab with arXiv URL
    const tab = {
      id: 123,
      url: 'https://arxiv.org/abs/2411.02134',
      title: 'arXiv Abstract Page'
    };

    // Mock fetch to fail
    global.fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );

    const result = await background.getUrlAndName(tab);
    
    // Should return null on error
    expect(result).toBeNull();
  });
}); 