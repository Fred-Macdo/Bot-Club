#!/usr/bin/env python3
"""
Simple test script to verify the backend services integration
"""

import asyncio
import httpx
import json
from datetime import datetime, timedelta

async def test_backend_services_integration():
    """Test the integration between backend and backend_services"""
    
    # Test backend_services health
    print("1. Testing backend_services health...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8001/health")
            if response.status_code == 200:
                print("✅ Backend services is healthy")
                print(f"   Response: {response.json()}")
            else:
                print(f"❌ Backend services health check failed: {response.status_code}")
                return
    except Exception as e:
        print(f"❌ Failed to connect to backend services: {e}")
        return
    
    # Test backtest endpoint
    print("\n2. Testing backtest endpoint...")
    try:
        test_payload = {
            "strategy_id": "507f1f77bcf86cd799439011",  # Example ObjectId
            "user_id": "507f1f77bcf86cd799439012",      # Example ObjectId
            "initial_capital": 100000.0,
            "start_date": (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
            "end_date": datetime.now().strftime('%Y-%m-%d'),
            "timeframe": "1d"
        }
        
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
            response = await client.post(
                "http://localhost:8001/backtest/run",
                json=test_payload
            )
            
            if response.status_code == 200:
                result = response.json()
                execution_id = result.get("backtest_id")
                print(f"✅ Backtest started successfully")
                print(f"   Execution ID: {execution_id}")
                
                # Monitor the backtest status
                print("\n3. Monitoring backtest status...")
                for i in range(10):  # Check status up to 10 times
                    await asyncio.sleep(2)
                    status_response = await client.get(
                        f"http://localhost:8001/backtest/{execution_id}/status"
                    )
                    
                    if status_response.status_code == 200:
                        status = status_response.json()
                        print(f"   Status: {status.get('status')} - Progress: {status.get('progress', 0)}%")
                        
                        if status.get('status') in ['completed', 'failed', 'cancelled']:
                            print(f"   Final status: {status.get('status')}")
                            if status.get('result'):
                                print(f"   Result summary: {status['result']}")
                            break
                    else:
                        print(f"   Failed to get status: {status_response.status_code}")
                        
            else:
                print(f"❌ Failed to start backtest: {response.status_code}")
                print(f"   Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing backtest endpoint: {e}")

if __name__ == "__main__":
    print("Testing Backend Services Integration")
    print("=" * 50)
    
    asyncio.run(test_backend_services_integration())
    
    print("\n" + "=" * 50)
    print("Test completed!")
