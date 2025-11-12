# LSTA Academy Stress Test Suite

Comprehensive load testing for the LSTA Academy application deployed on VPS 57.129.110.129.

## Overview

This stress test suite uses **Locust** distributed across multiple Docker containers to simulate real user behavior and test application performance under load.

### What it Tests

- ✅ **SuperAdmin Operations**: School management, activity creation, system statistics
- ✅ **Admin Operations**: Class management, student/teacher management, dashboard access
- ✅ **Teacher Operations**: Class viewing, student progress tracking, resource access
- ✅ **Student Operations**: Activity viewing, submissions, progress tracking

### Test Scenarios

1. **10 Concurrent Users** (5 minutes)
2. **50 Concurrent Users** (5 minutes)
3. **100 Concurrent Users** (5 minutes)

## Prerequisites

- Docker and Docker Compose installed
- Python 3.11+ (for running the test script)
- Network access to VPS 57.129.110.129
- Test accounts configured in the application

## Quick Start

### Option 1: Automated Testing (Recommended)

Run all tests automatically and generate a comprehensive report:

```powershell
cd stress-test
python run_tests.py
```

This will:
1. Start Docker containers with Locust master and 4 workers
2. Run tests with 10, 50, and 100 concurrent users
3. Generate a detailed performance report
4. Clean up containers when done

### Option 2: Manual Testing with Web UI

1. Start the Locust cluster:
```powershell
cd stress-test
docker-compose up -d --build
```

2. Open Locust Web UI:
```
http://localhost:8089
```

3. Configure test parameters:
   - **Number of users**: Start with 10, then 50, then 100
   - **Spawn rate**: 2-10 users per second
   - **Host**: http://57.129.110.129

4. Monitor results in real-time through the web interface

5. Stop containers when done:
```powershell
docker-compose down
```

## Test Configuration

### User Distribution

The test simulates realistic user distribution:
- **10%** SuperAdmins (weight: 1)
- **20%** School Admins (weight: 2)
- **30%** Teachers (weight: 3)
- **40%** Students (weight: 4)

### Test Accounts

- **SuperAdmin**: admin@admin.com / admin123
- **Admin**: abdenour@kabib.com / 123AZEqsdwxc

### Architecture

```
┌─────────────────┐
│  Locust Master  │ ← Web UI (localhost:8089)
│   (Coordinator) │
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┐
    │         │        │        │
┌───▼───┐ ┌───▼───┐ ┌──▼────┐ ┌──▼────┐
│Worker1│ │Worker2│ │Worker3│ │Worker4│
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    │         │        │        │
    └─────────┴────────┴────────┘
              │
        ┌─────▼─────┐
        │  VPS API  │
        │57.129.110 │
        │   .129    │
        └───────────┘
```

## Output

### Real-time Metrics
- Total requests
- Failed requests
- Success rate
- Average response time
- Requests per second (RPS)
- Response time distribution

### Performance Report

After tests complete, a detailed markdown report is generated:
- `STRESS_TEST_REPORT_YYYYMMDD_HHMMSS.md`

The report includes:
- Executive summary for each load level
- Performance ratings (Excellent/Good/Acceptable/Needs Improvement)
- Detailed endpoint analysis
- Response time statistics
- Failure analysis
- Recommendations for optimization

## Interpreting Results

### Success Rate
- ✅ **99%+**: Excellent
- ✔️ **95-99%**: Good
- ⚠️ **90-95%**: Acceptable
- ❌ **<90%**: Needs improvement

### Response Time
- ✅ **<500ms**: Excellent
- ✔️ **500-1000ms**: Good
- ⚠️ **1000-2000ms**: Acceptable
- ❌ **>2000ms**: Needs improvement

### Throughput (RPS)
- ✅ **>50 RPS**: Excellent
- ✔️ **20-50 RPS**: Good
- ⚠️ **10-20 RPS**: Acceptable
- ❌ **<10 RPS**: Needs improvement

## Troubleshooting

### Containers won't start
```powershell
# Check Docker is running
docker ps

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

### Connection errors to VPS
```powershell
# Test VPS connectivity
curl http://57.129.110.129/api/health

# Check if VPS firewall allows your IP
```

### High failure rates
- Check VPS server logs
- Verify database connection pool settings
- Monitor VPS resource usage (CPU, RAM, disk I/O)

### Workers not connecting
```powershell
# Check worker logs
docker logs lsta-stress-worker-1

# Restart workers
docker-compose restart
```

## Customization

### Modify User Scenarios

Edit `locustfile.py` to add/modify user behaviors:

```python
@task(5)  # Weight of 5
def new_behavior(self):
    """Custom user action"""
    self.client.get("/api/custom-endpoint")
```

### Change Test Duration

Edit `run_tests.py`:

```python
scenarios = [
    {"users": 10, "spawn_rate": 2, "duration": 600},   # 10 minutes
    {"users": 50, "spawn_rate": 5, "duration": 600},
    {"users": 100, "spawn_rate": 10, "duration": 600}
]
```

### Add More Workers

Edit `docker-compose.yml` to add more worker containers for higher loads.

## Performance Optimization Tips

Based on test results, consider:

1. **Database**
   - Add indexes on frequently queried columns
   - Implement connection pooling
   - Use read replicas

2. **Caching**
   - Redis for session management
   - Cache frequently accessed data
   - HTTP caching headers

3. **Application**
   - Enable Spring Boot actuator
   - Optimize JVM settings
   - Async processing for heavy operations

4. **Infrastructure**
   - Load balancing
   - Auto-scaling
   - CDN for static assets

5. **Monitoring**
   - APM (Application Performance Monitoring)
   - Alerts for high response times
   - Request tracing

## Files

- `locustfile.py` - Main test scenarios and user behaviors
- `run_tests.py` - Automated test runner and report generator
- `docker-compose.yml` - Distributed Locust cluster configuration
- `Dockerfile` - Locust container image
- `README.md` - This file

## Support

For issues or questions:
1. Check container logs: `docker-compose logs`
2. Review VPS server logs
3. Check the generated performance report for specific endpoint issues

---

**Happy Testing! 🚀**
