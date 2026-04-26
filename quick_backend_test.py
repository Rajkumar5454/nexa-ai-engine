import requests
import sys
import json

class QuickBoltTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test user login"""
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_user_projects(self):
        """Test get user's projects"""
        success, response = self.run_test(
            "Get User Projects",
            "GET",
            "projects",
            200
        )
        
        if success:
            projects = response if isinstance(response, list) else []
            print(f"   Found {len(projects)} projects")
            return True
        return False

    def test_ai_chat(self):
        """Test AI chat functionality"""
        chat_data = {
            "message": "Hello, what can you help me with?",
            "session_id": "test-session-quick"
        }
        
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "ai/chat",
            200,
            data=chat_data
        )
        return success

def main():
    print("🚀 Quick Backend API Tests")
    print("=" * 30)
    
    tester = QuickBoltTester()
    
    # Login first
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
    
    # Test remaining endpoints
    tester.test_get_user_projects()
    tester.test_ai_chat()
    
    print(f"\n📊 Quick tests: {tester.tests_passed}/{tester.tests_run}")
    return 0

if __name__ == "__main__":
    sys.exit(main())