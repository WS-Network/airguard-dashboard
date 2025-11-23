#!/bin/bash

# Airguard Backend API Test Script
# Usage: ./test-curl.sh [base_url]
# Default base URL: http://localhost:3001

BASE_URL=${1:-"http://localhost:3001"}
AUTH_TOKEN=""

echo "🧪 Testing Airguard Backend APIs"
echo "📍 Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
        echo -e "${GREEN}✅ $message (Status: $status)${NC}"
    elif [ "$status" -ge 400 ] && [ "$status" -lt 500 ]; then
        echo -e "${YELLOW}⚠️  $message (Status: $status)${NC}"
    elif [ "$status" -ge 500 ]; then
        echo -e "${RED}❌ $message (Status: $status)${NC}"
    else
        echo -e "${BLUE}ℹ️  $message (Status: $status)${NC}"
    fi
}

# 1. Health Check
echo "1. Testing Health Check..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$BASE_URL/health")
print_status "$HEALTH_RESPONSE" "Health Check"
if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo "   Response: $(cat /tmp/health_response.json)"
fi
echo ""

# 2. User Login
echo "2. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/login_response.json \
    -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "demo@airguard.com",
        "password": "demo123"
    }')

print_status "$LOGIN_RESPONSE" "User Login"

if [ "$LOGIN_RESPONSE" -eq 200 ]; then
    # Extract token from response
    AUTH_TOKEN=$(cat /tmp/login_response.json | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$AUTH_TOKEN" ]; then
        echo "   ✅ Auth token obtained successfully"
        echo "   Token: ${AUTH_TOKEN:0:20}..."
    else
        echo "   ❌ Failed to extract auth token"
    fi
else
    echo "   Response: $(cat /tmp/login_response.json)"
fi
echo ""

# 3. Get Dashboard Metrics (requires auth)
if [ -n "$AUTH_TOKEN" ]; then
    echo "3. Testing Dashboard Metrics..."
    METRICS_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/metrics_response.json \
        -X GET "$BASE_URL/api/dashboard/metrics" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    print_status "$METRICS_RESPONSE" "Dashboard Metrics"
    if [ "$METRICS_RESPONSE" -eq 200 ]; then
        echo "   ✅ Metrics retrieved successfully"
    else
        echo "   Response: $(cat /tmp/metrics_response.json)"
    fi
else
    echo "3. Skipping Dashboard Metrics (no auth token)"
fi
echo ""

# 4. Get All Devices (requires auth)
if [ -n "$AUTH_TOKEN" ]; then
    echo "4. Testing Get All Devices..."
    DEVICES_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/devices_response.json \
        -X GET "$BASE_URL/api/devices" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    print_status "$DEVICES_RESPONSE" "Get All Devices"
    if [ "$DEVICES_RESPONSE" -eq 200 ]; then
        DEVICE_COUNT=$(cat /tmp/devices_response.json | grep -o '"id"' | wc -l)
        echo "   ✅ Found $DEVICE_COUNT devices"
    else
        echo "   Response: $(cat /tmp/devices_response.json)"
    fi
else
    echo "4. Skipping Get All Devices (no auth token)"
fi
echo ""

# 5. Create New Device (requires auth)
if [ -n "$AUTH_TOKEN" ]; then
    echo "5. Testing Create Device..."
    CREATE_DEVICE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/create_device_response.json \
        -X POST "$BASE_URL/api/devices" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "name": "Test Device #001",
            "deviceType": "Environmental Monitor",
            "firmwareVersion": "v1.0.0",
            "latitude": 33.8938,
            "longitude": 35.5018,
            "locationDescription": "Test Location"
        }')
    
    print_status "$CREATE_DEVICE_RESPONSE" "Create Device"
    if [ "$CREATE_DEVICE_RESPONSE" -eq 201 ]; then
        echo "   ✅ Device created successfully"
    else
        echo "   Response: $(cat /tmp/create_device_response.json)"
    fi
else
    echo "5. Skipping Create Device (no auth token)"
fi
echo ""

# 6. Start Simulation (requires auth)
if [ -n "$AUTH_TOKEN" ]; then
    echo "6. Testing Start Simulation..."
    SIM_START_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/sim_start_response.json \
        -X POST "$BASE_URL/api/simulation/start" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"intervalMs": 30000}')
    
    print_status "$SIM_START_RESPONSE" "Start Simulation"
    if [ "$SIM_START_RESPONSE" -eq 200 ]; then
        echo "   ✅ Simulation started successfully"
    else
        echo "   Response: $(cat /tmp/sim_start_response.json)"
    fi
else
    echo "6. Skipping Start Simulation (no auth token)"
fi
echo ""

# 7. Stop Simulation
echo "7. Testing Stop Simulation..."
SIM_STOP_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/sim_stop_response.json \
    -X POST "$BASE_URL/api/simulation/stop")

print_status "$SIM_STOP_RESPONSE" "Stop Simulation"
if [ "$SIM_STOP_RESPONSE" -eq 200 ]; then
    echo "   ✅ Simulation stopped successfully"
else
    echo "   Response: $(cat /tmp/sim_stop_response.json)"
fi
echo ""

# Cleanup
rm -f /tmp/*_response.json

echo "🎉 API testing completed!"
echo ""
echo "📝 Summary:"
echo "   - Health Check: $HEALTH_RESPONSE"
echo "   - Login: $LOGIN_RESPONSE"
if [ -n "$AUTH_TOKEN" ]; then
    echo "   - Dashboard Metrics: $METRICS_RESPONSE"
    echo "   - Get Devices: $DEVICES_RESPONSE"
    echo "   - Create Device: $CREATE_DEVICE_RESPONSE"
    echo "   - Start Simulation: $SIM_START_RESPONSE"
fi
echo "   - Stop Simulation: $SIM_STOP_RESPONSE" 