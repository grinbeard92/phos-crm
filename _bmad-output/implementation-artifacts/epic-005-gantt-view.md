# Epic 005: Project Management - Gantt View

**Epic ID**: EPIC-005
**Phase**: Phase 5 (Weeks 9-10)
**Priority**: P1 (High)
**Status**: Not Started
**Owner**: TBD
**Target Completion**: Week 10

## Epic Overview

Implement advanced Gantt chart visualization for project planning with task dependencies, drag-and-drop editing, and critical path analysis.

## Success Criteria

- [ ] Functional Gantt chart view for projects
- [ ] Task dependencies visualized
- [ ] Drag-and-drop date editing works
- [ ] Critical path calculated and highlighted
- [ ] Multi-project Gantt view available

## User Stories

### Story 5.1: Create GanttTask Custom Object (2h)
- Fields: name, startDate, endDate, duration, progress, taskType
- Relations: project, assignee, dependencies, parentTask

### Story 5.2: Integrate gantt-task-react Library (4h)
- Install and configure gantt-task-react
- Create wrapper components for Twenty UI
- Style to match Twenty design system

### Story 5.3: Build Gantt View Components (6h)
- GanttViewContainer, GanttChart, GanttTask components
- GanttTimeline (date header), GanttSidebar (task list)
- GanttTaskEditor (edit panel)

### Story 5.4: Add Gantt to View Picker (2h)
- Register ViewType.GANTT
- Add Gantt icon to view switcher
- Gantt-specific view settings

### Story 5.5: Implement Drag-and-Drop Date Editing (4h)
- Drag task bars to change dates
- Update GraphQL on drag end
- Optimistic UI updates

### Story 5.6: Add Task Dependency Visualization (4h)
- Dependency lines between tasks
- Predecessor/successor relationships
- Validation: prevent circular dependencies

### Story 5.7: Build Critical Path Calculation (4h)
- Identify critical path (longest task chain)
- Highlight critical tasks in red
- Show slack time for non-critical tasks

### Story 5.8: Implement Multi-Project Gantt View (3h)
- View multiple projects on one timeline
- Color-code by project
- Filter by project, assignee, date range

## Technical Notes

**Library**: gantt-task-react (MIT license)

**Location**: `/packages/twenty-front/src/modules/views/components/GanttView/`

**GraphQL**: Use existing record system, no backend changes needed

---

## Dependencies

- **Blocked By**: Epic 001 (Project object)
