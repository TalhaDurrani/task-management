# Workspace-Specific Role Management Implementation

## Problem
When changing a user's role in a workspace through the User Management tab, it was changing their global `user.role` instead of their workspace-specific role. This meant:
- A user could only have one role across all workspaces
- Changing someone's role in one workspace affected their role globally
- No way to have different roles in different workspaces

## Solution
Created a `WorkspaceMember` junction table to track workspace-specific roles.

## Database Schema Changes

### New Model: `WorkspaceMember`
```prisma
model WorkspaceMember {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @db.Uuid
  workspaceId String    @db.Uuid
  role        Role      @default(MEMBER)
  joinedAt    DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@map("workspace_members")
}
```

### Updated Relations
- **User model**: Added `workspaceMemberships WorkspaceMember[]`
- **Workspace model**: Added `workspaceMembers WorkspaceMember[]`

## Benefits

### 1. Workspace-Specific Roles
- Users can have different roles in different workspaces
- A user can be:
  - ADMIN in their own workspace
  - MEMBER in workspaces they joined

### 2. Better Data Model
- `user.role` = Global role (for system-level permissions)
- `WorkspaceMember.role` = Workspace-specific role

### 3. Cascading Deletes
- When a user is deleted, their workspace memberships are automatically removed
- When a workspace is deleted, all memberships are removed

## Implementation Required

### Backend Updates Needed:

1. **Update `/api/workspaces/join` endpoint**:
   - Create `WorkspaceMember` record instead of just updating user
   - Set workspace-specific role to MEMBER

2. **Update `/api/workspaces` endpoint**:
   - Include `workspaceMembers` with user details and their workspace-specific roles
   - Join the `WorkspaceMember` table to get role information

3. **Update `/api/workspaces/[id]/users` endpoints**:
   - Query `WorkspaceMember` to get users with their workspace-specific roles
   - Update `WorkspaceMember.role` instead of `user.role` when changing roles

4. **Update `workspaceService.ts`**:
   - Modify `getWorkspace` to include workspace members with their roles
   - Add method to update workspace member roles
   - Add method to remove workspace members

5. **Update registration flow in `auth.ts`**:
   - Create `WorkspaceMember` record when user creates their workspace
   - Set their workspace-specific role to ADMIN

### Frontend Updates Needed:

1. **User Management Component**:
   - Display workspace-specific roles (from `WorkspaceMember`)
   - Update workspace-specific role when changed

2. **Workspace Members Tab**:
   - Show users with their workspace-specific roles
   - Allow admin to change workspace-specific roles

## Migration Notes

- Schema has been pushed to database
- `workspace_members` table created
- Existing workspace memberships need to be migrated to the new table
- Run a data migration script to populate `WorkspaceMember` records from existing data

## Next Steps

1. Update API endpoints to use `WorkspaceMember` model
2. Update services to query workspace-specific roles
3. Migrate existing workspace membership data
4. Update frontend components to display workspace-specific roles
5. Test role changes across multiple workspaces
