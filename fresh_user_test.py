import requests
import sys
import json
from datetime import datetime
import random

class FreshUserTester:
    def __init__(self, base_url="https://builder-hub-404.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.project_id = None
        # Generate random email to avoid conflicts
        self.test_email = f"testuser{random.randint(1000, 9999)}@example.com"

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=90):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
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

    def test_signup(self):
        """Test user signup with fresh email"""
        test_user_data = {
            "name": "Fresh Test User",
            "email": self.test_email,
            "password": "password123"
        }
        
        success, response = self.run_test(
            f"User Signup ({self.test_email})",
            "POST",
            "auth/signup",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            print(f"   Token obtained for: {self.test_email}")
            return True
        return False

    def test_ai_generate_code(self):
        """Test AI code generation"""
        generate_data = {
            "prompt": "Create a simple React calculator app with basic arithmetic operations",
            "session_id": f"test-session-{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_test(
            "AI Code Generation",
            "POST",
            "ai/generate",
            200,
            data=generate_data,
            timeout=90  # AI generation takes 30-60 seconds
        )
        
        if success and 'project_id' in response:
            self.project_id = response['project_id']
            print(f"   Project created: {self.project_id}")
            return True
        return False

    def test_get_project(self):
        """Test get project by ID"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Project",
            "GET",
            f"ai/project/{self.project_id}",
            200
        )
        
        if success:
            project_name = response.get('name', 'No name')
            files_count = len(response.get('files', []))
            messages_count = len(response.get('messages', []))
            print(f"   Project: {project_name}")
            print(f"   Files: {files_count}, Messages: {messages_count}")
        return success

    def test_modify_project(self):
        """Test modifying existing project"""
        if not self.project_id:
            print("❌ No project ID available for modification test")
            return False
            
        modify_data = {
            "prompt": "Add a memory feature to store previous calculations",
            "session_id": f"test-session-{datetime.now().strftime('%H%M%S')}",
            "project_id": self.project_id
        }
        
        success, response = self.run_test(
            "Modify Existing Project",
            "POST",
            "ai/generate",
            200,
            data=modify_data,
            timeout=90
        )
        
        if success:
            returned_project_id = response.get('project_id')
            if returned_project_id == self.project_id:
                print(f"✅ Project modification successful - same project ID maintained")
                return True
            else:
                print(f"❌ Project modification failed - got new project ID {returned_project_id} instead of {self.project_id}")
                return False
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
            if projects:
                for project in projects:
                    print(f"   - {project.get('name', 'Untitled')} (ID: {project.get('id', 'No ID')[:8]}...)")
            return True
        return False

def main():
    print("🚀 Starting Fresh User Backend Tests")
    print("=" * 50)
    
    tester = FreshUserTester()
    
    # Test authentication with fresh user
    print(f"\n📝 Testing Authentication with fresh user...")
    if not tester.test_signup():
        print("❌ Fresh user signup failed")
        return 1
    
    # Test AI functionality
    print("\n🤖 Testing AI Features...")
    if not tester.test_ai_generate_code():
        print("❌ AI code generation failed")
        return 1
    
    if not tester.test_get_project():
        print("❌ Get project failed")
        return 1
    
    if not tester.test_modify_project():
        print("❌ Project modification failed")
        return 1
    
    # Test project management
    print("\n📁 Testing Project Management...")
    if not tester.test_get_user_projects():
        print("❌ Get user projects failed")
        return 1
    
    print("\n" + "=" * 50)
    print("🎉 All fresh user tests passed!")
    print(f"📧 Test user email: {tester.test_email}")
    print(f"🆔 Test project ID: {tester.project_id}")
    return 0

if __name__ == "__main__":
    sys.exit(main())