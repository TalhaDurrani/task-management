# Workspace Invitation System - Design Document

## Overview
A complete invitation system that allows workspace admins to invite users via email to join their workspaces.

## Features
1. ✅ Email-based invitations
2. ✅ Invitation status tracking (Pending, Accepted, Declined, Expired)
3. ✅ Secure invitation tokens
4. ✅ Expiration mechanism (7 days)
5. ✅ Email notifications
6. ✅ Accept/Decline workflow
7. ✅ Re-send invitation capability

---

## Database Schema

### New Model: WorkspaceInvitation

```prisma
model WorkspaceInvitation {
  id            String              @id @default(uuid()) @db.Uuid
  workspaceId   String              @db.Uuid
  workspace     Workspace           @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  email         String              // Email of invitee
  invitedBy     String              @db.Uuid
  inviter       User                @relation("InvitationsSent", fields: [invitedBy], references: [id])
  
  token         String              @unique // Secure token for invitation link
  status        InvitationStatus    @default(PENDING)
  
  expiresAt     DateTime            // 7 days from creation
  createdAt     DateTime            @default(now())
  acceptedAt    DateTime?
  declinedAt    DateTime?
  
  @@unique([workspaceId, email])
  @@map("workspace_invitations")
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}
```

### Update Existing Models

```prisma
model User {
  // ... existing fields
  sentInvitations     WorkspaceInvitation[]  @relation("InvitationsSent")
}

model Workspace {
  // ... existing fields
  invitations         WorkspaceInvitation[]
}
```

---

## API Endpoints

### 1. Send Invitation
**POST** `/api/workspaces/[id]/invitations`

```typescript
Request Body:
{
  email: string
  message?: string  // Optional personal message
}

Response:
{
  id: string
  email: string
  status: "PENDING"
  expiresAt: string
}
```

### 2. Get Workspace Invitations
**GET** `/api/workspaces/[id]/invitations`

```typescript
Response:
[
  {
    id: string
    email: string
    status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED"
    invitedBy: {
      name: string
      email: string
    }
    createdAt: string
    expiresAt: string
  }
]
```

### 3. Resend Invitation
**POST** `/api/workspaces/[id]/invitations/[invitationId]/resend`

```typescript
Response:
{
  success: true
  message: "Invitation resent successfully"
}
```

### 4. Cancel Invitation
**DELETE** `/api/workspaces/[id]/invitations/[invitationId]`

```typescript
Response:
{
  success: true
}
```

### 5. Get User's Pending Invitations
**GET** `/api/invitations/pending`

```typescript
Response:
[
  {
    id: string
    workspace: {
      id: string
      name: string
      description: string
    }
    invitedBy: {
      name: string
      email: string
    }
    createdAt: string
    expiresAt: string
  }
]
```

### 6. Accept Invitation
**POST** `/api/invitations/[token]/accept`

```typescript
Response:
{
  success: true
  workspace: {
    id: string
    name: string
  }
}
```

### 7. Decline Invitation
**POST** `/api/invitations/[token]/decline`

```typescript
Response:
{
  success: true
}
```

### 8. Validate Invitation Token
**GET** `/api/invitations/[token]/validate`

```typescript
Response:
{
  valid: boolean
  workspace?: {
    id: string
    name: string
    description: string
  }
  invitedBy?: {
    name: string
  }
  expiresAt?: string
}
```

---

## Frontend Components

### 1. InviteUserDialog
Location: `src/components/workspaces/invite-user-dialog.tsx`

Features:
- Email input with validation
- Optional message field
- Shows existing invitations for the email
- Prevents duplicate invitations

### 2. InvitationsList
Location: `src/components/workspaces/invitations-list.tsx`

Features:
- Shows all pending/accepted/declined invitations
- Resend button for expired invitations
- Cancel button for pending invitations
- Status badges (color-coded)
- Expiration countdown

### 3. InvitationAcceptPage
Location: `src/app/invitations/[token]/page.tsx`

Features:
- Validates token on load
- Shows workspace details
- Accept/Decline buttons
- Handles expired invitations
- Auto-redirects after acceptance

### 4. PendingInvitationsDropdown
Location: `src/components/notifications/pending-invitations-dropdown.tsx`

