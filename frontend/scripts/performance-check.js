#!/usr/bin/env node

/**
 * Performance Budget Enforcement Script
 * Validates build output against performance budgets
 * EbroValley Digital - Performance Excellence
 */

const fs = require('fs');
const path = require('path');
const { gzipSize } = require('gzip-size');
const chalk = require('chalk');
const Table = require('cli-table3');

// Load configuration
const config = require('../performance-budget.config.js');

class PerformanceBudgetChecker {
  constructor() {
    this.distPath = path.join(__dirname, '..', 'dist');
    this.violations = [];
    this.warnings = [];
    this.results = {};
  }

  async run() {
    console.log(chalk.blue.bold('🔍 Performance Budget Checker\n'));
    console.log(chalk.gray('EbroValley Digital - Checking build artifacts...\n'));

    try {
      await this.checkBundleSizes();
      await this.checkAssetSizes();
      await this.generateReport();
      
      this.displayResults();
      this.saveReport();
      
      return this.violations.length === 0;
    } catch (error) {
      console.error(chalk.red.bold('❌ Performance check failed:'), error.message);
      return false;
    }
  }

  async checkBundleSizes() {
    console.log(chalk.yellow('📦 Checking bundle sizes...'));
    
    const jsFiles = this.getJSFiles();
    let totalSize = 0;
    let totalGzipSize = 0;
    
    const bundleTable = new Table({
      head: ['File', 'Size', 'Gzipped', 'Status'],
      colWidths: [40, 12, 12, 12]
    });

    for (const file of jsFiles) {
      const filePath = path.join(this.distPath, file);
      const size = fs.statSync(filePath).size;
      const gzipped = await gzipSize(fs.readFileSync(filePath));
      
      totalSize += size;
      totalGzipSize += gzipped;
      
      const sizeKB = Math.round(size / 1024);
      const gzippedKB = Math.round(gzipped / 1024);
      
      let status = '✅';
      let budget;
      
      // Determine budget type
      if (file.includes('index-') || file.includes('main-')) {
        budget = config.budgets.initial;
      } else if (file.includes('vendor') || file.includes('react-vendor')) {
        budget = config.budgets.vendor;
      } else {
        budget = config.budgets.chunks;
      }
      
      // Check against budget
      if (sizeKB > budget.maxSize || gzippedKB > budget.maxSizeGzip) {
        status = '❌';
        this.violations.push({
          type: 'bundle',
          file,
          size: sizeKB,
          gzipped: gzippedKB,
          budget: budget.maxSize,
          budgetGzip: budget.maxSizeGzip
        });
      } else if (sizeKB > budget.warning || gzippedKB > budget.warningGzip) {
        status = '⚠️';
        this.warnings.push({
          type: 'bundle',
          file,
          size: sizeKB,
          gzipped: gzippedKB,
          budget: budget.warning,
          budgetGzip: budget.warningGzip
        });
      }
      
      bundleTable.push([
        file,
        `${sizeKB}KB`,
        `${gzippedKB}KB`,
        status
      ]);
    }
    
    console.log(bundleTable.toString());
    
    // Check total size
    const totalKB = Math.round(totalSize / 1024);
    const totalGzipKB = Math.round(totalGzipSize / 1024);
    
    console.log(chalk.cyan(`\nTotal bundle size: ${totalKB}KB (${totalGzipKB}KB gzipped)`));
    
    if (totalKB > config.budgets.total.maxSize || totalGzipKB > config.budgets.total.maxSizeGzip) {
      this.violations.push({
        type: 'total',
        size: totalKB,
        gzipped: totalGzipKB,
        budget: config.budgets.total.maxSize,
        budgetGzip: config.budgets.total.maxSizeGzip
      });
    }
    
    this.results.bundles = {
      totalSize: totalKB,
      totalGzipped: totalGzipKB,
      files: jsFiles.length
    };
  }

  async checkAssetSizes() {
    console.log(chalk.yellow('\n🖼️  Checking asset sizes...'));
    
    const assetTypes = {
      images: /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i,
      fonts: /\.(woff|woff2|eot|ttf|otf)$/i,
      css: /\.css$/i
    };
    
    const assetTable = new Table({
      head: ['Type', 'Count', 'Total Size', 'Budget', 'Status'],
      colWidths: [12, 8, 12, 12, 8]
    });

    for (const [type, pattern] of Object.entries(assetTypes)) {
      const files = this.getFilesByPattern(pattern);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.distPath, file);
        totalSize += fs.statSync(filePath).size;
      }
      
      const sizeKB = Math.round(totalSize / 1024);
      const budget = config.assets[type];
      
      let status = '✅';
      
      if (sizeKB > budget.maxSize) {
        status = '❌';
        this.violations.push({
          type: 'asset',
          assetType: type,
          size: sizeKB,
          budget: budget.maxSize
        });
      } else if (sizeKB > budget.warning) {
        status = '⚠️';
        this.warnings.push({
          type: 'asset',
          assetType: type,
          size: sizeKB,
          budget: budget.warning
        });
      }
      
      assetTable.push([
        type,
        files.length,
        `${sizeKB}KB`,
        `${budget.maxSize}KB`,
        status
      ]);
      
