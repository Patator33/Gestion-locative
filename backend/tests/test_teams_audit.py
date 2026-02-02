"""
Test suite for Teams and Audit Log features in RentMaestro
Tests: Team CRUD, Team invitations, Audit log creation on entity changes
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://rentmaestro.preview.emergentagent.com').rstrip('/')


@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session for all tests"""
    session = requests.Session()
    session.headers.update({'Content-Type': 'application/json'})
    
    # Register a new test user
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    test_email = f"test_teams_{timestamp}@example.com"
    test_password = "TestPass123!"
    test_name = f"Test User {timestamp}"
    
    register_response = session.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "email": test_email,
            "password": test_password,
            "name": test_name
        }
    )
    
    if register_response.status_code == 200:
        data = register_response.json()
        token = data.get('access_token')
        user_id = data.get('user', {}).get('id')
        session.headers.update({'Authorization': f'Bearer {token}'})
        return {
            'session': session,
            'token': token,
            'user_id': user_id,
            'email': test_email,
            'password': test_password,
            'name': test_name
        }
    else:
        pytest.skip(f"Failed to register test user: {register_response.text}")


class TestAuth:
    """Authentication tests"""
    
    def test_auth_register(self):
        """Test user registration creates a new user"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": f"test_reg_{timestamp}@example.com",
                "password": "TestPass123!",
                "name": f"Test Reg {timestamp}"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data
        assert 'user' in data
        assert data['user']['email'] == f"test_reg_{timestamp}@example.com"
    
    def test_auth_login(self, auth_session):
        """Test user login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": auth_session['email'],
                "password": auth_session['password']
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data
        assert data['user']['email'] == auth_session['email']
    
    def test_auth_login_invalid(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401


class TestTeamCRUD:
    """Team CRUD operation tests"""
    
    def test_create_team(self, auth_session):
        """Test creating a new team"""
        session = auth_session['session']
        team_data = {
            "name": f"TEST_Team_{uuid.uuid4().hex[:8]}",
            "description": "Test team description"
        }
        
        response = session.post(f"{BASE_URL}/api/teams", json=team_data)
        
        assert response.status_code == 200
        data = response.json()
        assert 'id' in data
        assert data['message'] == "Équipe créée avec succès"
        
        # Verify team was created by fetching it
        team_id = data['id']
        get_response = session.get(f"{BASE_URL}/api/teams/{team_id}")
        assert get_response.status_code == 200
        team = get_response.json()
        assert team['name'] == team_data['name']
        assert team['description'] == team_data['description']
    
    def test_get_teams(self, auth_session):
        """Test getting all teams for user"""
        session = auth_session['session']
        
        # First create a team
        team_data = {"name": f"TEST_GetTeams_{uuid.uuid4().hex[:8]}"}
        create_response = session.post(f"{BASE_URL}/api/teams", json=team_data)
        assert create_response.status_code == 200
        
        # Get all teams
        response = session.get(f"{BASE_URL}/api/teams")
        assert response.status_code == 200
        teams = response.json()
        assert isinstance(teams, list)
        assert len(teams) >= 1
        
        # Verify team structure
        team = teams[0]
        assert 'id' in team
        assert 'name' in team
        assert 'member_count' in team
        assert 'my_role' in team
    
    def test_get_team_details(self, auth_session):
        """Test getting team details with members"""
        session = auth_session['session']
        
        # Create a team
        team_data = {"name": f"TEST_Details_{uuid.uuid4().hex[:8]}"}
        create_response = session.post(f"{BASE_URL}/api/teams", json=team_data)
        team_id = create_response.json()['id']
        
        # Get team details
        response = session.get(f"{BASE_URL}/api/teams/{team_id}")
        assert response.status_code == 200
        team = response.json()
        
        assert team['name'] == team_data['name']
        assert 'members' in team
        assert len(team['members']) >= 1  # At least the owner
        assert team['my_role'] == 'owner'
        
        # Verify member structure
        member = team['members'][0]
        assert 'user_id' in member
        assert 'role' in member
        assert 'user' in member
    
    def test_update_team(self, auth_session):
        """Test updating team details"""
        session = auth_session['session']
        
        # Create a team
        team_data = {"name": f"TEST_Update_{uuid.uuid4().hex[:8]}"}
        create_response = session.post(f"{BASE_URL}/api/teams", json=team_data)
        team_id = create_response.json()['id']
        
        # Update team
        updated_data = {
            "name": f"TEST_Updated_{uuid.uuid4().hex[:8]}",
            "description": "Updated description"
        }
        update_response = session.put(
            f"{BASE_URL}/api/teams/{team_id}",
            json=updated_data
        )
        assert update_response.status_code == 200
        
        # Verify update
        get_response = session.get(f"{BASE_URL}/api/teams/{team_id}")
        team = get_response.json()
        assert team['name'] == updated_data['name']
        assert team['description'] == updated_data['description']
    
    def test_delete_team(self, auth_session):
        """Test deleting a team"""
        session = auth_session['session']
        
        # Create a team
        team_data = {"name": f"TEST_Delete_{uuid.uuid4().hex[:8]}"}
        create_response = session.post(f"{BASE_URL}/api/teams", json=team_data)
        team_id = create_response.json()['id']
        
        # Delete team
        delete_response = session.delete(f"{BASE_URL}/api/teams/{team_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion - should return 403 (not member) or 404
        get_response = session.get(f"{BASE_URL}/api/teams/{team_id}")
        assert get_response.status_code in [403, 404]
    
    def test_team_access_denied_non_member(self, auth_session):
        """Test that non-members cannot access team details"""
        session = auth_session['session']
        
        # Create a team with first user
        team_data = {"name": f"TEST_Access_{uuid.uuid4().hex[:8]}"}
        create_response = session.post(f"{BASE_URL}/api/teams", json=team_data)
        team_id = create_response.json()['id']
        
        # Create a second user
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')
        second_user_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": f"test_second_{timestamp}@example.com",
                "password": "TestPass123!",
                "name": f"Second User {timestamp}"
            }
        )
        second_token = second_user_response.json()['access_token']
        
        # Try to access team with second user
        response = requests.get(
            f"{BASE_URL}/api/teams/{team_id}",
            headers={'Authorization': f'Bearer {second_token}'}
        )
        assert response.status_code == 403


