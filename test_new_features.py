import requests
import sys
import json
from datetime import datetime

class NewFeaturesTester:
    def __init__(self, base_url="https://builder-hub-404.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.project_id = "db03757c-a434-4483-ac82-01d8acfeaac5"  # Existing project from requirements
        self.tests_run = 0
        self.tests_passed = 0

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

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response preview: {str(response_data)[:300]}...")
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
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_ai_chat_with_project(self):
        """Test AI chat with project context (new cofounder mode)"""
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
            timeout=60
        )
        
        if success:
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
            else:
                print(f"⚠️  Response received but checking format...")
                print(f"   Content preview: {content[:500]}...")
            return True
        return False

    def test_ai_analyze_project(self):
        """Test AI project analysis (new audit feature)"""
        success, response = self.run_test(
            "AI Project Analysis",
            "POST",
            f"ai/analyze/{self.project_id}",
            200,
            timeout=60
        )
        
        if success:
            analysis = response.get('analysis', '')
            project_id = response.get('project_id', '')
            
            if analysis and project_id == self.project_id:
                print(f"✅ Analysis received for project {project_id}")
                print(f"   Analysis preview: {analysis[:500]}...")
                
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
        """Test AI streaming still works"""
        stream_data = {
            "prompt": "Add a dark mode toggle to the app",
            "session_id": f"test-session-{datetime.now().strftime('%H%M%S')}",
            "project_id": self.project_id
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
                
                token_count = 0
                done_received = False
                
                for line in response.iter_lines():
                    if line:
                        line_str = line.decode('utf-8')
                        if line_str.startswith('data: '):
                            try:
                                data = json.loads(line_str[6:])
                                if data.get('type') == 'token':
                                    token_count += 1
                                    if token_count > 50:  # Stop after getting some tokens
                                        break
                                elif data.get('type') == 'done':
                                    done_received = True
                                    break
                                elif data.get('type') == 'error':
                                    print(f"❌ Stream error: {data.get('detail')}")
                                    return False
                            except json.JSONDecodeError:
                                continue
                
                if token_count > 0:
                    print(f"✅ Stream working - received {token_count} tokens")
                    self.tests_passed += 1
                    return True
                else:
                    print(f"❌ No tokens received")
                    return False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

def main():
    print("🚀 Testing New Bolt AI Features")
    print("=" * 50)
    
    tester = NewFeaturesTester()
    
    # Login first
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
    
    # Test new features
    print("\n🧠 Testing New Cofounder Mode Features...")
    
    if not tester.test_ai_chat_with_project():
        print("❌ AI chat with project context failed")
        return 1
    
    if not tester.test_ai_analyze_project():
        print("❌ AI project analysis failed")
        return 1
    
    if not tester.test_ai_generate_stream():
        print("❌ AI streaming generation failed")
        return 1
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All new features working!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())