#!/usr/bin/env python3
"""
🚀 Adaptive Learning Ecosystem - Performance Optimizer
EbroValley Digital - Advanced Performance Tuning and Optimization

This script performs comprehensive performance analysis and optimization
for all microservices in the ecosystem.
"""

import asyncio
import aiohttp
import psutil
import time
import json
import logging
import subprocess
import statistics
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import argparse
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('performance-optimization.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ServiceMetrics:
    """Service performance metrics"""
    name: str
    port: int
    cpu_percent: float
    memory_mb: float
    response_time_ms: float
    requests_per_second: float
    error_rate: float
    availability: float
    health_status: str

@dataclass
class OptimizationRecommendation:
    """Performance optimization recommendation"""
    service: str
    category: str
    priority: str  # high, medium, low
    issue: str
    recommendation: str
    estimated_improvement: str

class PerformanceOptimizer:
    """Advanced performance optimizer for the ecosystem"""
    
    def __init__(self):
        self.services = {
            'api-gateway': 3001,
            'analytics': 5003,
            'ai-tutor': 5004,
            'collaboration': 5002,
            'content-intelligence': 5005,
            'content-management': 5001,
            'notifications': 5006,
            'progress-tracking': 5007,
            'frontend': 4173
        }
        self.metrics: Dict[str, ServiceMetrics] = {}
        self.recommendations: List[OptimizationRecommendation] = []
    
    async def measure_response_time(self, service: str, port: int, endpoint: str = "/health") -> Tuple[float, bool]:
        """Measure service response time"""
        url = f"http://localhost:{port}{endpoint}"
        
        try:
            start_time = time.time()
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(url) as response:
                    end_time = time.time()
                    response_time = (end_time - start_time) * 1000  # Convert to milliseconds
                    is_healthy = response.status == 200
                    return response_time, is_healthy
        except Exception as e:
            logger.warning(f"Failed to measure {service} response time: {e}")
            return 0.0, False
    
    async def measure_throughput(self, service: str, port: int, duration: int = 30) -> float:
        """Measure service throughput (requests per second)"""
        url = f"http://localhost:{port}/health"
        request_count = 0
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                while time.time() - start_time < duration:
                    try:
                        async with session.get(url) as response:
                            if response.status == 200:
                                request_count += 1
                    except:
                        pass
                    await asyncio.sleep(0.1)  # Small delay to prevent overwhelming
            
            actual_duration = time.time() - start_time
            return request_count / actual_duration if actual_duration > 0 else 0.0
        except Exception as e:
            logger.warning(f"Failed to measure {service} throughput: {e}")
            return 0.0
    
    def get_process_metrics(self, service: str) -> Tuple[float, float]:
        """Get CPU and memory metrics for a service process"""
        try:
            # Find process by service name or port
            for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'cpu_percent', 'memory_info']):
                try:
                    cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
                    if service in cmdline or f":{self.services[service]}" in cmdline:
                        cpu_percent = proc.cpu_percent(interval=1)
                        memory_mb = proc.info['memory_info'].rss / 1024 / 1024
                        return cpu_percent, memory_mb
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            return 0.0, 0.0
        except Exception as e:
            logger.warning(f"Failed to get process metrics for {service}: {e}")
            return 0.0, 0.0
    
    async def collect_service_metrics(self, service: str, port: int) -> ServiceMetrics:
        """Collect comprehensive metrics for a service"""
        logger.info(f"📊 Collecting metrics for {service}...")
        
        # Response time and availability
        response_times = []
        successful_requests = 0
        total_requests = 5
        
        for _ in range(total_requests):
            response_time, is_healthy = await self.measure_response_time(service, port)
            response_times.append(response_time)
            if is_healthy:
                successful_requests += 1
            await asyncio.sleep(0.5)
        
        avg_response_time = statistics.mean(response_times) if response_times else 0.0
        availability = (successful_requests / total_requests) * 100
        
        # Process metrics
        cpu_percent, memory_mb = self.get_process_metrics(service)
        
        # Throughput measurement (quick test)
        throughput = await self.measure_throughput(service, port, duration=10)
        
        # Error rate (simplified)
        error_rate = (1 - successful_requests / total_requests) * 100
        
        # Health status
        health_status = "healthy" if availability >= 80 else "unhealthy"
        
        metrics = ServiceMetrics(
            name=service,
            port=port,
            cpu_percent=cpu_percent,
            memory_mb=memory_mb,
            response_time_ms=avg_response_time,
            requests_per_second=throughput,
            error_rate=error_rate,
            availability=availability,
            health_status=health_status
        )
        
        self.metrics[service] = metrics
        return metrics
    
    def analyze_performance_issues(self):
        """Analyze metrics and generate optimization recommendations"""
        logger.info("🔍 Analyzing performance issues...")
        
        for service, metrics in self.metrics.items():
            # High response time
            if metrics.response_time_ms > 500:
                self.recommendations.append(OptimizationRecommendation(
                    service=service,
                    category="Response Time",
                    priority="high",
                    issue=f"High response time: {metrics.response_time_ms:.2f}ms",
                    recommendation="Implement caching, optimize database queries, consider connection pooling",
                    estimated_improvement="50-70% response time reduction"
                ))
            elif metrics.response_time_ms > 200:
                self.recommendations.append(OptimizationRecommendation(
                    service=service,
                    category="Response Time",
                    priority="medium",
                    issue=f"Moderate response time: {metrics.response_time_ms:.2f}ms",
                    recommendation="Profile code for bottlenecks, optimize async operations",
                    estimated_improvement="20-40% response time reduction"
                ))
            
            # High CPU usage
            if metrics.cpu_percent > 80:
                self.recommendations.append(OptimizationRecommendation(
                    service=service,
                    category="CPU Usage",
                    priority="high",
                    issue=f"High CPU usage: {metrics.cpu_percent:.1f}%",
                    recommendation="Scale horizontally, optimize algorithms, implement load balancing",
                    estimated_improvement="Reduce CPU load by 40-60%"
                ))
            elif metrics.cpu_percent > 50:
                self.recommendations.append(OptimizationRecommendation(
                    service=service,
                    category="CPU Usage",
                    priority="medium",
                    issue=f"Moderate CPU usage: {metrics.cpu_percent:.1f}%",
                    recommendation="Profile CPU-intensive operations, consider async processing",
                    estimated_improvement="Reduce CPU load by 20-30%"
                ))
            
            # High memory usage
            if metrics.memory_mb > 1000:
                self.recommendations.append(OptimizationRecommendation(
                    service=service,
                    category="Memory Usage",
                    priority="high",
                    issue=f"High memory usage: {metrics.memory_mb:.1f}MB",
                    recommendation="Implement memory caching with TTL, optimize data structures, check for memory leaks",
                    estimated_improvement="Reduce memory usage by 30-50%"
                ))
            elif metrics.memory_mb > 500:
                self.recommendations.append(OptimizationRecommendation(
                    service=service,
                    category="Memory Usage",
                    priority="medium",
                    issue=f"Moderate memory usage: {metrics.memory_mb:.1f}MB",
                    recommendation="Optimize data loading, implement pagination for large datasets",
                    estimated_improvement="Reduce memory usage by 15-25%"
                ))
            
            # Low throughput
            if metrics.requests_per_second < 10:
                self.recommendations.append(OptimizationRecommendation(
                    service=service,
                    category="Throughput",
                    priority="medium",
                    issue=f"Low throughput: {metrics.requests_per_second:.1f} req/s",
                    recommendation="Implement connection pooling, optimize I/O operations, consider async frameworks",
                    estimated_improvement="Increase throughput by 2-3x"
                ))
            
            # High error rate
            if metrics.error_rate > 5:
                self.recommendations.append(OptimizationRecommendation(
                    service=service,
                    category="Reliability",
                    priority="high",
                    issue=f"High error rate: {metrics.error_rate:.1f}%",
                    recommendation="Implement circuit breakers, improve error handling, add health checks",
                    estimated_improvement="Reduce error rate to <1%"
                ))
            
            # Low availability
            if metrics.availability < 95:
                self.recommendations.append(OptimizationRecommendation(
                    service=service,
                    category="Availability",
                    priority="high",
                    issue=f"Low availability: {metrics.availability:.1f}%",
                    recommendation="Implement redundancy, improve health checks, add auto-recovery",
                    estimated_improvement="Achieve 99%+ availability"
                ))
    
    def generate_optimization_scripts(self):
        """Generate optimization scripts based on recommendations"""
        logger.info("🛠️ Generating optimization scripts...")
        
        optimization_script = """#!/bin/bash
# 🚀 Adaptive Learning Ecosystem - Performance Optimization Script
# Generated automatically based on performance analysis

echo "🚀 Starting performance optimization..."

"""
        
        for rec in self.recommendations:
            if rec.priority == "high":
                if "caching" in rec.recommendation.lower():
                    optimization_script += f"""
# Optimize {rec.service} - {rec.category}
echo "📈 Optimizing {rec.service} for {rec.category.lower()}..."

# Implement Redis caching for {rec.service}
if [ -f "services/{rec.service}/main.py" ]; then
    # Add caching configuration
    grep -q "redis" services/{rec.service}/requirements.txt || echo "redis==5.0.1" >> services/{rec.service}/requirements.txt
    
    # Restart service with optimized configuration
    cd services/{rec.service}
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        pip install -r requirements.txt
        # Add optimization flags
        export CACHE_ENABLED=true
        export CACHE_TTL=300
        python main.py &
        deactivate
    fi
    cd ../..
fi
"""
                
                elif "scale" in rec.recommendation.lower():
                    optimization_script += f"""
# Scale {rec.service} horizontally
echo "📊 Scaling {rec.service}..."

# Start additional instance on different port
if [ -f "services/{rec.service}/main.py" ]; then
    cd services/{rec.service}
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        export PORT=$(($(echo {rec.service} | cut -d':' -f2) + 10))
        python main.py &
        deactivate
    fi
    cd ../..
fi
"""
        
        optimization_script += """
echo "✅ Performance optimization completed!"
echo "📊 Run performance tests to verify improvements"
"""
        
        # Write optimization script
        with open("scripts/apply-optimizations.sh", "w") as f:
            f.write(optimization_script)
        
        # Make executable
        subprocess.run(["chmod", "+x", "scripts/apply-optimizations.sh"])
        logger.info("✅ Optimization script generated: scripts/apply-optimizations.sh")
    
    def generate_monitoring_config(self):
        """Generate monitoring configuration for performance tracking"""
        logger.info("📊 Generating monitoring configuration...")
        
        monitoring_config = {
            "version": "1.0",
            "generated": time.strftime("%Y-%m-%d %H:%M:%S"),
            "services": {},
            "alerting": {
                "rules": []
            }
        }
        
        for service, metrics in self.metrics.items():
            monitoring_config["services"][service] = {
                "port": metrics.port,
                "thresholds": {
                    "response_time_ms": min(metrics.response_time_ms * 1.5, 500),
                    "cpu_percent": min(metrics.cpu_percent * 1.2, 80),
                    "memory_mb": min(metrics.memory_mb * 1.3, 1000),
                    "error_rate": max(metrics.error_rate * 0.8, 1),
                    "availability": max(metrics.availability * 0.95, 99)
                },
                "baseline": asdict(metrics)
            }
            
            # Generate alert rules
            monitoring_config["alerting"]["rules"].extend([
                {
                    "service": service,
                    "metric": "response_time",
                    "condition": f"> {min(metrics.response_time_ms * 1.5, 500)}",
                    "severity": "warning",
                    "message": f"{service} response time is elevated"
                },
                {
                    "service": service,
                    "metric": "availability",
                    "condition": f"< {max(metrics.availability * 0.95, 99)}",
                    "severity": "critical",
                    "message": f"{service} availability is low"
                }
            ])
        
        # Save monitoring configuration
        with open("monitoring/performance-monitoring.json", "w") as f:
            json.dump(monitoring_config, f, indent=2)
        
        logger.info("✅ Monitoring configuration saved: monitoring/performance-monitoring.json")
    
    def generate_performance_report(self):
        """Generate comprehensive performance report"""
        logger.info("📋 Generating performance report...")
        
        report = f"""# 🚀 Adaptive Learning Ecosystem - Performance Analysis Report

**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S')}
**Analysis Duration:** Comprehensive system scan

## 📊 Executive Summary

"""
        
        # Overall system health
        total_services = len(self.metrics)
        healthy_services = sum(1 for m in self.metrics.values() if m.health_status == "healthy")
        avg_response_time = statistics.mean([m.response_time_ms for m in self.metrics.values()]) if self.metrics else 0
        avg_availability = statistics.mean([m.availability for m in self.metrics.values()]) if self.metrics else 0
        
        report += f"""- **System Health:** {healthy_services}/{total_services} services healthy
- **Average Response Time:** {avg_response_time:.2f}ms
- **Average Availability:** {avg_availability:.1f}%
- **Total Recommendations:** {len(self.recommendations)}
- **High Priority Issues:** {len([r for r in self.recommendations if r.priority == 'high'])}

## 🔍 Service Performance Metrics

| Service | Response Time | CPU % | Memory MB | Throughput | Availability | Status |
|---------|---------------|-------|-----------|------------|--------------|--------|
"""
        
        for service, metrics in self.metrics.items():
            status_emoji = "✅" if metrics.health_status == "healthy" else "⚠️"
            report += f"| {metrics.name} | {metrics.response_time_ms:.2f}ms | {metrics.cpu_percent:.1f}% | {metrics.memory_mb:.1f}MB | {metrics.requests_per_second:.1f} req/s | {metrics.availability:.1f}% | {status_emoji} |\n"
        
        report += "\n## 🛠️ Optimization Recommendations\n\n"
        
        # Group recommendations by priority
        high_priority = [r for r in self.recommendations if r.priority == "high"]
        medium_priority = [r for r in self.recommendations if r.priority == "medium"]
        low_priority = [r for r in self.recommendations if r.priority == "low"]
        
        if high_priority:
            report += "### 🚨 High Priority Issues\n\n"
            for i, rec in enumerate(high_priority, 1):
                report += f"**{i}. {rec.service} - {rec.category}**\n"
                report += f"- **Issue:** {rec.issue}\n"
                report += f"- **Recommendation:** {rec.recommendation}\n"
                report += f"- **Expected Improvement:** {rec.estimated_improvement}\n\n"
        
        if medium_priority:
            report += "### ⚠️ Medium Priority Issues\n\n"
            for i, rec in enumerate(medium_priority, 1):
                report += f"**{i}. {rec.service} - {rec.category}**\n"
                report += f"- **Issue:** {rec.issue}\n"
                report += f"- **Recommendation:** {rec.recommendation}\n"
                report += f"- **Expected Improvement:** {rec.estimated_improvement}\n\n"
        
        if low_priority:
            report += "### ℹ️ Low Priority Issues\n\n"
            for i, rec in enumerate(low_priority, 1):
                report += f"**{i}. {rec.service} - {rec.category}**\n"
                report += f"- **Issue:** {rec.issue}\n"
                report += f"- **Recommendation:** {rec.recommendation}\n"
                report += f"- **Expected Improvement:** {rec.estimated_improvement}\n\n"
        
        report += """## 🎯 Next Steps

1. **Immediate Actions:** Address high priority issues first
2. **Apply Optimizations:** Run `./scripts/apply-optimizations.sh`
3. **Monitor Impact:** Use generated monitoring configuration
4. **Continuous Improvement:** Re-run analysis after optimizations

## 📊 Performance Targets

- **Response Time:** < 200ms for all endpoints
- **CPU Usage:** < 50% under normal load
- **Memory Usage:** < 500MB per service
- **Availability:** > 99.5%
- **Error Rate:** < 1%
- **Throughput:** > 100 requests/second per service

---

*Generated by Adaptive Learning Ecosystem Performance Optimizer*
*EbroValley Digital - Educational Excellence Platform*
"""
        
        # Save report
        with open("docs/PERFORMANCE-ANALYSIS-REPORT.md", "w") as f:
            f.write(report)
        
        logger.info("✅ Performance report saved: docs/PERFORMANCE-ANALYSIS-REPORT.md")
    
    async def run_comprehensive_analysis(self):
        """Run comprehensive performance analysis"""
        logger.info("🚀 Starting comprehensive performance analysis...")
        
        # Ensure services are running
        logger.info("⚡ Checking service availability...")
        
        # Collect metrics for all services
        tasks = []
        for service, port in self.services.items():
            tasks.append(self.collect_service_metrics(service, port))
        
        try:
            await asyncio.gather(*tasks, return_exceptions=True)
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
        
        # Analyze performance issues
        self.analyze_performance_issues()
        
        # Generate outputs
        self.generate_optimization_scripts()
        self.generate_monitoring_config()
        self.generate_performance_report()
        
        logger.info("✅ Performance analysis completed!")
        
        # Print summary
        print("\n" + "="*60)
        print("🚀 PERFORMANCE ANALYSIS SUMMARY")
        print("="*60)
        print(f"📊 Services Analyzed: {len(self.metrics)}")
        print(f"🛠️ Recommendations Generated: {len(self.recommendations)}")
        print(f"🚨 High Priority Issues: {len([r for r in self.recommendations if r.priority == 'high'])}")
        print(f"⚠️ Medium Priority Issues: {len([r for r in self.recommendations if r.priority == 'medium'])}")
        print(f"ℹ️ Low Priority Issues: {len([r for r in self.recommendations if r.priority == 'low'])}")
        print("\n📋 Reports Generated:")
        print("- docs/PERFORMANCE-ANALYSIS-REPORT.md")
        print("- scripts/apply-optimizations.sh")
        print("- monitoring/performance-monitoring.json")
        print("\n🎯 Next: Run ./scripts/apply-optimizations.sh to implement improvements")
        print("="*60)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Adaptive Learning Ecosystem Performance Optimizer")
    parser.add_argument("--quick", action="store_true", help="Run quick performance check")
    parser.add_argument("--comprehensive", action="store_true", help="Run comprehensive analysis (default)")
    parser.add_argument("--service", type=str, help="Analyze specific service only")
    
    args = parser.parse_args()
    
    optimizer = PerformanceOptimizer()
    
    if args.service:
        if args.service not in optimizer.services:
            print(f"❌ Unknown service: {args.service}")
            print(f"Available services: {', '.join(optimizer.services.keys())}")
            sys.exit(1)
        
        # Analyze single service
        optimizer.services = {args.service: optimizer.services[args.service]}
    
    try:
        asyncio.run(optimizer.run_comprehensive_analysis())
    except KeyboardInterrupt:
        print("\n⚠️ Analysis interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()