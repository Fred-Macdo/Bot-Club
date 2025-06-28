#!/usr/bin/env python3
"""
Test script to verify the complete authentication flow
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_complete_auth_flow():
    print("🧪 Testing Complete Authentication Flow\n")
    
    # Generate unique credentials
    timestamp = int(datetime.now().timestamp())
    test_user_data = {
        "userName": f"testuser_{timestamp}",
        "email": f"test_{timestamp}@example.com",
        "password": "testpass123",
        "firstName": "Test",
        "lastName": "User"
    }
    
    print(f"📝 Test user: {test_user_data['email']}")
    
    # Step 1: Register user
    print("\n1️⃣ Testing Registration...")
    register_response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json=test_user_data,
        headers={"Content-Type": "application/json"}
    )
    
    if register_response.status_code == 200:
        print("✅ Registration successful")
        register_data = register_response.json()
        print(f"   Token received: {register_data['token'][:20]}...")
        print(f"   User ID: {register_data['user']['_id']}")
        registration_token = register_data['token']
    else:
        print(f"❌ Registration failed: {register_response.status_code}")
        print(f"   Error: {register_response.text}")
        return False
    
    # Step 2: Login with same credentials
    print("\n2️⃣ Testing Login...")
    login_data = {
        "username": test_user_data['email'],
        "password": test_user_data['password']
    }
    
    login_response = requests.post(
        f"{BASE_URL}/api/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if login_response.status_code == 200:
        print("✅ Login successful")
        login_data = login_response.json()
        print(f"   Token received: {login_data['access_token'][:20]}...")
        print(f"   Token type: {login_data['token_type']}")
        login_token = login_data['access_token']
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"   Error: {login_response.text}")
        return False
    
    # Step 3: Access protected endpoint
    print("\n3️⃣ Testing Protected Endpoint...")
    me_response = requests.get(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {login_token}"}
    )
    
    if me_response.status_code == 200:
        print("✅ Protected endpoint access successful")
        user_data = me_response.json()
        print(f"   User: {user_data['firstName']} {user_data['lastName']}")
        print(f"   Email: {user_data['email']}")
        print(f"   Username: {user_data['userName']}")
    else:
        print(f"❌ Protected endpoint failed: {me_response.status_code}")
        print(f"   Error: {me_response.text}")
        return False
    
    # Step 4: Test profile endpoint
    print("\n4️⃣ Testing Profile Management...")
    profile_response = requests.get(
        f"{BASE_URL}/api/users/me",
        headers={"Authorization": f"Bearer {login_token}"}
    )
    
    if profile_response.status_code == 200:
        print("✅ Profile endpoint access successful")
        profile_data = profile_response.json()
        print(f"   Profile data keys: {list(profile_data.keys())}")
    else:
        print(f"❌ Profile endpoint failed: {profile_response.status_code}")
        print(f"   Error: {profile_response.text}")
        return False
    
    print("\n🎉 All authentication tests passed!")
    return True

if __name__ == "__main__":
    test_complete_auth_flow()
