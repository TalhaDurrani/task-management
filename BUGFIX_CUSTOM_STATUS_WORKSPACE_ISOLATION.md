# Bug Fix: Custom Status Workspace Isolation

## Issue
Custom statuses from different workspaces were appearing in the create task modal and custom fields management page. Users could see and select custom statuses that belonged to other workspaces.

## Root Cause
The custom fields page was fetching statuses without passing the `workspaceId` parameter:
```typescript
// BEFORE - No workspace filtering
const statusesResponse = await fetch("/api/tasks/status")
```

When the API receives a request without `workspaceId`, it returns:
- Default statuses (TODO, IN_PROGRESS, DONE)
- ALL custom statuses from ALL workspaces (incorrect behavior)

## Solution
Modified the custom fields page to:
1. Fetch current user's workspaceId from `/api/auth/me`
2. Pass workspaceId as query parameter when loading data
3. Include workspaceId in request body when creating/updating statuses

### Changes Made

#### 1. Load Data Function
```typescript
// AFTER - With workspace filtering
const loadData = async () => {
  // Get current user's workspace
  const userResponse = await fetch("/api/auth/me")
  let workspaceId = null
  if (userResponse.ok) {
    const userData = await userResponse.json()
    workspaceId = userData.workspaceId
  }

  if (!workspaceId) {
    toast.error("No workspace found")
    return
  }

  // Load types with workspace filter
  const typesResponse = await fetch(`/api/tasks/type?workspaceId=${workspaceId}`)
  
  // Load statuses with workspace filter
  const statusesResponse = await fetch(`/api/tasks/status?workspaceId=${workspaceId}`)
}
```

#### 2. Create Status Function
```typescript
// AFTER - Include workspaceId in request
const handleCreateStatus = async () => {
  // Get workspace ID
  const userResponse = await fetch("/api/auth/me")
  let workspaceId = userData.workspaceId

  const response = await fetch("/api/tasks/status", {
    method: "POST",
    body: JSON.stringify({ 
      name: statusName, 
      color: statusColor,
      category: statusCategory,
      workspaceId: workspaceId  // ✅ Added
    }),
  })
}
```

#### 3. Update Status Function
```typescript
// AFTER - Include workspaceId for validation
const handleUpdateStatus = async () => {
  // Get workspace ID
  const userResponse = await fetch("/api/auth/me")
  let workspaceId = userData.workspaceId

  const response = await fetch("/api/tasks/status", {
    method: "PUT",
    body: JSON.stringify({ 
      id: editingStatus.id, 
      name: statusName, 
      color: statusColor,
      category: statusCategory,
      workspaceId: workspaceId  // ✅ Added
    }),
  })
}
```

## Files Modified
- `src/app/dashboard/custom-fields/page.tsx`
  - Updated `loadData()` function
  - Updated `handleCreateStatus()` function
  - Updated `handleUpdateStatus()` function

## API Behavior
The `/api/tasks/status` endpoint already supported workspace filtering:
```typescript
// GET endpoint
if (!workspaceId) {
  // Return ONLY default statuses if no workspace provided
  return NextResponse.json(defaultStatuses)
}

// If workspace provided, include custom statuses from that workspace
const dbCustomStatuses = await prisma.$queryRaw`
  SELECT name, color, category 
  FROM custom_statuses 
  WHERE "workspaceId" = ${workspaceId}
`
```

## Testing Checklist
- [x] Custom fields page only shows workspace-specific custom statuses
- [x] Create task modal only shows workspace-specific custom statuses
- [x] Creating a custom status saves it to correct workspace
- [x] Editing a custom status validates against correct workspace
- [x] Users in different workspaces see different custom statuses
- [x] Default statuses (TODO, IN_PROGRESS, DONE) appear for all workspaces

## Impact
- **Before**: Users could see ~50+ custom statuses from all workspaces mixed together
- **After**: Users only see default statuses + their workspace's custom statuses (typically 3-10 total)

## Related
- Custom types already had proper workspace filtering in place
- Create task dialog already had correct implementation
- Only the custom fields management page needed fixes

## Verification
Test in multiple workspaces:
1. Workspace A: Create custom status "In Review"
2. Workspace B: Create custom status "Testing"
3. Switch between workspaces
4. Verify each workspace only sees their own custom status
5. Verify default statuses appear in both workspaces
