# Kanban Board Status Matching Fix

## Problem
Tasks were not showing up in kanban columns when using custom workflows because the matching logic was too rigid.

## Root Cause
- **Default workflows**: Tasks have numeric status (1=Todo, 2=In Progress, 3=Done) and NO customStatus
- **Custom workflows**: Tasks have numeric status AND customStatus field (column title)
- The old matching logic couldn't handle both scenarios

## Solution

### 1. Improved Task Grouping (kanban-board.tsx lines 181-220)

Tasks are now grouped by MULTIPLE keys to ensure they match both default and custom columns:

```typescript
const tasksByStatus = tasks.reduce((acc, task) => {
  const keys: string[] = []

  // Key 1: If task has customStatus, use it
  if (task.customStatus) {
    keys.push(task.customStatus)
  }
  
  // Key 2: Always add numeric status
  keys.push(String(task.status))

  // Key 3: For default tasks, also add common text variations
  if (!task.customStatus) {
    switch (Number(task.status)) {
      case 1:
        keys.push('To Do', 'Todo', 'Backlog')
        break
      case 2:
        keys.push('In Progress', 'In Development')
        break
      case 3:
        keys.push('Done', 'Completed')
        break
    }
  }

  // Add task to all matching groups
  keys.forEach(key => {
    if (!acc[key]) acc[key] = []
    if (!acc[key].some(t => t.id === task.id)) {
      acc[key].push(task)
    }
  })

  return acc
}, {} as Record<string, Task[]>)
```

**Result:** A task with `status: 1` will be found under keys: `"1"`, `"To Do"`, `"Todo"`, `"Backlog"`

### 2. Improved Column Matching (kanban-board.tsx lines 305-328)

Columns now try multiple strategies to find their tasks:

```typescript
// Strategy 1: Match by exact column title (for custom statuses)
columnTasks = tasksByStatus[column.title] || []

// Strategy 2: Match by column ID (for default numeric statuses)
if (columnTasks.length === 0) {
  columnTasks = tasksByStatus[String(column.id)] || []
}

// Strategy 3: For default columns, check common variations
if (columnTasks.length === 0) {
  if (column.title === 'To Do' || column.title === 'Todo') {
    columnTasks = tasksByStatus['1'] || tasksByStatus['To Do'] || ...
  } else if (column.title === 'In Progress') {
    columnTasks = tasksByStatus['2'] || tasksByStatus['In Progress'] || ...
  } else if (column.title === 'Done') {
    columnTasks = tasksByStatus['3'] || tasksByStatus['Done'] || ...
  }
}
```

## How It Works Now

### Scenario 1: User with NO custom workflows (default)
- **Columns:** `[{id: 1, title: "To Do"}, {id: 2, title: "In Progress"}, {id: 3, title: "Done"}]`
- **Tasks:** `{status: 1, customStatus: null}`
- **Matching:**
  - Task grouped under: `"1"`, `"To Do"`, `"Todo"`, `"Backlog"`
  - Column "To Do" searches: `"To Do"` ✅ **MATCH!**

### Scenario 2: User with custom workflows
- **Columns:** `[{id: "uuid-1", title: "Backlog"}, {id: "uuid-2", title: "In Review"}, {id: "uuid-3", title: "Done"}]`
- **Tasks:** `{status: 1, customStatus: "Backlog"}`
- **Matching:**
  - Task grouped under: `"Backlog"`, `"1"`
  - Column "Backlog" searches: `"Backlog"` ✅ **MATCH!**

### Scenario 3: Mixed workflow (custom + default columns)
- **Columns:** `[{id: 1, title: "To Do"}, {id: "uuid-2", title: "Code Review"}, {id: 3, title: "Done"}]`
- **Task 1:** `{status: 1, customStatus: null}` → Shows in "To Do" ✅
- **Task 2:** `{status: 2, customStatus: "Code Review"}` → Shows in "Code Review" ✅
- **Task 3:** `{status: 3, customStatus: null}` → Shows in "Done" ✅

## Testing Checklist

- [ ] Create task with default workflow → task appears in correct column
- [ ] Create task with custom workflow → task appears in correct column
- [ ] Drag task between default columns → task moves correctly
- [ ] Drag task between custom columns → task moves correctly
- [ ] Switch from default to custom workflow → tasks still visible
- [ ] Switch from custom to default workflow → tasks still visible
- [ ] User with no workflows created → default board works
- [ ] User with multiple workflows → switching works

## Files Modified
1. `src/components/tasks/kanban-board.tsx` (lines 181-328)
   - Improved task grouping logic
   - Improved column matching logic
   - Added support for common status name variations

## Migration Notes
- **No database changes required**
- **No API changes required**
- **Backward compatible** - existing tasks work without modification
- Users can continue using default workflows without creating custom ones

## Future Improvements
1. Add admin setting to rename default column titles ("To Do" → "Backlog")
2. Add database migration to backfill customStatus for existing tasks
3. Add UI indicator showing which matching strategy was used (for debugging)
4. Add column aliases in workflow settings
