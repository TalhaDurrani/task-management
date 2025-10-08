# Custom Fields & Task Creation - Complete Implementation Guide

## 🎯 Overview

This implementation provides Jira/ClickUp-like custom fields and task creation with:
- **12 Field Types**: TEXT, NUMBER, DROPDOWN, MULTI_SELECT, BOOLEAN, DATE, USER, EMAIL, URL, TEXTAREA, CHECKBOX, RATING
- **Field Validation**: Required fields, min/max values, regex patterns
- **Global & Project-Specific Fields**: Fields can be workspace-wide or project-specific
- **Task Templates**: Pre-configured templates with default values
- **Advanced Task Creation**: Comprehensive task creation with custom fields, subtasks, attachments

## 🚨 Current Issue: "User not assigned to workspace"

**Problem**: You're getting this error when trying to create custom fields or tasks.

**Cause**: Your user account doesn't have a `workspaceId` assigned.

**Solution**: You need to either:
1. Join a workspace using a join code
2. Create a new workspace (which auto-assigns you)
3. Manually assign yourself to a workspace via database or admin panel

### Quick Fix Steps:

#### Option 1: Via API (Recommended)
```bash
# 1. Get your user ID (check the network tab or database)
# 2. Create or get a workspace ID
# 3. Use the assign-workspace API:

POST /api/users/{userId}/assign-workspace
{
  "workspaceId": "your-workspace-id"
}
```

#### Option 2: Via Database Query
```sql
-- Check your current user
SELECT id, email, name, "workspaceId" FROM "User" WHERE email = 'your-email@example.com';

-- Check available workspaces
SELECT id, name FROM workspaces;

-- Assign yourself to a workspace
UPDATE "User" 
SET "workspaceId" = 'workspace-uuid-here' 
WHERE email = 'your-email@example.com';

-- Create WorkspaceMember record
INSERT INTO workspace_members (id, "userId", "workspaceId", role, "joinedAt")
VALUES (
  gen_random_uuid(),
  'your-user-id',
  'workspace-id',
  'ADMIN',
  NOW()
);
```

#### Option 3: Create New Workspace
```bash
POST /api/workspaces
{
  "name": "My Workspace",
  "description": "My workspace description"
}
```

## 📋 Database Schema Changes

### CustomField Model
```prisma
model CustomField {
  id           String   @id @default(uuid())
  name         String
  type         CustomFieldType
  description  String?
  options      String?        // JSON array for select options
  defaultValue String?
  placeholder  String?
  isRequired   Boolean  @default(false)
  isGlobal     Boolean  @default(false)
  min          Float?         // For NUMBER, RATING
  max          Float?         // For NUMBER, RATING
  pattern      String?        // Regex for TEXT, EMAIL, URL
  workspaceId  String?
  projectId    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Field Types
- **TEXT**: Single-line text with optional pattern validation
- **TEXTAREA**: Multi-line text
- **NUMBER**: Numeric value with min/max validation
- **DROPDOWN**: Single selection from options
- **MULTI_SELECT**: Multiple selections from options
- **BOOLEAN**: Yes/No toggle
- **DATE**: Date picker
- **USER**: User selector (from workspace members)
- **EMAIL**: Email with validation
- **URL**: URL with validation
- **CHECKBOX**: Multiple checkboxes
- **RATING**: Star rating with min/max

## 🔧 API Endpoints

### Custom Fields

#### GET /api/custom-fields
Get all custom fields for workspace/project
```bash
# Get all workspace fields
GET /api/custom-fields

# Get project-specific fields
GET /api/custom-fields?projectId={projectId}

# Get project fields + global fields
GET /api/custom-fields?projectId={projectId}&includeGlobal=true

# Get only global fields
GET /api/custom-fields?includeGlobal=true
```

#### POST /api/custom-fields
Create a new custom field (Admin only)
```json
{
  "name": "Priority Level",
  "type": "DROPDOWN",
  "description": "Task priority level",
  "options": ["Low", "Medium", "High", "Critical"],
  "defaultValue": "Medium",
  "placeholder": "Select priority",
  "isRequired": true,
  "isGlobal": true,
  "projectId": null
}
```

#### PATCH /api/custom-fields/[id]
Update a custom field
```json
{
  "name": "Updated Name",
  "options": ["Option 1", "Option 2"],
  "isRequired": false
}
```

#### DELETE /api/custom-fields/[id]
Delete a custom field (cascades to task values)

### Task Templates

#### GET /api/tasks/templates
Get all task templates
```bash
# Get all workspace templates
GET /api/tasks/templates