Features:
- Shows in navbar (bell icon with badge)
- Lists all pending invitations
- Quick accept/decline actions
- Links to full invitation page

---

## Email Templates

### Invitation Email

```html
Subject: You've been invited to join [Workspace Name]

Hi there,

[Inviter Name] has invited you to join the [Workspace Name] workspace on Task Management App.

[Optional personal message]

Click the button below to accept this invitation:

[Accept Invitation Button] → https://yourapp.com/invitations/[token]

This invitation will expire on [Expiration Date].

If you don't want to join this workspace, you can ignore this email.

---
Task Management Team
```

### Invitation Accepted (to Admin)

```html
Subject: [User Name] accepted your workspace invitation

Hi [Admin Name],

Great news! [User Name] ([User Email]) has accepted your invitation to join [Workspace Name].

They can now collaborate with your team.

[View Workspace] → https://yourapp.com/dashboard/workspaces/[id]

---
Task Management Team
```

---

## Service Layer

### WorkspaceInvitationService

```typescript
class WorkspaceInvitationService {
  // Generate secure token
  static generateToken(): string
  
  // Create invitation
  static async createInvitation(
    workspaceId: string,
    email: string,
    inviterId: string,
    message?: string
  ): Promise<Invitation>
  
  // Send invitation email
  static async sendInvitationEmail(
    invitation: Invitation
  ): Promise<void>
  
  // Get workspace invitations
  static async getWorkspaceInvitations(
    workspaceId: string
  ): Promise<Invitation[]>
  
  // Get user's pending invitations
  static async getUserPendingInvitations(
    email: string
  ): Promise<Invitation[]>
  
  // Validate invitation token
  static async validateToken(
    token: string
  ): Promise<ValidationResult>
  
  // Accept invitation
  static async acceptInvitation(
    token: string,
    userId: string
  ): Promise<Workspace>
  
  // Decline invitation
  static async declineInvitation(
    token: string
  ): Promise<void>
  
  // Resend invitation
  static async resendInvitation(
    invitationId: string
  ): Promise<void>
  
  // Cancel invitation
  static async cancelInvitation(
    invitationId: string,
    adminId: string
  ): Promise<void>
  
  // Clean up expired invitations (cron job)
  static async cleanupExpiredInvitations(): Promise<void>
}
```

---

## User Flow

### Admin Flow (Inviting Users)

```
1. Admin navigates to Workspace → Members Tab
2. Clicks "Invite Member" button
3. InviteUserDialog opens
4. Enters email address (with autocomplete from existing users)
5. (Optional) Adds personal message
6. Clicks "Send Invitation"
7. System:
   - Creates invitation record
   - Generates secure token
   - Sends email to invitee
   - Shows success message
8. Admin can see invitation in "Pending Invitations" section
9. Can resend or cancel invitation
```

### User Flow (Receiving Invitation)

```
1. User receives email
2. Clicks "Accept Invitation" button
3. Redirected to /invitations/[token]
4. If not logged in → Redirected to login/register with return URL
5. After login → Validates token
6. Shows workspace details and inviter info
7. User clicks "Accept" or "Decline"
8. If Accept:
   - User added to workspace
   - Invitation marked as accepted
   - Redirected to workspace page
   - Admin notified via email
9. If Decline:
   - Invitation marked as declined
   - User redirected to dashboard
```

---

## Security Considerations

1. **Token Security**
   - Use crypto.randomBytes(32) for token generation
   - Hash tokens in database (optional for extra security)
   - Single-use tokens (invalidated after acceptance)

2. **Email Verification**
   - Only registered users or valid emails
   - Prevent spam invitations (rate limiting)
   - Check email domain blacklist

3. **Authorization**
   - Only workspace admins can invite
   - Only workspace admins can cancel invitations
   - Users can only accept their own invitations

4. **Expiration**
   - Default: 7 days
   - Auto-cleanup via cron job
   - Clear messaging about expiration

5. **Rate Limiting**
   - Max 10 invitations per workspace per hour
   - Max 3 invitations to same email per day

---

## UI/UX Considerations

### Workspace Members Tab (Updated)

