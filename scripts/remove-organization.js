#!/usr/bin/env node
/**
 * Script to remove organization references from the codebase
 * This updates all services, API routes, and utilities to remove organizationId checks
 */

const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'src/services/taskService.ts',
  'src/services/projectService.ts',
  'src/services/activityService.ts',
  'src/services/workspaceService.ts',
  'src/app/api/users/route.ts',
  'src/app/api/users/[id]/route.ts',
  'src/app/api/projects/route.ts',
  'src/app/api/projects/[id]/route.ts',
  'src/app/api/tasks/route.ts',
  'src/app/api/tasks/[id]/route.ts',
  'src/app/api/search/route.ts',
];

function removeOrganizationReferences(content) {
  // Replace organizationId: true in select statements
  content = content.replace(/organizationId:\s*true,?\s*/g, '');
  
  // Replace organizationId: user.organizationId in where clauses
  content = content.replace(/organizationId:\s*user\.organizationId,?\s*/g, '');
  
  // Replace checks for organizationId
  content = content.replace(/\|\|\s*!user\.organizationId/g, '');
  content = content.replace(/&&\s*!user\.organizationId/g, '');
  content = content.replace(/!user\.organizationId\s*\|\|/g, '');
  content = content.replace(/!user\.organizationId\s*&&/g, '');
  
  // Replace error messages
  content = content.replace(/User not assigned to workspace or organization/g, 'User not assigned to workspace');
  content = content.replace(/same workspace and organization/g, 'same workspace');
  content = content.replace(/workspace and organization/g, 'workspace');
  content = content.replace(/workspace\/organization/g, 'workspace');
  
  // Replace comments mentioning organization
  content = content.replace(/workspace and organization/g, 'workspace');
  content = content.replace(/Get the user's workspace and organization/g, "Get the user's workspace");
  content = content.replace(/user's workspace and organization/g, "user's workspace");
  
  // Replace SUPER_ADMIN with ADMIN
  content = content.replace(/'SUPER_ADMIN'/g, "'ADMIN'");
  content = content.replace(/"SUPER_ADMIN"/g, '"ADMIN"');
  content = content.replace(/SUPER_ADMIN/g, 'ADMIN');
  
  // Replace USER role with MEMBER
  content = content.replace(/'USER'/g, "'MEMBER'");
  content = content.replace(/"USER"/g, '"MEMBER"');
  content = content.replace(/Role\.USER/g, 'Role.MEMBER');
  
  return content;
}

console.log('🔧 Removing organization references from codebase...\n');

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      content = removeOrganizationReferences(content);
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
      } else {
        console.log(`⏭️  Skipped (no changes): ${filePath}`);
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log('\n✨ Organization removal complete!');
console.log('\n📝 Next steps:');
console.log('1. Run: npx prisma generate');
console.log('2. Run: npx prisma migrate dev --name remove_organization');
console.log('3. Review and test the changes');
