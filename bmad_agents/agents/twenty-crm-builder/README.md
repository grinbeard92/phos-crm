# twenty-crm-builder-sidecar

This folder stores persistent memory for the **CRM-Forge** Expert agent.

## Purpose

Maintains context across sessions by storing:
- Implementation memories (past features, configurations, decisions)
- Operational instructions and boundaries
- Twenty CRM architecture patterns and best practices

## Files

- **memories.md**: Session history, user preferences, past implementations, configuration decisions
- **instructions.md**: Startup protocols, operational guidelines, domain boundaries
- **knowledge/patterns.md**: Twenty-specific architectural patterns, best practices, gotchas

## Runtime Access

After BMAD installation, this folder will be accessible at:
`{project-root}/_bmad/_memory/twenty-crm-builder-sidecar/`

All agent references use this runtime path format.

## Build vs Runtime Locations

- **Build location** (during agent creation): `_bmad-output/bmb-creations/twenty-crm-builder/twenty-crm-builder-sidecar/`
- **Runtime location** (after BMAD installation): `{project-root}/_bmad/_memory/twenty-crm-builder-sidecar/`

The BMAD installer copies this folder from build location to runtime location.
