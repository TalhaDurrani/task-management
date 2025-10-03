// Test script to verify workspace functionality
// Run this in browser console when logged in

async function testWorkspaceAPIs() {
  console.log('🧪 Starting Workspace API Tests...\n');
  
  // Test 1: Get all workspaces
  console.log('Test 1: GET /api/workspaces');
  try {
    const workspacesRes = await fetch('/api/workspaces');
    const workspaces = await workspacesRes.json();
    console.log('✅ Status:', workspacesRes.status);
    console.log('📊 Workspaces:', workspaces);
    console.log('📝 Count:', workspaces.length);
    
    if (workspaces.length > 0) {
      const firstWorkspace = workspaces[0];
      console.log('📋 First workspace structure:', {
        id: firstWorkspace.id,
        name: firstWorkspace.name,
        _count: firstWorkspace._count
      });
      
      // Test 2: Get specific workspace with projects
      console.log('\nTest 2: GET /api/workspaces/:id');
      const workspaceRes = await fetch(`/api/workspaces/${firstWorkspace.id}`);
      const workspace = await workspaceRes.json();
      console.log('✅ Status:', workspaceRes.status);
      console.log('📊 Workspace details:', workspace);
      
      // Test 3: Get workspace projects
      console.log('\nTest 3: GET /api/workspaces/:id/projects');
      const projectsRes = await fetch(`/api/workspaces/${firstWorkspace.id}/projects`);
      const projects = await projectsRes.json();
      console.log('✅ Status:', projectsRes.status);
      console.log('📊 Projects:', projects);
      console.log('📝 Count:', projects.length);
      
      // Test 4: Get workspace users
      console.log('\nTest 4: GET /api/workspaces/:id/users');
      const usersRes = await fetch(`/api/workspaces/${firstWorkspace.id}/users`);
      const users = await usersRes.json();
      console.log('✅ Status:', usersRes.status);
      console.log('📊 Users:', users);
      console.log('📝 Count:', users.length);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  // Test 5: Get all users (for adding to workspace)
  console.log('\nTest 5: GET /api/users');
  try {
    const allUsersRes = await fetch('/api/users');
    const allUsers = await allUsersRes.json();
    console.log('✅ Status:', allUsersRes.status);
    console.log('📊 All users:', allUsers);
    console.log('📝 Count:', allUsers.length);
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n✨ Tests completed!');
}

// Run the tests
testWorkspaceAPIs();
