# Scan2Order System Architecture

This document provides an overview of the Scan2Order system architecture, designed to handle high-volume restaurant ordering with up to 1 million concurrent users.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Client                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐   │
│  │  Customer   │     │    Chef     │     │   QR Generator &    │   │
│  │ Applications│     │  Dashboard  │     │   Admin Console     │   │
│  └──────┬──────┘     └──────┬──────┘     └──────────┬──────────┘   │
│         │                   │                       │              │
└─────────┼───────────────────┼───────────────────────┼──────────────┘
          │                   │                       │
          ▼                   ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Backend Server                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐   │
│  │  RESTful    │     │  WebSocket  │     │     Rate-Limited    │   │
│  │    API      │◄───►│   Server    │     │    Authentication   │   │
│  └──────┬──────┘     └──────┬──────┘     └──────────┬──────────┘   │
│         │                   │                       │              │
│         └───────────────────┼───────────────────────┘              │
│                             │                                      │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │                      Storage Layer                        │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │     │
│  │  │ Restaurant  │  │   Orders    │  │  User Sessions  │    │     │
│  │  │ & Menu Data │  │ Management  │  │  & Auth Store   │    │     │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          │                   │                       │
          ▼                   ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  External Services                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐   │
│  │  WhatsApp   │     │  PostgreSQL │     │  Future Payment     │   │
│  │     API     │     │  Database   │     │     Gateway         │   │
│  └─────────────┘     └─────────────┘     └─────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Client Applications

1. **Customer Applications**
   - Menu browsing interface
   - Cart management
   - Order placement
   - Order tracking/status view
   - Phone verification

2. **Chef Dashboard**
   - Order queue management
   - Order status updates
   - Menu management (activate/deactivate items)

3. **QR Generator & Admin Console**
   - Table QR code generation
   - Restaurant management

### Backend Server

1. **RESTful API**
   - Endpoints for all CRUD operations
   - Tiered rate limiting based on endpoint sensitivity
   - Optimized response handling for high-volume

2. **WebSocket Server**
   - Real-time order updates
   - Chef notifications
   - Customer status updates
   - Connection pooling and dynamic cleanup

3. **Authentication System**
   - Chef login/authentication
   - Session management
   - OTP verification for customers

### Storage Layer

1. **Restaurant & Menu Data**
   - Restaurant information
   - Menu items with categories
   - Table management

2. **Orders Management**
   - Order tracking
   - Order items
   - Status management

3. **User Session & Auth Store**
   - Session storage
   - Authentication data

### External Services

1. **WhatsApp API**
   - Customer notifications
   - Order status updates
   - OTP verification

2. **PostgreSQL Database**
   - Persistent data storage
   - Optimized indexes for high-volume queries

3. **Future Payment Gateway**
   - Payment processing (planned future feature)

## Data Flow

### Customer Order Flow

1. Customer scans QR code at table
2. Frontend loads menu for specific restaurant
3. Customer adds items to cart
4. Customer places order with phone number
5. Order is sent to backend via REST API
6. Backend stores order in database
7. Real-time notification sent to chef via WebSocket
8. Status updates sent to customer via WebSocket and WhatsApp

### Chef Management Flow

1. Chef logs in to dashboard
2. Dashboard connects to WebSocket server for real-time updates
3. Chef receives new orders in real-time
4. Chef updates order status (accepted, ready, etc.)
5. Status changes propagated to customers via WebSocket and WhatsApp
6. Chef can manage menu items (availability, etc.)

## Performance Optimizations

### WebSocket Optimizations

- Connection pooling with Set data structures
- Batched message broadcasting
- Dynamic cleanup intervals based on server load
- Memory-efficient message caching

### Database Optimizations

- Strategic indexes on frequently queried columns
- Composite indexes for common access patterns
- Restaurant-specific query optimizations

### API Rate Limiting

- Tiered rate limiting strategy
- Different limits for different endpoint types
- IP-based tracking with appropriate timeouts

### Memory Management

- Efficient object reuse
- Automatic cleanup of dead connections
- Response truncation for logging

## Scaling Considerations

The system is designed to scale horizontally across multiple instances:

1. **Stateless REST API**: Can be scaled across multiple nodes
2. **WebSocket Clustering**: Can be distributed with sticky sessions
3. **Database Scaling**: Supports read replicas for high-volume queries
4. **Caching Layer**: Can be added for frequently accessed data

This architecture supports scaling to handle up to 1 million concurrent users with appropriate infrastructure.