      this.results[type] = {
        count: files.length,
        size: sizeKB
      };
    }
    
    console.log(assetTable.toString());
  }

  generateReport() {
    console.log(chalk.yellow('\n📊 Generating performance report...'));
    
    // Calculate performance score
    let score = 100;
    
    // Deduct points for violations
    score -= this.violations.length * 10;
    score -= this.warnings.length * 5;
    
    // Ensure score doesn't go below 0
    score = Math.max(0, score);
    
    this.results.performance = {
      score,
      violations: this.violations.length,
      warnings: this.warnings.length,
      timestamp: new Date().toISOString()
    };
    
    // Performance recommendations
    this.results.recommendations = this.generateRecommendations();
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.violations.some(v => v.type === 'bundle')) {
      recommendations.push('Consider code splitting to reduce bundle sizes');
      recommendations.push('Implement dynamic imports for non-critical features');
      recommendations.push('Review and optimize vendor dependencies');
    }
    
    if (this.violations.some(v => v.assetType === 'images')) {
      recommendations.push('Optimize images using WebP/AVIF formats');
      recommendations.push('Implement lazy loading for images');
      recommendations.push('Use responsive images with srcset');
    }
    
    if (this.violations.some(v => v.assetType === 'fonts')) {
      recommendations.push('Use font-display: swap for better performance');
      recommendations.push('Subset fonts to include only needed characters');
      recommendations.push('Consider using system fonts');
    }
    
    if (this.violations.some(v => v.type === 'total')) {
      recommendations.push('Implement tree shaking to remove unused code');
      recommendations.push('Use compression (Gzip/Brotli) on server');
      recommendations.push('Consider using a CDN for static assets');
    }
    
    return recommendations;
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log(chalk.blue.bold('📋 PERFORMANCE BUDGET REPORT'));
    console.log('='.repeat(60));
    
    // Overall status
    const score = this.results.performance.score;
    let scoreColor = chalk.green;
    let scoreIcon = '🟢';
    
    if (score < 80) {
      scoreColor = chalk.yellow;
      scoreIcon = '🟡';
    }
    if (score < 60) {
      scoreColor = chalk.red;
      scoreIcon = '🔴';
    }
    
    console.log(`\n${scoreIcon} Performance Score: ${scoreColor.bold(score)}/100`);
    
    // Violations
    if (this.violations.length > 0) {
      console.log(chalk.red.bold(`\n❌ Budget Violations: ${this.violations.length}`));
      this.violations.forEach(violation => {
        console.log(chalk.red(`  • ${this.formatViolation(violation)}`));
      });
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log(chalk.yellow.bold(`\n⚠️  Warnings: ${this.warnings.length}`));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`  • ${this.formatViolation(warning)}`));
      });
    }
    
    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log(chalk.blue.bold('\n💡 Recommendations:'));
      this.results.recommendations.forEach(rec => {
        console.log(chalk.blue(`  • ${rec}`));
      });
    }
    
    // Summary
    console.log(chalk.cyan.bold('\n📈 Summary:'));
    console.log(`  • Total bundle size: ${this.results.bundles.totalSize}KB`);
    console.log(`  • Gzipped size: ${this.results.bundles.totalGzipped}KB`);
    console.log(`  • JavaScript files: ${this.results.bundles.files}`);
    console.log(`  • Images: ${this.results.images?.count || 0} files (${this.results.images?.size || 0}KB)`);
    console.log(`  • Fonts: ${this.results.fonts?.count || 0} files (${this.results.fonts?.size || 0}KB)`);
    console.log(`  • CSS: ${this.results.css?.count || 0} files (${this.results.css?.size || 0}KB)`);
    
    console.log('\n' + '='.repeat(60));
    
    if (this.violations.length === 0) {
      console.log(chalk.green.bold('✅ All performance budgets passed!'));
    } else {
      console.log(chalk.red.bold('❌ Performance budget violations detected!'));
    }
  }

  formatViolation(violation) {
    if (violation.type === 'bundle') {
      return `${violation.file}: ${violation.size}KB (budget: ${violation.budget}KB)`;
    } else if (violation.type === 'asset') {
      return `${violation.assetType}: ${violation.size}KB (budget: ${violation.budget}KB)`;
    } else if (violation.type === 'total') {
      return `Total size: ${violation.size}KB (budget: ${violation.budget}KB)`;
    }
    return JSON.stringify(violation);
  }

  saveReport() {
    const reportPath = path.join(this.distPath, 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(chalk.gray(`\n📄 Report saved to: ${reportPath}`));
  }

  getJSFiles() {
    return this.getFilesByPattern(/\.js$/);
  }

  getFilesByPattern(pattern) {
    if (!fs.existsSync(this.distPath)) {
      return [];
    }
    
    const files = [];
    
    function traverse(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (pattern.test(item)) {
          files.push(path.relative(this.distPath, fullPath));
        }
      }
    }
    
    traverse.call(this, this.distPath);
    return files;
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new PerformanceBudgetChecker();
  
  checker.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(chalk.red.bold('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = PerformanceBudgetChecker;