# Get project-specific templates
GET /api/tasks/templates?projectId={projectId}
```

#### POST /api/tasks/templates
Create a task template (Admin only)
```json
{
  "name": "Bug Report Template",
  "description": "Template for bug reports",
  "type": "bug",
  "priority": "HIGH",
  "projectId": "project-uuid",
  "templateData": {
    "title": "Bug: ",
    "description": "## Steps to Reproduce\n1. \n\n## Expected Behavior\n\n## Actual Behavior\n",
    "customFields": [
      {
        "fieldId": "field-uuid",
        "value": "Critical"
      }
    ]
  }
}
```

### Task Creation

#### POST /api/tasks
Create a new task with custom fields
```json
{
  "projectId": "project-uuid",
  "title": "Implement feature X",
  "description": "Detailed description",
  "type": "feature",
  "priority": "HIGH",
  "status": "TODO",
  "dueDate": "2024-12-31",
  "assignees": ["user-uuid-1", "user-uuid-2"],
  "customFields": [
    {
      "fieldId": "custom-field-uuid",
      "value": "High Priority"
    }
  ],
  "subTasks": [
    {
      "title": "Subtask 1",
      "description": "Subtask description"
    }
  ],
  "attachments": [
    {
      "fileName": "document.pdf",
      "filePath": "/uploads/document.pdf",
      "fileSize": 1024,
      "mimeType": "application/pdf"
    }
  ]
}
```

## 🎨 Field Type Examples

### TEXT Field
```json
{
  "name": "Department",
  "type": "TEXT",
  "placeholder": "Enter department name",
  "pattern": "^[A-Za-z\\s]+$",
  "isRequired": true
}
```

### NUMBER Field
```json
{
  "name": "Story Points",
  "type": "NUMBER",
  "min": 1,
  "max": 100,
  "defaultValue": "5",
  "isRequired": false
}
```

### DROPDOWN Field
```json
{
  "name": "Status Category",
  "type": "DROPDOWN",
  "options": ["Not Started", "In Progress", "Completed", "Blocked"],
  "defaultValue": "Not Started",
  "isRequired": true
}
```

### MULTI_SELECT Field
```json
{
  "name": "Tags",
  "type": "MULTI_SELECT",
  "options": ["Frontend", "Backend", "Database", "API", "UI/UX"],
  "isRequired": false
}
```

### DATE Field
```json
{
  "name": "Start Date",
  "type": "DATE",
  "isRequired": false
}
```

### USER Field
```json
{
  "name": "Reviewer",
  "type": "USER",
  "description": "Select a reviewer from workspace members",
  "isRequired": false
}
```

### EMAIL Field
```json
{
  "name": "Contact Email",
  "type": "EMAIL",
  "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  "isRequired": false
}
```

### URL Field
```json
{
  "name": "Documentation Link",
  "type": "URL",
  "placeholder": "https://example.com",
  "isRequired": false
}
```

### RATING Field
```json
{
  "name": "Complexity",
  "type": "RATING",
  "min": 1,
  "max": 5,
  "defaultValue": "3",
  "isRequired": false
}
```

### BOOLEAN Field
```json
{
  "name": "Is Urgent",
  "type": "BOOLEAN",
  "defaultValue": "false",
  "isRequired": false
}
```

## 📊 Features Implemented

### ✅ Custom Fields System
- [x] 12 field types support
- [x] Field validation (required, min/max, pattern)
- [x] Global and project-specific fields
- [x] Field CRUD operations
- [x] Workspace-scoped fields

### ✅ Task Creation Enhancement
- [x] Custom fields in task creation
- [x] Subtasks support
- [x] Attachments support
- [x] Assignees support
- [x] Field validation on task creation
- [x] Required fields check

### ✅ Task Templates
- [x] Template CRUD API
- [x] Template with pre-filled custom fields
- [x] Project-specific and global templates

### 🔄 Next Steps (Frontend)
- [ ] Custom field renderer component
- [ ] Dynamic form builder for custom fields
- [ ] Task creation dialog with custom fields
- [ ] Template selector in task creation
- [ ] Custom field management UI
- [ ] Drag-and-drop field ordering

## 🛠️ Testing Checklist

### Custom Fields
- [ ] Create TEXT field
- [ ] Create DROPDOWN field with options
- [ ] Create NUMBER field with min/max
- [ ] Create MULTI_SELECT field
- [ ] Create DATE field
- [ ] Create USER field
- [ ] Create RATING field
- [ ] Update custom field
- [ ] Delete custom field
- [ ] Create global field
- [ ] Create project-specific field

### Task Creation
- [ ] Create task without custom fields
- [ ] Create task with one custom field
- [ ] Create task with multiple custom fields
- [ ] Create task with required field validation
- [ ] Create task with subtasks
- [ ] Create task with attachments
- [ ] Create task with assignees
- [ ] Create task from template

### Task Templates
- [ ] Create task template
- [ ] Use template to create task
- [ ] Update template
- [ ] Delete template

## 🐛 Troubleshooting

### Issue: "User not assigned to workspace"
**Fix**: Assign user to workspace (see Quick Fix Steps above)

### Issue: "Invalid field type"
**Fix**: Use one of the 12 valid field types listed above

### Issue: "Options are required for DROPDOWN field type"
**Fix**: Provide an array of options when creating DROPDOWN, MULTI_SELECT, or CHECKBOX fields

### Issue: "Required fields missing"
**Fix**: Ensure all fields marked as `isRequired: true` have values when creating a task

### Issue: "Custom field not found"
**Fix**: Verify the custom field belongs to the same workspace and hasn't been deleted

## 📝 Usage Examples

### Example 1: Create a Bug Report System
```javascript
// 1. Create custom fields
const severityField = await fetch('/api/custom-fields', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Severity',
    type: 'DROPDOWN',
    options: ['Critical', 'High', 'Medium', 'Low'],
    isRequired: true,
    isGlobal: true
  })
})

