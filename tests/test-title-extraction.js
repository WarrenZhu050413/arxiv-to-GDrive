const { fetchHtmlPageTitle } = require('../background.js');

// Import test setup
require('./test-setup.js');

describe('Title Extraction Tests', () => {
  beforeEach(() => {
    // Clear fetch mock history before each test
    global.fetch.mockClear();
  });

  test('should extract and clean arXiv title correctly', async () => {
    // Setup mock for arXiv page
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>[2411.02134] Advancing Large Language Models: Systematic Benchmarking and Performance Analysis</title></head><body></body></html>')
      })
    );

    const url = 'https://arxiv.org/abs/2411.02134';
    const title = await fetchHtmlPageTitle(url);
    
    expect(fetch).toHaveBeenCalledWith(url);
    expect(title).toBe('Advancing Large Language Models- Systematic Benchmarking and Performance Analysis');
  });

  test('should extract and clean ACM title correctly', async () => {
    // Setup mock for ACM page
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>The Machine Learning Lifecycle: A Comprehensive Framework for Building Robust AI Systems</title></head><body></body></html>')
      })
    );

    const url = 'https://dl.acm.org/doi/10.1145/3528548.3572734';
    const title = await fetchHtmlPageTitle(url);
    
    expect(fetch).toHaveBeenCalledWith(url);
    expect(title).toBe('The Machine Learning Lifecycle- A Comprehensive Framework for Building Robust AI Systems');
  });

  test('should extract and clean NSDI title correctly', async () => {
    // Setup mock for NSDI page
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>ScaleNet: Optimizing Large-Scale Distributed Systems for Machine Learning Workloads</title></head><body></body></html>')
      })
    );

    const url = 'https://www.usenix.org/conference/nsdi23/presentation/lee';
    const title = await fetchHtmlPageTitle(url);
    
    expect(fetch).toHaveBeenCalledWith(url);
    expect(title).toBe('ScaleNet- Optimizing Large-Scale Distributed Systems for Machine Learning Workloads');
  });

  test('should handle HTML entities in title', async () => {
    // Setup mock for a page with HTML entities
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head><title>Special Characters &amp; HTML Entities: A &quot;Test&quot; Case</title></head><body></body></html>')
      })
    );

    const url = 'https://example.com/html-entities';
    const title = await fetchHtmlPageTitle(url);
    
    expect(fetch).toHaveBeenCalledWith(url);
    // The fetchHtmlPageTitle function just does basic cleaning without entity decoding
    expect(title).toBe('Special Characters &amp- HTML Entities- A &quot-Test&quot- Case');
  });

  test('should handle failed fetch requests', async () => {
    // Setup mock for failed fetch
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })
    );

    const url = 'https://example.com/not-found';
    const title = await fetchHtmlPageTitle(url);
    
    expect(fetch).toHaveBeenCalledWith(url);
    expect(title).toBeNull();
  });

  test('should handle missing title tag', async () => {
    // Setup mock for page without title
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><head></head><body>No title here</body></html>')
      })
    );

    const url = 'https://example.com/no-title';
    const title = await fetchHtmlPageTitle(url);
    
    expect(fetch).toHaveBeenCalledWith(url);
    expect(title).toBeNull();
  });
}); 