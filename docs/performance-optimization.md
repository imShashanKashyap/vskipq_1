# Performance Optimization Guide for Scan2Order

This guide outlines the performance optimizations implemented in Scan2Order and provides guidance for maintaining high performance when adding new features or making changes. The system is designed to handle up to 1 million concurrent users.

## Key Performance Metrics

- **Response Time**: Target < 200ms for API requests
- **WebSocket Message Delivery**: Target < 100ms
- **Database Query Time**: Target < 100ms for common queries
- **Memory Usage**: Optimized for minimal footprint
- **Connection Management**: Efficient handling of many simultaneous connections

## Database Optimizations

### Strategic Indexing

The following indexes are critical for performance:

```sql
-- Orders table indexed by restaurant for chef dashboard
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id, status, created_at DESC);

-- Orders table indexed by phone for customer tracking
CREATE INDEX idx_orders_phone_number ON orders(customer_phone, created_at DESC);

-- Menu items indexed by restaurant and category
CREATE INDEX idx_menu_items_restaurant_category ON menu_items(restaurant_id, category);

-- Order items indexed by order ID for efficient order details retrieval
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Users indexed by restaurant for permission checks
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);
```

These indexes are automatically created as part of the database schema in `shared/schema.ts`.

### Query Optimization

- Use explicit column selection (`SELECT column1, column2` instead of `SELECT *`)
- Implement pagination for large result sets
- Use appropriate WHERE clauses that leverage indexes
- Avoid joining too many tables in a single query

Example of an optimized query:

```typescript
// Good: Specific columns, leverages index
const orders = await db
  .select({
    id: orders.id,
    status: orders.status,
    createdAt: orders.createdAt
  })
  .from(orders)
  .where(eq(orders.restaurantId, restaurantId))
  .orderBy(desc(orders.createdAt))
  .limit(50);

// Avoid: Full table scan, returns all columns
const allOrders = await db
  .select()
  .from(orders);
```

## WebSocket Optimizations

### Connection Management

The WebSocket server implements several optimizations:

1. **Dynamic Cleanup**: Adjusts cleanup intervals based on server load
2. **Connection Pooling**: Uses Set data structures for efficient client tracking
3. **Client Activity Tracking**: Monitors last activity time for each client

### Message Broadcasting

Optimized message broadcasting with:

1. **Message Batching**: Processes clients in batches to avoid blocking
2. **Message Caching**: Reuses stringified messages to avoid repeated JSON.stringify
3. **Targeted Delivery**: Sends messages only to relevant clients based on channel

### High-Load Mode

In high-load scenarios (>10k connections), the system automatically:

1. Increases cleanup frequency
2. Reduces logging verbosity
3. Limits secondary channel notifications
4. Processes clients in smaller batches

## API Rate Limiting

Three tiers of rate limits are implemented:

1. **Standard API Rate Limiter**:
   - 120 requests per minute for general API endpoints
   - Prevents abuse while allowing normal operation

2. **Order Creation Limiter**:
   - 20 requests per minute for order creation
   - Protects resource-intensive operations

3. **Authentication Limiter**:
   - 30 requests per 15 minutes for authentication endpoints
   - Prevents credential stuffing attacks

## Memory Management

### Response Handling

- Large response arrays are truncated in logs
- JSON serialization is minimized
- Object reuse is preferred over creation

### Client Tracking

- Uses memory-efficient data structures (Map and Set)
- Implements periodic cleanup of stale data
- Uses weak references where appropriate

## Frontend Optimizations

### Data Fetching

- Implement appropriate caching with TanStack Query
- Use debouncing for frequent updates
- Implement pagination for large data sets

Example:

```typescript
const useOrders = (restaurantId: number) => {
  return useQuery({
    queryKey: ['/api/orders', { restaurantId }],
    queryFn: () => fetchOrders(restaurantId),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // 30 seconds
  });
};
```

### Component Rendering

- Implement memo for expensive components
- Use virtualization for long lists
- Avoid unnecessary re-renders

Example:

```typescript
// Use memo for expensive components
const OrderList = memo(({ orders }: { orders: Order[] }) => {
  return (
    <div>
      {orders.map(order => (
        <OrderItem key={order.id} order={order} />
      ))}
    </div>
  );
});
```

## Adding New Features

When adding new features, consider:

1. **Database Impact**: Will this require new indexes or queries?
2. **Memory Usage**: How will this affect the application's memory footprint?
3. **Connection Volume**: Will this increase the number of WebSocket connections?
4. **Request Frequency**: How often will this endpoint be called?

## Performance Testing

Before deploying major changes:

1. **Load Testing**: Simulate high-volume traffic to measure response times
2. **Memory Profiling**: Monitor memory usage under load
3. **Database Profiling**: Analyze query performance
4. **Connection Stress Testing**: Test WebSocket connection management

## Monitoring Recommendations

For production deployment, monitor:

1. **API Response Times**: Track and alert on slow endpoints
2. **WebSocket Connection Count**: Watch for abnormal growth
3. **Database Query Performance**: Look for slow queries
4. **Memory Usage**: Track memory consumption trends
5. **Error Rates**: Monitor for increased error frequencies

## Performance Checklist

Use this checklist when implementing new features:

- [ ] Database queries use appropriate indexes
- [ ] Large result sets implement pagination
- [ ] WebSocket messages target specific channels 
- [ ] Memory-intensive operations are optimized
- [ ] Rate limiting is applied to new endpoints
- [ ] Frontend components implement appropriate memoization
- [ ] Data fetching has reasonable stale times and refetch intervals

## Conclusion

Performance is a critical aspect of the Scan2Order system. By following these guidelines, the application can maintain high performance even as it scales to handle up to 1 million concurrent users. Always consider performance implications when making changes, and test thoroughly before deploying to production.