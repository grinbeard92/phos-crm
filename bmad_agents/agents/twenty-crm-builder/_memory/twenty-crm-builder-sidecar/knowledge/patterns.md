# Twenty CRM Architecture Patterns

Reusable patterns, best practices, and gotchas for Twenty CRM development.

## Module Creation Patterns

### Backend Module Structure
```
packages/twenty-server/src/engine/core-modules/{module-name}/
├── {module-name}.module.ts          # NestJS module
├── {module-name}.resolver.ts        # GraphQL resolver
├── services/
│   └── {module-name}.service.ts     # Business logic
├── dtos/
│   ├── {input}.dto.ts              # Input types
│   └── {output}.dto.ts             # Output types
└── entities/
    └── {entity}.entity.ts          # TypeORM entity
```

### Frontend Module Structure
```
packages/twenty-front/src/modules/{module-name}/
├── components/                      # React components
├── hooks/                          # Custom hooks
├── states/                         # Recoil atoms/selectors
├── types/                          # TypeScript types
├── graphql/                        # GraphQL queries/mutations
└── utils/                          # Helper functions
```

## Data Model Patterns

### Custom Object Creation
1. Create TypeORM entity in `packages/twenty-server/src/engine/core-modules/{module}/entities/`
2. Define GraphQL object type in resolver
3. Generate migration: `npx nx run twenty-server:typeorm migration:generate`
4. Create frontend types from GraphQL schema
5. Update GraphQL codegen

### Relationship Patterns
- **One-to-Many**: Use `@OneToMany` and `@ManyToOne` decorators
- **Many-to-Many**: Use junction table with explicit entity
- **Cascade Rules**: Consider `onDelete: 'CASCADE'` carefully
- **Lazy Loading**: Prefer explicit loading over lazy for performance

## GraphQL Patterns

### Schema Evolution
- Add fields with default values or nullable
- Deprecate before removing (use `@deprecated`)
- Version APIs for breaking changes
- Use interfaces for polymorphism

### Resolver Best Practices
- Use DataLoader for N+1 prevention
- Implement proper error handling
- Add field-level authorization
- Cache frequently accessed data

## Migration Patterns

### Safe Migration Template
```typescript
export class MigrationName1234567890 implements MigrationInterface {
  name = 'MigrationName1234567890'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Forward migration
    await queryRunner.query(`...`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback - ALWAYS implement
    await queryRunner.query(`...`)
  }
}
```

### Migration Gotchas
- Test rollback before committing
- Never modify existing migrations
- Use transactions for multi-step changes
- Check for data before dropping columns

## Integration Patterns

### Third-Party API Integration Template
```typescript
// Service wrapper with error handling
@Injectable()
export class {Service}IntegrationService {
  async callApi(params) {
    try {
      // Retry logic
      // Rate limiting
      // Error transformation
    } catch (error) {
      // Defensive error handling
    }
  }
}
```

### Integration Checklist
- [ ] API key/OAuth configuration
- [ ] Retry logic with exponential backoff
- [ ] Rate limit handling
- [ ] Error transformation to Twenty format
- [ ] Webhook handling (if applicable)
- [ ] Test with mocked responses

## View Configuration Patterns

### Table View
- Define columns with field mappings
- Implement filters with GraphQL where clauses
- Add sorting with order by
- Pagination with cursor-based approach

### Kanban Board
- Group by status/category field
- Drag-and-drop updates
- Optimistic UI updates
- Sync with backend state

### Dashboard Widget
- Aggregate data in backend
- Use Redis for caching
- Real-time updates via subscriptions
- Responsive design with Emotion

## Testing Patterns

### Unit Test Template
```typescript
describe('{Service}', () => {
  let service: {Service}

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [{Service}]
    }).compile()

    service = module.get({Service})
  })

  it('should ...', () => {
    // Test implementation
  })
})
```

### Integration Test Pattern
- Reset database before each test
- Use test fixtures
- Mock external services
- Clean up after tests

## Performance Patterns

### Database Optimization
- Add indexes for frequently queried fields
- Use select to limit returned columns
- Batch operations when possible
- Monitor query performance

### Frontend Optimization
- Use React.memo for expensive components
- Implement virtualization for long lists
- Optimize Recoil selectors
- Lazy load routes and components

## Common Gotchas

### TypeORM
- Circular dependencies between entities
- Missing migrations after entity changes
- Lazy vs eager loading confusion
- Transaction isolation levels

### GraphQL
- N+1 query problems
- Overfetching without field limitation
- Resolver complexity causing timeouts
- Cache invalidation issues

### React/Recoil
- State updates causing re-renders
- Stale closures in hooks
- Recoil selector dependencies
- Emotion style performance

## Best Practices

1. **Always write migrations down() methods**
2. **Test GraphQL schema changes with existing clients**
3. **Use TypeScript strictly (no 'any')**
4. **Follow Twenty naming conventions**
5. **Document complex business logic**
6. **Add tests before pushing**
7. **Update this file when discovering new patterns**

---

## Pattern Updates Log

<!-- Add new patterns here as they're discovered -->

### [Date] - [Pattern Name]
- **Context**: [When/why this pattern emerged]
- **Implementation**: [How it works]
- **Benefits**: [Why use this]
- **Gotchas**: [What to watch out for]
