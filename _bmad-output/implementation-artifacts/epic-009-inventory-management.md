# Epic 009: Inventory Management

**Epic ID**: EPIC-009
**Phase**: Phase 6+ (Future)
**Priority**: P2 (Low - Future Enhancement)
**Status**: Placeholder - Not Started
**Owner**: TBD
**Created**: 2026-01-28
**Target Completion**: TBD

---

## Epic Overview

Build inventory management capabilities to track products, parts, and equipment. Integrates with quoting and invoicing systems to enable product-based line items, stock tracking, and reorder alerts.

**Note**: This is a placeholder epic for future development. Implementation will begin after core quoting/billing (Epic 002) and expense tracking (Epic 004) are complete.

---

## Business Value

- Track inventory of parts, equipment, and products
- Enable product catalog for quick quote/invoice line item selection
- Monitor stock levels with low-stock alerts
- Track inventory costs for profitability analysis
- Support serialized items (equipment with serial numbers)
- Enable purchase order creation for restocking

---

## Success Criteria

- [ ] Can create and manage product/item catalog
- [ ] Can track inventory quantities and locations
- [ ] Can select products when creating quote/invoice line items
- [ ] Low-stock alerts notify appropriate team members
- [ ] Can track serialized items (equipment, assets)
- [ ] Inventory value calculations accurate
- [ ] Integration with quoting system (auto-populate pricing)
- [ ] Integration with invoicing system (deduct stock on invoice)

---

## Data Model (Preliminary)

### InventoryItem (Custom Object)

```typescript
{
  nameSingular: 'inventoryItem',
  namePlural: 'inventoryItems',
  labelSingular: 'Inventory Item',
  labelPlural: 'Inventory Items',
  icon: 'IconPackage',
  fields: [
    // Basic Info
    { name: 'sku', type: 'TEXT', label: 'SKU', unique: true },
    { name: 'description', type: 'RICH_TEXT', label: 'Description' },
    { name: 'category', type: 'RELATION', target: 'inventoryCategory' },

    // Pricing
    { name: 'unitCost', type: 'CURRENCY', label: 'Unit Cost' },
    { name: 'unitPrice', type: 'CURRENCY', label: 'Sell Price' },
    { name: 'marginPercentage', type: 'NUMBER', label: 'Margin %' }, // Computed

    // Stock
    { name: 'quantityOnHand', type: 'NUMBER', label: 'Qty on Hand' },
    { name: 'quantityReserved', type: 'NUMBER', label: 'Qty Reserved' },
    { name: 'quantityAvailable', type: 'NUMBER', label: 'Qty Available' }, // Computed
    { name: 'reorderPoint', type: 'NUMBER', label: 'Reorder Point' },
    { name: 'reorderQuantity', type: 'NUMBER', label: 'Reorder Qty' },

    // Tracking
    { name: 'isSerialized', type: 'BOOLEAN', label: 'Track Serial Numbers' },
    { name: 'isActive', type: 'BOOLEAN', label: 'Active', default: true },
    { name: 'location', type: 'TEXT', label: 'Storage Location' },

    // Vendor
    { name: 'preferredVendor', type: 'RELATION', target: 'company' },
    { name: 'vendorSku', type: 'TEXT', label: 'Vendor SKU' },
  ]
}
```

### InventoryCategory (Custom Object)

```typescript
{
  nameSingular: 'inventoryCategory',
  namePlural: 'inventoryCategories',
  labelSingular: 'Inventory Category',
  labelPlural: 'Inventory Categories',
  icon: 'IconCategory',
  fields: [
    { name: 'description', type: 'TEXT' },
    { name: 'parentCategory', type: 'RELATION', target: 'inventoryCategory' },
    { name: 'color', type: 'TEXT', label: 'Color Code' },
  ]
}
```

### SerializedItem (Custom Object)

```typescript
{
  nameSingular: 'serializedItem',
  namePlural: 'serializedItems',
  labelSingular: 'Serialized Item',
  labelPlural: 'Serialized Items',
  icon: 'IconBarcode',
  fields: [
    { name: 'serialNumber', type: 'TEXT', unique: true },
    { name: 'inventoryItem', type: 'RELATION', target: 'inventoryItem' },
    { name: 'status', type: 'SELECT', options: [
      { label: 'In Stock', value: 'IN_STOCK' },
      { label: 'Reserved', value: 'RESERVED' },
      { label: 'Sold', value: 'SOLD' },
      { label: 'On Loan', value: 'ON_LOAN' },
      { label: 'Damaged', value: 'DAMAGED' },
      { label: 'Retired', value: 'RETIRED' },
    ]},
    { name: 'purchaseDate', type: 'DATE' },
    { name: 'purchaseCost', type: 'CURRENCY' },
    { name: 'warrantyExpiry', type: 'DATE' },
    { name: 'customer', type: 'RELATION', target: 'company' }, // If sold/loaned
    { name: 'invoice', type: 'RELATION', target: 'invoice' },  // Sale record
    { name: 'notes', type: 'TEXT' },
  ]
}
```

### InventoryTransaction (Custom Object)

