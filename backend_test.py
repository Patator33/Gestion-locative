import requests
import sys
import json
from datetime import datetime, timedelta

class RentMaestroAPITester:
    def __init__(self, base_url="https://rent-maestro.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'property': None,
            'tenant': None,
            'lease': None,
            'payment': None,
            'vacancy': None
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'id' in response_data:
                        print(f"   Created ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # Try to login with the registered user
        if not hasattr(self, '_test_email'):
            return True  # Skip if no registration was done
            
        test_data = {
            "email": self._test_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=test_data
        )
        return success

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_property(self):
        """Test property creation"""
        property_data = {
            "name": "Test Apartment",
            "address": "123 Test Street",
            "city": "Test City",
            "postal_code": "12345",
            "property_type": "apartment",
            "surface": 45.5,
            "rooms": 2,
            "rent_amount": 850.0,
            "charges": 50.0,
            "description": "Test property for API testing"
        }
        
        success, response = self.run_test(
            "Create Property",
            "POST",
            "properties",
            200,
            data=property_data
        )
        
        if success and 'id' in response:
            self.created_ids['property'] = response['id']
        return success

    def test_get_properties(self):
        """Test get all properties"""
        success, response = self.run_test(
            "Get Properties",
            "GET",
            "properties",
            200
        )
        return success

    def test_get_property_by_id(self):
        """Test get property by ID"""
        if not self.created_ids['property']:
            print("⚠️  Skipping - No property ID available")
            return True
            
        success, response = self.run_test(
            "Get Property by ID",
            "GET",
            f"properties/{self.created_ids['property']}",
            200
        )
        return success

    def test_create_tenant(self):
        """Test tenant creation"""
        tenant_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "0123456789",
            "birth_date": "1990-01-01",
            "profession": "Engineer",
            "emergency_contact": "Jane Doe - 0987654321",
            "notes": "Test tenant for API testing"
        }
        
        success, response = self.run_test(
            "Create Tenant",
            "POST",
            "tenants",
            200,
            data=tenant_data
        )
        
        if success and 'id' in response:
            self.created_ids['tenant'] = response['id']
        return success

    def test_get_tenants(self):
        """Test get all tenants"""
        success, response = self.run_test(
            "Get Tenants",
            "GET",
            "tenants",
            200
        )
        return success

    def test_create_lease(self):
        """Test lease creation"""
        if not self.created_ids['property'] or not self.created_ids['tenant']:
            print("⚠️  Skipping - Missing property or tenant ID")
            return True
            
        lease_data = {
            "property_id": self.created_ids['property'],
            "tenant_id": self.created_ids['tenant'],
            "start_date": datetime.now().strftime('%Y-%m-%d'),
            "rent_amount": 850.0,
            "charges": 50.0,
            "deposit": 1700.0,
            "payment_day": 1,
            "notes": "Test lease for API testing"
        }
        
        success, response = self.run_test(
            "Create Lease",
            "POST",
            "leases",
            200,
            data=lease_data
        )
        
        if success and 'id' in response:
            self.created_ids['lease'] = response['id']
        return success

    def test_get_leases(self):
        """Test get all leases"""
        success, response = self.run_test(
            "Get Leases",
            "GET",
            "leases",
            200
        )
        return success

    def test_create_payment(self):
        """Test payment creation"""
        if not self.created_ids['lease']:
            print("⚠️  Skipping - Missing lease ID")
            return True
            
        now = datetime.now()
        payment_data = {
            "lease_id": self.created_ids['lease'],
            "amount": 900.0,
            "payment_date": now.strftime('%Y-%m-%d'),
            "period_month": now.month,
            "period_year": now.year,
            "payment_method": "virement",
            "notes": "Test payment for API testing"
        }
        
        success, response = self.run_test(
            "Create Payment",
            "POST",
            "payments",
            200,
            data=payment_data
        )
        
        if success and 'id' in response:
            self.created_ids['payment'] = response['id']
        return success

    def test_get_payments(self):
        """Test get all payments"""
        success, response = self.run_test(
            "Get Payments",
            "GET",
            "payments",
            200
        )
        return success

    def test_generate_receipt(self):
        """Test receipt generation"""
        if not self.created_ids['payment']:
            print("⚠️  Skipping - Missing payment ID")
            return True
            
        success, response = self.run_test(
            "Generate Receipt",
            "GET",
            f"receipts/{self.created_ids['payment']}",
            200
        )
        return success

    def test_create_vacancy(self):
        """Test vacancy creation"""
        if not self.created_ids['property']:
            print("⚠️  Skipping - Missing property ID")
            return True
            
        vacancy_data = {
            "property_id": self.created_ids['property'],
            "start_date": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            "reason": "End of lease"
        }
        
        success, response = self.run_test(
            "Create Vacancy",
            "POST",
            "vacancies",
            200,
            data=vacancy_data
        )
        
        if success and 'id' in response:
            self.created_ids['vacancy'] = response['id']
        return success

    def test_get_vacancies(self):
        """Test get all vacancies"""
        success, response = self.run_test(
            "Get Vacancies",
            "GET",
            "vacancies",
            200
        )
        return success

    def test_get_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        return success

    def test_notification_settings(self):
        """Test notification settings"""
        # Get settings
        success1, response = self.run_test(
            "Get Notification Settings",
            "GET",
            "notifications/settings",
            200
        )
        
        # Update settings
        settings_data = {
            "late_payment": True,
            "late_payment_days": 7,
            "lease_ending": True,
            "lease_ending_days": 90,
            "vacancy_alert": True,
            "vacancy_alert_days": 15
        }
        
        success2, response = self.run_test(
            "Update Notification Settings",
            "PUT",
            "notifications/settings",
            200,
            data=settings_data
        )
        
        return success1 and success2

    def test_get_notifications(self):
        """Test get notifications"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200
        )
        return success

    def test_export_payments_excel(self):
        """Test Excel export of payments"""
        # Test export for current year
        current_year = datetime.now().year
        success1, response = self.run_test(
            f"Export Payments Excel ({current_year})",
            "GET",
            f"export/payments/excel?year={current_year}",
            200
        )
        
        # Test export for all years
        success2, response = self.run_test(
            "Export Payments Excel (All Years)",
            "GET",
            "export/payments/excel",
            200
        )
        
        return success1 and success2

    def test_smtp_configuration(self):
        """Test SMTP configuration endpoints"""
        # Update notification settings with SMTP config
        smtp_settings = {
            "late_payment": True,
            "late_payment_days": 5,
            "lease_ending": True,
            "lease_ending_days": 60,
            "vacancy_alert": True,
            "vacancy_alert_days": 30,
            "email_reminders": True,
            "reminder_frequency": "weekly",
            "smtp_email": "test@gmail.com",
            "smtp_password": "test_password",
            "smtp_configured": False
        }
        
        success1, response = self.run_test(
            "Update SMTP Settings",
            "PUT",
            "notifications/settings",
            200,
            data=smtp_settings
        )
        
        # Note: We can't test actual SMTP connection without real credentials
        # But we can test that the endpoint exists and handles the request
        success2, response = self.run_test(
            "Test SMTP Connection (Expected to fail)",
            "POST",
            "reminders/test-smtp",
            400  # Expected to fail with invalid credentials
        )
        
        return success1 and success2

    def test_pending_payments(self):
        """Test pending payments endpoint"""
        success, response = self.run_test(
            "Get Pending Payments",
            "GET",
            "reminders/pending",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   Found {response.get('count', 0)} pending payments")
        
        return success

    def test_send_reminders(self):
        """Test send reminders endpoint (expected to fail without SMTP config)"""
        success, response = self.run_test(
            "Send Payment Reminders (Expected to fail)",
            "POST",
            "reminders/send",
            400  # Expected to fail without proper SMTP configuration
        )
        return success

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting RentMaestro API Tests")
        print("=" * 50)
        
        # Test sequence
        tests = [
            self.test_health_check,
            self.test_register,
            self.test_get_me,
            self.test_create_property,
            self.test_get_properties,
            self.test_get_property_by_id,
            self.test_create_tenant,
            self.test_get_tenants,
            self.test_create_lease,
            self.test_get_leases,
            self.test_create_payment,
            self.test_get_payments,
            self.test_generate_receipt,
            self.test_create_vacancy,
            self.test_get_vacancies,
            self.test_get_dashboard_stats,
            self.test_notification_settings,
            self.test_get_notifications,
            self.test_export_payments_excel,
            self.test_smtp_configuration,
            self.test_pending_payments,
            self.test_send_reminders
        ]
        
        failed_tests = []
        
        for test in tests:
            try:
                if not test():
                    failed_tests.append(test.__name__)
            except Exception as e:
                print(f"❌ {test.__name__} failed with exception: {str(e)}")
                failed_tests.append(test.__name__)
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if failed_tests:
            print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
        else:
            print("\n✅ All tests passed!")
        
        print(f"\nCreated test data IDs:")
        for key, value in self.created_ids.items():
            if value:
                print(f"  {key}: {value}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = RentMaestroAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())