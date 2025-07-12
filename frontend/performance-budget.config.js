/**
 * Performance Budget Configuration
 * Enforces performance standards for production builds
 * EbroValley Digital - Performance Excellence
 */

module.exports = {
  // Bundle size limits (in KB)
  budgets: {
    // Initial bundle (critical path)
    initial: {
      maxSize: 250, // 250KB for main bundle
      maxSizeGzip: 100, // 100KB gzipped
      warning: 200, // Warning at 200KB
      warningGzip: 80 // Warning at 80KB gzipped
    },
    
    // Vendor chunks
    vendor: {
      maxSize: 400, // 400KB for vendor chunks
      maxSizeGzip: 150, // 150KB gzipped
      warning: 350,
      warningGzip: 130
    },
    
    // Feature chunks (lazy loaded)
    chunks: {
      maxSize: 150, // 150KB per chunk
      maxSizeGzip: 60, // 60KB gzipped
      warning: 120,
      warningGzip: 50
    },
    
    // Total application size
    total: {
      maxSize: 2000, // 2MB total
      maxSizeGzip: 800, // 800KB gzipped
      warning: 1500,
      warningGzip: 600
    }
  },
  
  // Asset type budgets
  assets: {
    images: {
      maxSize: 1000, // 1MB total for images
      warning: 800,
      formats: ['webp', 'avif', 'jpeg', 'png']
    },
    
    fonts: {
      maxSize: 200, // 200KB for fonts
      warning: 150,
      formats: ['woff2', 'woff']
    },
    
    css: {
      maxSize: 100, // 100KB for CSS
      maxSizeGzip: 30, // 30KB gzipped
      warning: 80,
      warningGzip: 25
    }
  },
  
  // Performance metrics budgets
  metrics: {
    // Core Web Vitals
    lcp: {
      target: 2.5, // Largest Contentful Paint (seconds)
      warning: 2.0
    },
    
    fid: {
      target: 100, // First Input Delay (milliseconds)
      warning: 80
    },
    
    cls: {
      target: 0.1, // Cumulative Layout Shift
      warning: 0.05
    },
    
    // Additional metrics
    fcp: {
      target: 1.8, // First Contentful Paint (seconds)
      warning: 1.5
    },
    
    si: {
      target: 3.4, // Speed Index (seconds)
      warning: 2.5
    },
    
    tti: {
      target: 3.8, // Time to Interactive (seconds)
      warning: 3.0
    },
    
    tbt: {
      target: 200, // Total Blocking Time (milliseconds)
      warning: 150
    }
  },
  
  // Network conditions for testing
  networkConditions: {
    fast3g: {
      downloadThroughput: 1500000, // 1.5 Mbps
      uploadThroughput: 750000, // 750 Kbps
      latency: 150 // 150ms
    },
    
    slow3g: {
      downloadThroughput: 500000, // 500 Kbps
      uploadThroughput: 500000, // 500 Kbps
      latency: 400 // 400ms
    },
    
    slow4g: {
      downloadThroughput: 4000000, // 4 Mbps
      uploadThroughput: 3000000, // 3 Mbps
      latency: 170 // 170ms
    }
  },
  
  // Lighthouse configuration
  lighthouse: {
    settings: {
      onlyCategories: ['performance'],
      skipAudits: ['uses-http2'],
      throttlingMethod: 'simulate'
    },
    
    thresholds: {
      performance: 90, // Target Lighthouse performance score
      warning: 80     // Warning threshold
    }
  },
  
  // Bundle analyzer configuration
  analyzer: {
    enabled: true,
    openAnalyzer: false,
    generateStatsFile: true,
    reportFilename: 'bundle-report.html',
    statsFilename: 'bundle-stats.json'
  },
  
  // Monitoring URLs for production
  monitoringUrls: [
    'https://ebrovalley.digital/adaptive-learning',
    'https://ebrovalley.digital/adaptive-learning/dashboard',
    'https://ebrovalley.digital/adaptive-learning/assessment'
  ],
  
  // Error handling
  failBuild: {
    onBudgetExceeded: false, // Don't fail build, just warn
    onPerformanceThreshold: false, // Don't fail on performance threshold
    onCriticalMetrics: true // Fail if critical metrics are way off
  },
  
  // Reporting
  reporting: {
    console: true,
    file: 'performance-report.json',
    webhook: process.env.PERFORMANCE_WEBHOOK_URL,
    slack: process.env.SLACK_WEBHOOK_URL
  }
};