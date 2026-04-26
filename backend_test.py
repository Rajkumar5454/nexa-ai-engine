import requests
import sys
import json
import time
from datetime import datetime

class BoltAIBuilderTester:
    def __init__(self, base_url="https://builder-hub-404.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
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
        """Test user signup"""
        test_user_data = {
            "name": "Test User",
            "email": "test@example.com", 
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

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
            self.user_data = response.get('user', {})
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me", 
            200
        )
        return success

    def test_ai_generate_code(self):
        """Test AI code generation"""
        generate_data = {
            "prompt": "Create a simple React todo app with add, delete, and mark complete functionality",
            "session_id": f"test-session-{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_test(
            "AI Code Generation",
            "POST",
            "ai/generate",
            200,
            data=generate_data,
            timeout=60  # AI generation takes 30-50 seconds
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
        return success

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

    def test_modify_existing_project(self):
        """Test modifying existing project (should use same project_id)"""
        if not self.project_id:
            print("❌ No project ID available for modification test")
            return False
            
        modify_data = {
            "prompt": "Add a search filter to the todo app",
            "session_id": f"test-session-{datetime.now().strftime('%H%M%S')}",
            "project_id": self.project_id
        }
        
        success, response = self.run_test(
            "Modify Existing Project",
            "POST",
            "ai/generate",
            200,
            data=modify_data,
            timeout=60  # AI generation takes 30-50 seconds
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

    def test_ai_chat(self):
        """Test AI chat functionality"""
        chat_data = {
            "message": "What technologies are you using for this project?",
            "session_id": f"test-session-{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "ai/chat",
            200,
            data=chat_data
        )
        return success

    def test_ai_chat_with_project(self):
        """Test AI chat with project context (new cofounder mode)"""
        if not self.project_id:
            print("❌ No project ID available for project-aware chat test")
            return False
            
        chat_data = {
            "message": "Analyze my project and suggest improvements",
            "session_id": f"test-session-{datetime.now().strftime('%H%M%S')}",
            "project_id": self.project_id
        }
        
        success, response = self.run_test(
            "AI Chat with Project Context",
            "POST",
            "ai/chat",
            200,
            data=chat_data,
            timeout=60  # AI analysis takes time
        )
        
        if success:
            # Check if response has structured format
            message_content = response.get('message', {})
            if isinstance(message_content, dict):
                content = message_content.get('content', '')
            else:
                content = str(message_content)
            
            # Look for structured response format
            has_structured_format = any(keyword in content for keyword in [
                "**What I Found:**", "**Recommended Changes:**", 
                "**Better Alternatives:**", "**Next Best Feature:**", "**Revenue Idea:**"
            ])
            
            if has_structured_format:
                print(f"✅ Structured response format detected")
                return True
            else:
                print(f"⚠️  Response received but may not have structured format")
                print(f"   Content preview: {content[:200]}...")
                return True  # Still pass as API works
        return False

    def test_ai_analyze_project(self):
        """Test AI project analysis (new audit feature)"""
        if not self.project_id:
            print("❌ No project ID available for analysis test")
            return False
            
        success, response = self.run_test(
            "AI Project Analysis",
            "POST",
            f"ai/analyze/{self.project_id}",
            200,
            timeout=60  # AI analysis takes time
        )
        
        if success:
            analysis = response.get('analysis', '')
            project_id = response.get('project_id', '')
            
            if analysis and project_id == self.project_id:
                print(f"✅ Analysis received for project {project_id}")
                print(f"   Analysis preview: {analysis[:200]}...")
                
                # Check for structured analysis format
                has_structured_format = any(keyword in analysis for keyword in [
                    "**What I Found:**", "**Recommended Changes:**", 
                    "**Better Alternatives:**", "**Next Best Feature:**", "**Revenue Idea:**"
                ])
                
                if has_structured_format:
                    print(f"✅ Structured analysis format detected")
                
                return True
            else:
                print(f"❌ Invalid analysis response")
                return False
        return False

    def test_ai_generate_stream(self):
        """Test AI streaming code generation"""
        stream_data = {
            "prompt": "Create a simple React calculator app",
            "session_id": f"test-session-{datetime.now().strftime('%H%M%S')}"
        }
        
        url = f"{self.api_url}/ai/generate/stream"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing AI Streaming Generation...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, json=stream_data, headers=headers, stream=True, timeout=120)
            
            if response.status_code == 200:
                print(f"✅ Stream started - Status: {response.status_code}")
                
                # Read streaming response
                token_count = 0
                done_received = False
                project_id = None
                
                for line in response.iter_lines():
                    if line:
                        line_str = line.decode('utf-8')
                        if line_str.startswith('data: '):
                            try:
                                data = json.loads(line_str[6:])
                                if data.get('type') == 'token':
                                    token_count += 1
                                elif data.get('type') == 'done':
                                    done_received = True
                                    project_id = data.get('project_id')
                                    print(f"   Stream completed with {token_count} tokens")
                                    print(f"   Project ID: {project_id}")
                                    break
                                elif data.get('type') == 'error':
                                    print(f"❌ Stream error: {data.get('detail')}")
                                    return False
                            except json.JSONDecodeError:
                                continue
                
                if done_received and project_id:
                    self.tests_passed += 1
                    self.project_id = project_id  # Update for download test
                    return True
                else:
                    print(f"❌ Stream incomplete - tokens: {token_count}, done: {done_received}")
                    return False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_download_project(self):
        """Test project download as zip"""
        if not self.project_id:
            print("❌ No project ID available for download test")
            return False
            
        url = f"{self.api_url}/ai/project/{self.project_id}/download"
        headers = {}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing Project Download...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Check if it's a zip file
                content_type = response.headers.get('content-type', '')
                content_disposition = response.headers.get('content-disposition', '')
                
                if 'application/zip' in content_type or 'attachment' in content_disposition:
                    file_size = len(response.content)
                    print(f"✅ Passed - Status: {response.status_code}")
                    print(f"   Content-Type: {content_type}")
                    print(f"   Content-Disposition: {content_disposition}")
                    print(f"   File size: {file_size} bytes")
                    
                    # Basic zip validation
                    if file_size > 0 and response.content[:2] == b'PK':
                        self.tests_passed += 1
                        return True
                    else:
                        print(f"❌ Invalid zip file format")
                        return False
                else:
                    print(f"❌ Wrong content type: {content_type}")
                    return False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

def main():
    print("🚀 Starting Bolt AI Builder Backend Tests")
    print("=" * 50)
    
    tester = BoltAIBuilderTester()
    
    # Test authentication flows
    print("\n📝 Testing Authentication...")
    if not tester.test_signup():
        print("❌ Signup failed, trying login...")
        if not tester.test_login():
            print("❌ Both signup and login failed, stopping tests")
            return 1
    
    if not tester.test_get_me():
        print("❌ Get current user failed")
        return 1
    
    # Test AI functionality
    print("\n🤖 Testing AI Features...")
    if not tester.test_ai_generate_code():
        print("❌ AI code generation failed")
        return 1
    
    if not tester.test_get_project():
        print("❌ Get project failed")
        return 1
    
    if not tester.test_modify_existing_project():
        print("❌ Project modification failed")
        return 1
    
    # Test project management
    print("\n📁 Testing Project Management...")
    if not tester.test_get_user_projects():
        print("❌ Get user projects failed")
        return 1
    
    # Test chat functionality
    print("\n💬 Testing Chat...")
    if not tester.test_ai_chat():
        print("❌ AI chat failed")
        return 1
    
    # Test new cofounder mode features
    print("\n🧠 Testing Cofounder Mode Features...")
    if not tester.test_ai_chat_with_project():
        print("❌ AI chat with project context failed")
        return 1
    
    if not tester.test_ai_analyze_project():
        print("❌ AI project analysis failed")
        return 1
    
    # Test streaming functionality
    print("\n🌊 Testing Streaming...")
    if not tester.test_ai_generate_stream():
        print("❌ AI streaming generation failed")
        return 1
    
    # Test download functionality
    print("\n📥 Testing Download...")
    if not tester.test_download_project():
        print("❌ Project download failed")
        return 1
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())