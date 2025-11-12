#!/usr/bin/env python3
"""
Automated Stress Test Runner
Runs tests with 10, 50, and 100 users automatically
Generates comprehensive performance report
"""

import os
import sys
import time
import json
import requests
import subprocess
from datetime import datetime
from typing import Dict, List

class StressTestRunner:
    def __init__(self):
        self.vps_host = "http://57.129.110.129"
        self.locust_host = "http://localhost:8089"
        self.results = []
        self.report_data = {
            "test_date": datetime.now().isoformat(),
            "vps_host": self.vps_host,
            "test_scenarios": []
        }
    
    def check_docker_compose(self):
        """Check if docker-compose is running"""
        try:
            result = subprocess.run(
                ["docker", "ps", "--filter", "name=lsta-stress"],
                capture_output=True,
                text=True
            )
            return "lsta-stress-master" in result.stdout
        except Exception as e:
            print(f"❌ Error checking docker-compose: {e}")
            return False
    
    def start_docker_compose(self):
        """Start docker-compose services"""
        print("\n🚀 Starting Docker Compose services...")
        try:
            subprocess.run(
                ["docker-compose", "up", "-d", "--build"],
                check=True,
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
            print("✅ Docker services started")
            print("⏳ Waiting for services to be ready...")
            time.sleep(30)  # Wait for services to initialize
            return True
        except Exception as e:
            print(f"❌ Error starting docker-compose: {e}")
            return False
    
    def wait_for_locust(self):
        """Wait for Locust to be ready"""
        max_attempts = 30
        for i in range(max_attempts):
            try:
                response = requests.get(self.locust_host)
                if response.status_code == 200:
                    print("✅ Locust is ready")
                    return True
            except:
                pass
            
            if i < max_attempts - 1:
                print(f"⏳ Waiting for Locust... ({i+1}/{max_attempts})")
                time.sleep(2)
        
        print("❌ Locust did not start in time")
        return False
    
    def run_test(self, num_users: int, spawn_rate: int, duration: int):
        """Run a single stress test scenario"""
        print("\n" + "="*80)
        print(f"🧪 RUNNING TEST: {num_users} Users | Spawn Rate: {spawn_rate}/s | Duration: {duration}s")
        print("="*80)
        
        # Start the test
        try:
            response = requests.post(
                f"{self.locust_host}/swarm",
                data={
                    "user_count": num_users,
                    "spawn_rate": spawn_rate,
                    "host": self.vps_host
                }
            )
            
            if response.status_code != 200:
                print(f"❌ Failed to start test: {response.status_code}")
                return None
            
            print(f"✅ Test started with {num_users} users")
            
            # Monitor progress
            start_time = time.time()
            while time.time() - start_time < duration:
                remaining = duration - int(time.time() - start_time)
                stats = self.get_stats()
                
                if stats:
                    print(f"⏱️  Time remaining: {remaining}s | "
                          f"Requests: {stats.get('total_requests', 0)} | "
                          f"Failures: {stats.get('total_failures', 0)} | "
                          f"RPS: {stats.get('total_rps', 0):.2f}")
                
                time.sleep(10)
            
            # Get final stats
            final_stats = self.get_stats()
            
            # Stop the test
            requests.get(f"{self.locust_host}/stop")
            time.sleep(5)
            
            return final_stats
            
        except Exception as e:
            print(f"❌ Error running test: {e}")
            return None
    
    def get_stats(self):
        """Get current test statistics from Locust"""
        try:
            response = requests.get(f"{self.locust_host}/stats/requests")
            if response.status_code == 200:
                data = response.json()
                
                total_requests = 0
                total_failures = 0
                total_rps = 0
                response_times = []
                
                for stat in data.get("stats", []):
                    if stat["name"] != "Aggregated":
                        total_requests += stat.get("num_requests", 0)
                        total_failures += stat.get("num_failures", 0)
                        total_rps += stat.get("current_rps", 0)
                        
                        if stat.get("avg_response_time"):
                            response_times.append(stat["avg_response_time"])
                
                return {
                    "total_requests": total_requests,
                    "total_failures": total_failures,
                    "total_rps": total_rps,
                    "avg_response_time": sum(response_times) / len(response_times) if response_times else 0,
                    "stats": data.get("stats", [])
                }
        except Exception as e:
            print(f"⚠️  Error getting stats: {e}")
            return None
    
    def run_all_tests(self):
        """Run all test scenarios"""
        scenarios = [
            {"users": 10, "spawn_rate": 2, "duration": 300},   # 10 users, 5 minutes
            {"users": 50, "spawn_rate": 5, "duration": 300},   # 50 users, 5 minutes
            {"users": 100, "spawn_rate": 10, "duration": 300}  # 100 users, 5 minutes
        ]
        
        for scenario in scenarios:
            stats = self.run_test(
                scenario["users"],
                scenario["spawn_rate"],
                scenario["duration"]
            )
            
            if stats:
                scenario["results"] = stats
                self.report_data["test_scenarios"].append(scenario)
            
            # Wait between tests
            print("\n⏳ Waiting 30 seconds before next test...")
            time.sleep(30)
    
    def generate_report(self):
        """Generate comprehensive performance report"""
        print("\n" + "="*80)
        print("📊 GENERATING PERFORMANCE REPORT")
        print("="*80)
        
        report_lines = []
        report_lines.append("# LSTA Academy - Stress Test Performance Report")
        report_lines.append(f"\n**Test Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append(f"**VPS Host:** {self.vps_host}")
        report_lines.append(f"**Test Duration per Scenario:** 5 minutes")
        report_lines.append("\n---\n")
        
        report_lines.append("## Executive Summary\n")
        
        for scenario in self.report_data["test_scenarios"]:
            users = scenario["users"]
            results = scenario.get("results", {})
            
            report_lines.append(f"### Test with {users} Concurrent Users\n")
            report_lines.append(f"- **Total Requests:** {results.get('total_requests', 0):,}")
            report_lines.append(f"- **Failed Requests:** {results.get('total_failures', 0):,}")
            
            success_rate = 0
            if results.get('total_requests', 0) > 0:
                success_rate = ((results['total_requests'] - results.get('total_failures', 0)) 
                               / results['total_requests']) * 100
            
            report_lines.append(f"- **Success Rate:** {success_rate:.2f}%")
            report_lines.append(f"- **Average Response Time:** {results.get('avg_response_time', 0):.0f}ms")
            report_lines.append(f"- **Requests per Second:** {results.get('total_rps', 0):.2f}")
            
            # Performance rating
            if success_rate >= 99 and results.get('avg_response_time', 9999) < 500:
                rating = "✅ EXCELLENT"
            elif success_rate >= 95 and results.get('avg_response_time', 9999) < 1000:
                rating = "✔️ GOOD"
            elif success_rate >= 90:
                rating = "⚠️ ACCEPTABLE"
            else:
                rating = "❌ NEEDS IMPROVEMENT"
            
            report_lines.append(f"- **Performance Rating:** {rating}\n")
        
        report_lines.append("\n---\n")
        report_lines.append("## Detailed Endpoint Analysis\n")
        
        for scenario in self.report_data["test_scenarios"]:
            users = scenario["users"]
            results = scenario.get("results", {})
            
            report_lines.append(f"### {users} Users - Endpoint Performance\n")
            report_lines.append("| Endpoint | Requests | Failures | Avg Time (ms) | Min | Max |")
            report_lines.append("|----------|----------|----------|---------------|-----|-----|")
            
            for stat in results.get("stats", []):
                if stat["name"] != "Aggregated":
                    report_lines.append(
                        f"| {stat['name']} | "
                        f"{stat.get('num_requests', 0)} | "
                        f"{stat.get('num_failures', 0)} | "
                        f"{stat.get('avg_response_time', 0):.0f} | "
                        f"{stat.get('min_response_time', 0):.0f} | "
                        f"{stat.get('max_response_time', 0):.0f} |"
                    )
            
            report_lines.append("\n")
        
        report_lines.append("---\n")
        report_lines.append("## Recommendations\n")
        report_lines.append("### Based on Test Results:\n\n")
        
        # Analyze overall performance
        max_users_test = self.report_data["test_scenarios"][-1] if self.report_data["test_scenarios"] else None
        
        if max_users_test:
            results = max_users_test.get("results", {})
            success_rate = 0
            if results.get('total_requests', 0) > 0:
                success_rate = ((results['total_requests'] - results.get('total_failures', 0)) 
                               / results['total_requests']) * 100
            
            avg_time = results.get('avg_response_time', 0)
            
            if success_rate < 95:
                report_lines.append("- ⚠️ **High failure rate detected** - Consider scaling up server resources or optimizing database queries\n")
            
            if avg_time > 1000:
                report_lines.append("- ⚠️ **High response times** - Consider implementing caching, optimizing slow endpoints, or adding a CDN\n")
            
            if results.get('total_rps', 0) < 10:
                report_lines.append("- ⚠️ **Low throughput** - Server may be CPU or I/O bound. Consider horizontal scaling\n")
            
            if success_rate >= 99 and avg_time < 500:
                report_lines.append("- ✅ **Excellent performance** - System handles concurrent load well\n")
                report_lines.append("- ✅ Consider testing with even higher loads to find capacity limits\n")
        
        report_lines.append("\n### General Recommendations:\n\n")
        report_lines.append("1. **Database Optimization**\n")
        report_lines.append("   - Add indexes on frequently queried columns\n")
        report_lines.append("   - Implement database connection pooling\n")
        report_lines.append("   - Consider read replicas for read-heavy operations\n\n")
        
        report_lines.append("2. **Caching Strategy**\n")
        report_lines.append("   - Implement Redis for session management\n")
        report_lines.append("   - Cache frequently accessed data (schools, activities)\n")
        report_lines.append("   - Use HTTP caching headers for static resources\n\n")
        
        report_lines.append("3. **Application Optimization**\n")
        report_lines.append("   - Enable Spring Boot actuator for monitoring\n")
        report_lines.append("   - Optimize JVM heap settings\n")
        report_lines.append("   - Consider async processing for heavy operations\n\n")
        
        report_lines.append("4. **Infrastructure**\n")
        report_lines.append("   - Set up load balancing for horizontal scaling\n")
        report_lines.append("   - Implement auto-scaling policies\n")
        report_lines.append("   - Use CDN for static assets\n\n")
        
        report_lines.append("5. **Monitoring & Alerts**\n")
        report_lines.append("   - Set up APM (Application Performance Monitoring)\n")
        report_lines.append("   - Configure alerts for high response times and error rates\n")
        report_lines.append("   - Implement request tracing for bottleneck identification\n\n")
        
        report_lines.append("---\n")
        report_lines.append("## Test Configuration\n\n")
        report_lines.append("**Test Tool:** Locust (Distributed Mode)\n")
        report_lines.append("**Workers:** 4 Docker containers\n")
        report_lines.append("**User Types Simulated:**\n")
        report_lines.append("- SuperAdmin (10% of users)\n")
        report_lines.append("- School Admin (20% of users)\n")
        report_lines.append("- Teachers (30% of users)\n")
        report_lines.append("- Students (40% of users)\n\n")
        
        report_lines.append("**Test Accounts Used:**\n")
        report_lines.append("- SuperAdmin: admin@admin.com\n")
        report_lines.append("- Admin: abdenour@kabib.com\n\n")
        
        report_lines.append("---\n\n")
        report_lines.append(f"*Report generated on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}*\n")
        
        # Write report to file
        report_file = f"STRESS_TEST_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        report_path = os.path.join(os.path.dirname(__file__), report_file)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_lines))
        
        print(f"\n✅ Report generated: {report_file}")
        print("\n" + "="*80)
        print("FULL REPORT PREVIEW")
        print("="*80 + "\n")
        print('\n'.join(report_lines))
        
        return report_path
    
    def cleanup(self):
        """Stop and cleanup Docker containers"""
        print("\n🧹 Cleaning up Docker services...")
        try:
            subprocess.run(
                ["docker-compose", "down"],
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
            print("✅ Cleanup complete")
        except Exception as e:
            print(f"⚠️  Error during cleanup: {e}")


def main():
    runner = StressTestRunner()
    
    try:
        # Start services
        if not runner.check_docker_compose():
            if not runner.start_docker_compose():
                print("❌ Failed to start Docker services")
                return 1
        
        # Wait for Locust
        if not runner.wait_for_locust():
            print("❌ Locust is not available")
            return 1
        
        print("\n" + "="*80)
        print("🎯 LSTA ACADEMY STRESS TEST SUITE")
        print("="*80)
        print(f"Target: {runner.vps_host}")
        print("Tests: 10 users → 50 users → 100 users")
        print("Duration: 5 minutes per test")
        print("="*80 + "\n")
        
        input("Press Enter to start the tests...")
        
        # Run all tests
        runner.run_all_tests()
        
        # Generate report
        runner.generate_report()
        
        print("\n✅ All tests completed successfully!")
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        runner.cleanup()
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
