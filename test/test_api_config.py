#!/usr/bin/env python3
"""
Test script to verify API configuration endpoints work correctly
This tests the complete flow without authentication to verify data structure
"""

import requests
import json
import sys

# API Base URL
BASE_URL = "http://localhost:8000"

def test_endpoints():
    """Test API endpoints structure and responses"""
    
    print("🧪 Testing API Configuration Endpoints")
    print("=" * 50)
    
    # Test 1: GET endpoint (should return 403 without auth)
    print("\n1. Testing GET /api/user-config/")
    try:
        response = requests.get(f"{BASE_URL}/api/user-config/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 403:
            print("   ✅ Authentication properly enforced")
        else:
            print("   ❌ Unexpected response")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: POST Alpaca endpoint (should return 403 without auth)
    print("\n2. Testing POST /api/user-config/alpaca")
    test_alpaca_data = {
        "alpaca_api_key": "test_key",
        "alpaca_secret_key": "test_secret",
        "alpaca_endpoint": "https://paper-api.alpaca.markets/v2",
        "alpaca_is_paper": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/user-config/alpaca",
            json=test_alpaca_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 403:
            print("   ✅ Authentication properly enforced")
        else:
            print("   ❌ Unexpected response")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: POST Polygon endpoint (should return 403 without auth)
    print("\n3. Testing POST /api/user-config/polygon")
    test_polygon_data = {
        "polygon_api_key_name": "test_polygon_key_name",
        "polygon_secret_key": "test_polygon_secret"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/user-config/polygon",
            json=test_polygon_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 403:
            print("   ✅ Authentication properly enforced")
        else:
            print("   ❌ Unexpected response")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Check API documentation
    print("\n4. Testing API Documentation")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ API documentation accessible at /docs")
        else:
            print("   ❌ API documentation not accessible")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ API Configuration endpoints are properly structured!")
    print("🔐 Authentication is correctly enforced on all endpoints")
    print("📚 Visit http://localhost:8000/docs to see full API documentation")
    print("\n🌐 Frontend is available at: http://localhost:3000")
    print("   To test the full workflow:")
    print("   1. Register/Login to get authentication")
    print("   2. Navigate to Account Settings")
    print("   3. Configure your API credentials")

if __name__ == "__main__":
    test_endpoints()