class TestTeamInvitations:
    """Team invitation tests"""
    
    def test_invite_member_to_team(self, auth_session):
        """Test inviting a member to a team"""
        session = auth_session['session']
        
        # Create a team
        team_data = {"name": f"TEST_Invite_{uuid.uuid4().hex[:8]}"}
        create_response = session.post(f"{BASE_URL}/api/teams", json=team_data)
        team_id = create_response.json()['id']
        
        # Invite a member
        invite_data = {
            "email": f"invite_{uuid.uuid4().hex[:8]}@example.com",
            "role": "member"
        }
        invite_response = session.post(
            f"{BASE_URL}/api/teams/{team_id}/invite",
            json=invite_data
        )
        
        assert invite_response.status_code == 200
        data = invite_response.json()
        assert 'message' in data
        assert 'token' in data  # API returns 'token' field for invitation token
    
    def test_invite_with_different_roles(self, auth_session):
        """Test inviting members with different roles"""
        session = auth_session['session']
        
        # Create a team
        team_data = {"name": f"TEST_Roles_{uuid.uuid4().hex[:8]}"}
        create_response = session.post(f"{BASE_URL}/api/teams", json=team_data)
        team_id = create_response.json()['id']
        
        roles = ['admin', 'member', 'viewer']
        for role in roles:
            invite_data = {
                "email": f"invite_{role}_{uuid.uuid4().hex[:8]}@example.com",
                "role": role
            }
            response = session.post(
                f"{BASE_URL}/api/teams/{team_id}/invite",
                json=invite_data
            )
            assert response.status_code == 200, f"Failed to invite with role {role}"
    
    def test_get_team_invitations(self, auth_session):
        """Test getting pending invitations for a team"""
        session = auth_session['session']
        
        # Create a team
        team_data = {"name": f"TEST_GetInvites_{uuid.uuid4().hex[:8]}"}
        create_response = session.post(f"{BASE_URL}/api/teams", json=team_data)
        team_id = create_response.json()['id']
        
        # Create an invitation
        invite_data = {
            "email": f"invite_{uuid.uuid4().hex[:8]}@example.com",
            "role": "member"
        }
        session.post(f"{BASE_URL}/api/teams/{team_id}/invite", json=invite_data)
        
        # Get invitations
        response = session.get(f"{BASE_URL}/api/teams/{team_id}/invitations")
        assert response.status_code == 200
        invitations = response.json()
        assert isinstance(invitations, list)