```typescript
{
  nameSingular: 'inventoryTransaction',
  namePlural: 'inventoryTransactions',
  labelSingular: 'Inventory Transaction',
  labelPlural: 'Inventory Transactions',
  icon: 'IconArrowsExchange',
  fields: [
    { name: 'inventoryItem', type: 'RELATION', target: 'inventoryItem' },
    { name: 'transactionType', type: 'SELECT', options: [
      { label: 'Received', value: 'RECEIVED' },
      { label: 'Sold', value: 'SOLD' },
      { label: 'Adjustment', value: 'ADJUSTMENT' },
      { label: 'Transfer', value: 'TRANSFER' },
      { label: 'Return', value: 'RETURN' },
      { label: 'Damaged', value: 'DAMAGED' },
    ]},
    { name: 'quantity', type: 'NUMBER' },
    { name: 'unitCost', type: 'CURRENCY' },
    { name: 'totalCost', type: 'CURRENCY' },
    { name: 'reference', type: 'TEXT' }, // PO#, Invoice#, etc.
    { name: 'invoice', type: 'RELATION', target: 'invoice' },
    { name: 'notes', type: 'TEXT' },
  ]
}
```

---

## User Stories (Preliminary)

### Story 9.1: Create Inventory Item Catalog
**Estimate**: 4 hours | **Priority**: P0

- CRUD for inventory items
- Category management
- Bulk import from CSV
- Search and filter

### Story 9.2: Build Stock Tracking System
**Estimate**: 6 hours | **Priority**: P0

- Track quantity on hand
- Record inventory transactions
- Calculate available quantity (on hand - reserved)
- Stock adjustment workflow

### Story 9.3: Integrate with Quoting System
**Estimate**: 4 hours | **Priority**: P0

- Product picker in quote line item editor
- Auto-populate unit price from catalog
- Show available quantity in picker
- Reserve stock when quote sent

### Story 9.4: Integrate with Invoicing System
**Estimate**: 4 hours | **Priority**: P0

- Deduct inventory when invoice marked paid
- Create inventory transaction record
- Link invoice line items to inventory items
- Handle partial shipments

### Story 9.5: Build Low-Stock Alerts
**Estimate**: 3 hours | **Priority**: P1

- Check stock levels against reorder points
- Send notifications to designated users
- Dashboard widget for low-stock items
- Configurable alert thresholds

### Story 9.6: Implement Serialized Item Tracking
**Estimate**: 5 hours | **Priority**: P1

- Track items by serial number
- Status workflow (In Stock → Reserved → Sold)
- Link serialized items to customers
- Warranty tracking

### Story 9.7: Build Inventory Dashboard
**Estimate**: 4 hours | **Priority**: P1

- Total inventory value
- Stock level charts
- Low-stock alerts list
- Recent transactions
- Category breakdown

### Story 9.8: Create Purchase Order System
**Estimate**: 6 hours | **Priority**: P2

- Create POs for restocking
- Link to preferred vendors
- Track PO status (Draft → Sent → Received)
- Auto-receive into inventory

---

## Integration Points

### Quote Integration (Epic 002)
- Product picker in line item editor
- Auto-populate pricing from catalog
- Show stock availability
- Optional: Reserve stock when quote created

### Invoice Integration (Epic 002)
- Deduct stock when invoice paid/shipped
- Create inventory transaction
- Track cost of goods sold
- Support serialized item selection

### Expense Integration (Epic 004)
- Link inventory purchases to expenses
- Track landed cost (purchase + shipping + duties)
- Vendor payment tracking

### Stripe Integration (Epic 003)
- Sync products to Stripe for payment links
- Handle inventory for Stripe invoices

---

## Technical Considerations

### Stock Calculation
```typescript
// Atomic stock updates to prevent race conditions
async updateStock(itemId: string, quantityChange: number, transactionType: string) {
  return this.dataSource.transaction(async (manager) => {
    // Lock row for update
    const item = await manager.findOne(InventoryItem, {
      where: { id: itemId },
      lock: { mode: 'pessimistic_write' },
    });

    // Update quantity
    item.quantityOnHand += quantityChange;

    // Create transaction record
    await manager.save(InventoryTransaction, {
      inventoryItem: item,
      transactionType,
      quantity: quantityChange,
      // ...
    });

    return manager.save(item);
  });
}
```

### Reorder Point Monitoring
```typescript
// Cron job to check stock levels
@Cron('0 8 * * *') // Daily at 8 AM
async checkReorderPoints() {
  const lowStockItems = await this.inventoryRepo.find({
    where: {
      quantityOnHand: LessThanOrEqual(Raw('reorderPoint')),
      isActive: true,
    },
  });

  for (const item of lowStockItems) {
    await this.notificationService.sendLowStockAlert(item);
  }
}
```

---

## Dependencies

- **Blocked By**:
  - Epic 002 (Quoting & Billing) - Integration with line items
  - Epic 004 (Expense Tracking) - Link to purchase expenses

- **Blocks**: None (enhancement epic)

---

## Feature Flags

```typescript
IS_INVENTORY_MANAGEMENT_ENABLED = 'IS_INVENTORY_MANAGEMENT_ENABLED'
```

---

## Notes

This epic is a **future enhancement** for businesses that sell physical products or need to track equipment/assets. For service-based businesses like Phos Industries (consulting), this may be lower priority initially.

**Potential Phos Use Cases**:
- Track laser equipment on loan to clients
- Manage spare parts inventory
- Track demo equipment assignments

**Implementation Timing**: After core CRM functionality (Epics 000-005) is stable and in production use.