```
┌─────────────────────────────────────────────┐
│ Team Members (5)        [Invite Member]     │
├─────────────────────────────────────────────┤
│                                             │
│ ACTIVE MEMBERS (3)                          │
│ ┌─────────────────────────────────────────┐│
│ │ 👤 John Doe (john@example.com)    ADMIN ││
│ │ 👤 Jane Smith (jane@example.com)  MEMBER││
│ │ 👤 Bob Wilson (bob@example.com)   MEMBER││
│ └─────────────────────────────────────────┘│
│                                             │
│ PENDING INVITATIONS (2)                     │
│ ┌─────────────────────────────────────────┐│
│ │ ✉️  alice@example.com                   ││
│ │     Invited by John • Expires in 3 days ││
│ │     [Resend] [Cancel]                   ││
│ │                                          ││
│ │ ✉️  charlie@example.com                 ││
│ │     Invited by Jane • Expires in 1 day  ││
│ │     [Resend] [Cancel]                   ││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### Navbar Notifications

```
┌──────────────────────────────────┐
│ 🔔 (2)                           │
├──────────────────────────────────┤
│ Workspace Invitations (2)        │
│                                  │
│ ├─ Marketing Team                │
│ │  Invited by John Doe           │
│ │  [Accept] [Decline]            │
│                                  │
│ ├─ Development Team              │
│ │  Invited by Jane Smith         │
│ │  [Accept] [Decline]            │
│                                  │
│ [View All Invitations]           │
└──────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Database Setup
1. Add WorkspaceInvitation model to schema
2. Run migration
3. Update User and Workspace models

### Phase 2: Backend Services
1. Create InvitationService
2. Implement email service integration
3. Create API routes
4. Add validation and security

### Phase 3: Frontend Components
1. Create InviteUserDialog
2. Create InvitationsList
3. Update Members tab
4. Create invitation accept page

### Phase 4: Email Integration
1. Setup email service (Resend, SendGrid, etc.)
2. Create email templates
3. Implement sending logic

### Phase 5: Notifications
1. Add notification dropdown
2. Real-time updates (optional: WebSocket)
3. Badge counts

### Phase 6: Testing & Polish
1. Test all flows
2. Add loading states
3. Error handling
4. Edge cases

---

## Alternative Approaches

### Option 1: Direct Add (Current)
- ✅ Simple and fast
- ✅ No email required
- ❌ Users might not know they were added
- ❌ No consent mechanism

### Option 2: Invitation System (Recommended)
- ✅ User consent
- ✅ Professional workflow
- ✅ Email notifications
- ❌ More complex
- ❌ Requires email service

### Option 3: Hybrid Approach
- Internal users: Direct add
- External users: Invitation system
- Best of both worlds

---

## Cost Considerations

### Email Service Options

1. **Resend** (Recommended)
   - Free tier: 3,000 emails/month
   - $20/month for 50,000 emails
   - Simple API, great deliverability

2. **SendGrid**
   - Free tier: 100 emails/day
   - $15/month for 40,000 emails
   - Enterprise-grade

3. **AWS SES**
   - $0.10 per 1,000 emails
   - Pay-as-you-go
   - Requires AWS setup

4. **Self-hosted (Not Recommended)**
   - Free but complex
   - Deliverability issues
   - Maintenance overhead

---

## Recommended Next Steps

1. **Decide on email service** (Resend is best for startups)
2. **Implement database schema** (15 min)
3. **Create backend service** (2 hours)
4. **Build frontend components** (3 hours)
5. **Setup email templates** (1 hour)
6. **Test thoroughly** (1 hour)

**Total Implementation Time: ~1 day**

---

## Example Code Snippets

### Generate Secure Token
```typescript
import crypto from 'crypto'

function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
```

### Send Invitation Email (Resend)
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendInvitationEmail(invitation: Invitation) {
  await resend.emails.send({
    from: 'noreply@yourapp.com',
    to: invitation.email,
    subject: `You've been invited to join ${invitation.workspace.name}`,
    html: invitationEmailTemplate(invitation)
  })
}
```

### Validate Token
```typescript
async function validateToken(token: string) {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: { workspace: true, inviter: true }
  })
  
  if (!invitation) return { valid: false }
  if (invitation.status !== 'PENDING') return { valid: false }
  if (new Date() > invitation.expiresAt) {
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' }
    })
    return { valid: false }
  }
  
  return { valid: true, invitation }
}
```

---

Would you like me to implement this invitation system for your application?