class TestAuditLogs:
    """Audit log tests"""
    
    def test_audit_log_on_property_create(self, auth_session):
        """Test that creating a property creates an audit log"""
        session = auth_session['session']
        
        # Create a property
        property_data = {
            "name": f"TEST_AuditProp_{uuid.uuid4().hex[:8]}",
            "address": "123 Test Street",
            "city": "Test City",
            "postal_code": "12345",
            "property_type": "apartment",
            "surface": 50.0,
            "rooms": 2,
            "rent_amount": 1000.0,
            "charges": 100.0
        }
        create_response = session.post(
            f"{BASE_URL}/api/properties",
            json=property_data
        )
        assert create_response.status_code == 200
        property_id = create_response.json()['id']
        
        # Check audit logs
        audit_response = session.get(
            f"{BASE_URL}/api/audit-logs?entity_type=property"
        )
        assert audit_response.status_code == 200
        logs = audit_response.json()
        
        # Find the log for our property
        property_logs = [log for log in logs if log['entity_id'] == property_id]
        assert len(property_logs) >= 1
        
        create_log = property_logs[0]
        assert create_log['action'] == 'create'
        assert create_log['entity_type'] == 'property'
        assert create_log['entity_name'] == property_data['name']
    
    def test_audit_log_on_property_update(self, auth_session):
        """Test that updating a property creates an audit log with changes"""
        session = auth_session['session']
        
        # Create a property
        property_data = {
            "name": f"TEST_AuditUpdate_{uuid.uuid4().hex[:8]}",
            "address": "123 Test Street",
            "city": "Test City",
            "postal_code": "12345",
            "property_type": "apartment",
            "surface": 50.0,
            "rooms": 2,
            "rent_amount": 1000.0,
            "charges": 100.0
        }
        create_response = session.post(
            f"{BASE_URL}/api/properties",
            json=property_data
        )
        property_id = create_response.json()['id']
        
        # Update the property
        updated_data = property_data.copy()
        updated_data['rent_amount'] = 1200.0
        updated_data['name'] = f"TEST_Updated_{uuid.uuid4().hex[:8]}"
        
        update_response = session.put(
            f"{BASE_URL}/api/properties/{property_id}",
            json=updated_data
        )
        assert update_response.status_code == 200
        
        # Check audit logs
        audit_response = session.get(
            f"{BASE_URL}/api/audit-logs?entity_type=property"
        )
        logs = audit_response.json()
        
        # Find update log
        update_logs = [log for log in logs if log['entity_id'] == property_id and log['action'] == 'update']
        assert len(update_logs) >= 1
        
        update_log = update_logs[0]
        assert update_log['changes'] is not None
        assert 'rent_amount' in update_log['changes']
    
    def test_audit_log_on_property_delete(self, auth_session):
        """Test that deleting a property creates an audit log"""
        session = auth_session['session']
        
        # Create a property
        property_data = {
            "name": f"TEST_AuditDelete_{uuid.uuid4().hex[:8]}",
            "address": "123 Test Street",
            "city": "Test City",
            "postal_code": "12345",
            "property_type": "apartment",
            "surface": 50.0,
            "rooms": 2,
            "rent_amount": 1000.0,
            "charges": 100.0
        }
        create_response = session.post(
            f"{BASE_URL}/api/properties",
            json=property_data
        )
        property_id = create_response.json()['id']
        property_name = property_data['name']
        
        # Delete the property
        delete_response = session.delete(
            f"{BASE_URL}/api/properties/{property_id}"
        )
        assert delete_response.status_code == 200
        
        # Check audit logs
        audit_response = session.get(
            f"{BASE_URL}/api/audit-logs?entity_type=property"
        )
        logs = audit_response.json()
        
        # Find delete log
        delete_logs = [log for log in logs if log['entity_id'] == property_id and log['action'] == 'delete']
        assert len(delete_logs) >= 1
        assert delete_logs[0]['entity_name'] == property_name
    
    def test_audit_log_on_tenant_crud(self, auth_session):
        """Test audit logs for tenant CRUD operations"""
        session = auth_session['session']
        
        # Create tenant
        tenant_data = {
            "first_name": "TEST_John",
            "last_name": f"Doe_{uuid.uuid4().hex[:8]}",
            "email": f"test_tenant_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "0123456789"
        }
        create_response = session.post(
            f"{BASE_URL}/api/tenants",
            json=tenant_data
        )
        assert create_response.status_code == 200
        tenant_id = create_response.json()['id']
        
        # Check audit log for create
        audit_response = session.get(
            f"{BASE_URL}/api/audit-logs?entity_type=tenant"
        )
        logs = audit_response.json()
        create_logs = [log for log in logs if log['entity_id'] == tenant_id and log['action'] == 'create']
        assert len(create_logs) >= 1
    
    def test_audit_log_on_team_create(self, auth_session):
        """Test that creating a team creates an audit log"""
        session = auth_session['session']
        
        team_data = {"name": f"TEST_AuditTeam_{uuid.uuid4().hex[:8]}"}
        create_response = session.post(
            f"{BASE_URL}/api/teams",
            json=team_data
        )
        assert create_response.status_code == 200
        team_id = create_response.json()['id']
        
        # Check audit logs
        audit_response = session.get(
            f"{BASE_URL}/api/audit-logs?entity_type=team"
        )
        assert audit_response.status_code == 200
        logs = audit_response.json()
        
        team_logs = [log for log in logs if log['entity_id'] == team_id]
        assert len(team_logs) >= 1
        assert team_logs[0]['action'] == 'create'
    
    def test_get_audit_logs_all(self, auth_session):
        """Test getting all audit logs"""
        session = auth_session['session']
        response = session.get(f"{BASE_URL}/api/audit-logs")
        assert response.status_code == 200
        logs = response.json()
        assert isinstance(logs, list)
    
    def test_get_audit_logs_filtered_by_entity_type(self, auth_session):
        """Test filtering audit logs by entity type"""
        session = auth_session['session']
        
        # Create a property to ensure we have logs
        property_data = {
            "name": f"TEST_Filter_{uuid.uuid4().hex[:8]}",
            "address": "123 Test Street",
            "city": "Test City",
            "postal_code": "12345",
            "property_type": "apartment",
            "surface": 50.0,
            "rooms": 2,
            "rent_amount": 1000.0,
            "charges": 100.0
        }
        session.post(f"{BASE_URL}/api/properties", json=property_data)
        
        # Get filtered logs
        response = session.get(
            f"{BASE_URL}/api/audit-logs?entity_type=property"
        )
        assert response.status_code == 200
        logs = response.json()
        
        # All logs should be for properties
        for log in logs:
            assert log['entity_type'] == 'property'
    
    def test_get_entity_history(self, auth_session):
        """Test getting history for a specific entity"""
        session = auth_session['session']
        
        # Create a property
        property_data = {
            "name": f"TEST_History_{uuid.uuid4().hex[:8]}",
            "address": "123 Test Street",
            "city": "Test City",
            "postal_code": "12345",
            "property_type": "apartment",
            "surface": 50.0,
            "rooms": 2,
            "rent_amount": 1000.0,
            "charges": 100.0
        }
        create_response = session.post(
            f"{BASE_URL}/api/properties",
            json=property_data
        )
        property_id = create_response.json()['id']
        
        # Update it
        updated_data = property_data.copy()
        updated_data['rent_amount'] = 1100.0
        session.put(f"{BASE_URL}/api/properties/{property_id}", json=updated_data)
        
        # Get entity history
        response = session.get(
            f"{BASE_URL}/api/audit-logs/entity/property/{property_id}"
        )
        assert response.status_code == 200
        logs = response.json()
        
        # Should have at least create and update logs
        assert len(logs) >= 2
        actions = [log['action'] for log in logs]
        assert 'create' in actions
        assert 'update' in actions
    
    def test_audit_log_structure(self, auth_session):
        """Test that audit logs have the correct structure"""
        session = auth_session['session']
        
        # Create something to generate a log
        property_data = {
            "name": f"TEST_Structure_{uuid.uuid4().hex[:8]}",
            "address": "123 Test Street",
            "city": "Test City",
            "postal_code": "12345",
            "property_type": "apartment",
            "surface": 50.0,
            "rooms": 2,
            "rent_amount": 1000.0,
            "charges": 100.0
        }
        session.post(f"{BASE_URL}/api/properties", json=property_data)
        
        # Get logs
        response = session.get(f"{BASE_URL}/api/audit-logs?limit=1")
        assert response.status_code == 200
        logs = response.json()
        
        if len(logs) > 0:
            log = logs[0]
            # Verify structure
            assert 'id' in log
            assert 'user_id' in log
            assert 'user_name' in log
            assert 'action' in log
            assert 'entity_type' in log
            assert 'entity_id' in log
            assert 'entity_name' in log
            assert 'created_at' in log


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