const stepsField = await fetch('/api/custom-fields', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Steps to Reproduce',
    type: 'TEXTAREA',
    placeholder: 'Describe the steps...',
    isRequired: true
  })
})

// 2. Create bug template
const template = await fetch('/api/tasks/templates', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Bug Report',
    type: 'bug',
    priority: 'HIGH',
    templateData: {
      title: 'Bug: ',
      description: '## Description\n\n## Steps\n\n## Expected\n\n## Actual'
    }
  })
})

// 3. Create bug task
const task = await fetch('/api/tasks', {
  method: 'POST',
  body: JSON.stringify({
    projectId: 'project-id',
    title: 'Bug: Login not working',
    type: 'bug',
    priority: 'CRITICAL',
    customFields: [
      { fieldId: severityField.id, value: 'Critical' },
      { fieldId: stepsField.id, value: '1. Go to login\n2. Enter credentials\n3. Click login' }
    ]
  })
})
```

### Example 2: Create a Feature Request System
```javascript
// Create custom fields
const effortField = await fetch('/api/custom-fields', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Effort (Story Points)',
    type: 'NUMBER',
    min: 1,
    max: 100,
    defaultValue: '5'
  })
})

const componentField = await fetch('/api/custom-fields', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Component',
    type: 'MULTI_SELECT',
    options: ['Frontend', 'Backend', 'Database', 'API']
  })
})

// Create feature task
const feature = await fetch('/api/tasks', {
  method: 'POST',
  body: JSON.stringify({
    projectId: 'project-id',
    title: 'Add dark mode',
    type: 'feature',
    priority: 'MEDIUM',
    customFields: [
      { fieldId: effortField.id, value: '13' },
      { fieldId: componentField.id, value: JSON.stringify(['Frontend', 'UI/UX']) }
    ],
    subTasks: [
      { title: 'Design dark theme colors' },
      { title: 'Implement theme toggle' },
      { title: 'Test in all browsers' }
    ]
  })
})
```

## 🎯 Best Practices

1. **Use Global Fields**: For fields that apply across all projects (e.g., "Effort", "Complexity")
2. **Use Project Fields**: For project-specific fields (e.g., "Release Version")
3. **Required Fields**: Only mark truly essential fields as required
4. **Default Values**: Provide sensible defaults to speed up task creation
5. **Field Naming**: Use clear, consistent naming (e.g., "Story Points" not "SP")
6. **Templates**: Create templates for common task types to ensure consistency
7. **Validation**: Use min/max and pattern validation to ensure data quality

## 📚 Related Files

- Schema: `prisma/schema.prisma`
- Custom Fields API: `src/app/api/custom-fields/route.ts`
- Custom Field Details API: `src/app/api/custom-fields/[id]/route.ts`
- Task Templates API: `src/app/api/tasks/templates/route.ts`
- Task Service: `src/services/taskService.ts`
- Types: `src/types/index.ts`

---

**Status**: ✅ Backend Complete | 🔄 Frontend In Progress
**Date**: October 7, 2025
**Version**: 1.0.0
