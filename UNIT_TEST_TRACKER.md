# Unit Test Tracker - Bulldogs Market

## Overview
This document provides a comprehensive unit test tracking system for the Bulldogs Market application. It covers all 5 core modules with detailed test cases, scenarios, and validation requirements.

---

## USER REGISTRATION MODULE

### Authentication Component Tests

**Test Case: AUTH-001 - Student Registration with Valid AAMU Email**
- **Description**: Verify student can register with valid @aamu.edu email
- **Test Steps**: 
  - Navigate to registration page
  - Select "Student" role
  - Enter valid @aamu.edu email
  - Enter password meeting requirements
  - Submit registration form
- **Expected Result**: User created successfully, redirected to browse page
- **Validation**: Firebase Auth user created, user profile in Firestore with student role

**Test Case: AUTH-002 - Student Registration with Invalid Email Domain**
- **Description**: Prevent registration with non-AAMU email for students
- **Test Steps**:
  - Select "Student" role
  - Enter non-@aamu.edu email
  - Attempt registration
- **Expected Result**: Form validation error displayed
- **Validation**: No user created in Firebase Auth

**Test Case: AUTH-003 - Admin Registration Process**
- **Description**: Verify admin registration with any valid email
- **Test Steps**:
  - Select "Staff" role
  - Enter any valid email
  - Complete registration
- **Expected Result**: Admin user created, redirected to admin dashboard
- **Validation**: User profile with admin role in Firestore

**Test Case: AUTH-004 - Password Strength Validation**
- **Description**: Ensure password meets minimum requirements
- **Test Steps**:
  - Enter password less than 6 characters
  - Attempt registration
- **Expected Result**: Password validation error
- **Validation**: Form prevents submission

**Test Case: AUTH-005 - Duplicate Email Registration**
- **Description**: Prevent multiple accounts with same email
- **Test Steps**:
  - Register with existing email
  - Attempt duplicate registration
- **Expected Result**: "Email already in use" error
- **Validation**: Firebase Auth rejects duplicate

**Test Case: AUTH-006 - Login with Correct Credentials**
- **Description**: Verify successful login with valid credentials
- **Test Steps**:
  - Enter registered email and password
  - Submit login form
- **Expected Result**: Successful authentication, role-based redirect
- **Validation**: Firebase Auth session established

**Test Case: AUTH-007 - Login with Invalid Credentials**
- **Description**: Handle incorrect login attempts
- **Test Steps**:
  - Enter wrong password
  - Attempt login
- **Expected Result**: Authentication error displayed
- **Validation**: No session created

**Test Case: AUTH-008 - Role-Based Redirect After Login**
- **Description**: Verify correct page redirect based on user role
- **Test Steps**:
  - Student login → redirect to /browse
  - Admin login → redirect to /admin/dashboard
- **Expected Result**: Correct page navigation
- **Validation**: Router pushes to correct path

**Test Case: AUTH-009 - Password Reset Flow**
- **Description**: Test password recovery functionality
- **Test Steps**:
  - Click "Forgot password"
  - Enter registered email
  - Submit reset request
- **Expected Result**: Reset email sent confirmation
- **Validation**: Firebase password reset email triggered

**Test Case: AUTH-010 - Session Persistence**
- **Description**: Verify user session persists across page reloads
- **Test Steps**:
  - Login successfully
  - Refresh page
  - Check if still authenticated
- **Expected Result**: User remains logged in
- **Validation**: Firebase Auth state persists

---

## STUDENT SHOPPING MODULE

### Item Browsing Tests

**Test Case: SHOP-001 - Display Available Items**
- **Description**: Load and display all available items from Firestore
- **Test Steps**: Navigate to browse page
- **Expected Result**: All items with quantity > 0 displayed
- **Validation**: Firestore items collection queried successfully

**Test Case: SHOP-002 - Search Functionality**
- **Description**: Filter items by search query
- **Test Steps**:
  - Enter search term in search bar
  - Verify filtered results
- **Expected Result**: Only matching items displayed
- **Validation**: Search filters by name and description

**Test Case: SHOP-003 - Category Filtering**
- **Description**: Filter items by category tabs
- **Test Steps**:
  - Click different category tabs
  - Verify category-specific items
- **Expected Result**: Only items from selected category shown
- **Validation**: Category filter applied correctly

**Test Case: SHOP-004 - Out of Stock Item Display**
- **Description**: Properly display out of stock items
- **Test Steps**: View items with quantity = 0
- **Expected Result**: Out of stock label and disabled add button
- **Validation**: Quantity validation working

### Shopping Cart Tests

**Test Case: SHOP-005 - Add Item to Cart**
- **Description**: Add available item to shopping cart
- **Test Steps**:
  - Click "Add to Cart" on available item
  - Verify cart updates
- **Expected Result**: Item added to cart, cart count increases
- **Validation**: LocalStorage cart updated

**Test Case: SHOP-006 - Cart Limit Enforcement**
- **Description**: Prevent adding more than 3 items total
- **Test Steps**:
  - Add 3 items to cart
  - Attempt to add 4th item
- **Expected Result**: Error message, item not added
- **Validation**: Cart limit validation working

**Test Case: SHOP-007 - Quantity Management in Cart**
- **Description**: Update item quantities in cart
- **Test Steps**:
  - Add item to cart
  - Increase/decrease quantity
- **Expected Result**: Quantity updates, total recalculates
- **Validation**: LocalStorage reflects changes

**Test Case: SHOP-008 - Remove Item from Cart**
- **Description**: Remove items from shopping cart
- **Test Steps**:
  - Add item to cart
  - Click remove button
- **Expected Result**: Item removed, cart updated
- **Validation**: LocalStorage cart modified

**Test Case: SHOP-009 - Cart Persistence**
- **Description**: Cart data persists across sessions
- **Test Steps**:
  - Add items to cart
  - Refresh page
  - Verify cart contents
- **Expected Result**: Cart items preserved
- **Validation**: LocalStorage data intact

**Test Case: SHOP-010 - Empty Cart State**
- **Description**: Display appropriate empty cart message
- **Test Steps**: Navigate to cart with no items
- **Expected Result**: Empty cart UI with browse button
- **Validation**: Empty state component renders correctly

---

## ORDER PROCESSING MODULE

### Order Creation Tests

**Test Case: ORDER-001 - Create Order with Sufficient Tokens**
- **Description**: Successful order creation with adequate tokens
- **Test Steps**:
  - Add items to cart
  - Select pickup time
  - Checkout with sufficient tokens
- **Expected Result**: Order created, tokens deducted
- **Validation**: Order document in Firestore, user token balance updated

**Test Case: ORDER-002 - Order Creation with Insufficient Tokens**
- **Description**: Prevent order creation with insufficient tokens
- **Test Steps**:
  - Attempt checkout with 0 tokens
  - Verify error handling
- **Expected Result**: Error message, order not created
- **Validation**: Token validation prevents order creation

**Test Case: ORDER-003 - Inventory Deduction on Order**
- **Description**: Reduce item quantities when order placed
- **Test Steps**:
  - Checkout with items
  - Verify inventory updated
- **Expected Result**: Item quantities reduced in Firestore
- **Validation**: Items collection quantities decreased

**Test Case: ORDER-004 - Pickup Time Validation**
- **Description**: Require pickup time selection
- **Test Steps**: Attempt checkout without pickup time
- **Expected Result**: Validation error, order not created
- **Validation**: Pickup time required field

**Test Case: ORDER-005 - Order Confirmation Email**
- **Description**: Send order confirmation email
- **Test Steps**: Complete successful order
- **Expected Result**: Email sent with order details
- **Validation**: Email function called with correct parameters

### Order Status Management Tests

**Test Case: ORDER-006 - Order Status Updates**
- **Description**: Admin can update order status
- **Test Steps**:
  - Admin changes order status (pending → ready → completed)
  - Verify status updates
- **Expected Result**: Order status changes in Firestore
- **Validation**: Orders collection status field updated

**Test Case: ORDER-007 - Order Cancellation by Student**
- **Description**: Student can cancel pending orders
- **Test Steps**:
  - Student cancels order
  - Verify token refund and inventory restoration
- **Expected Result**: Order cancelled, tokens refunded, items returned to inventory
- **Validation**: Multiple Firestore updates completed

**Test Case: ORDER-008 - Order History Display**
- **Description**: Students can view their order history
- **Test Steps**: Navigate to orders page
- **Expected Result**: All user orders displayed chronologically
- **Validation**: Firestore query for user-specific orders

**Test Case: ORDER-009 - Admin Order Management**
- **Description**: Admins can view all orders
- **Test Steps**: Admin navigates to orders page
- **Expected Result**: All system orders displayed
- **Validation**: Firestore query without user filter

**Test Case: ORDER-010 - Order Notifications**
- **Description**: Notifications sent on order status changes
- **Test Steps**: Update order status
- **Expected Result**: Notification created for user
- **Validation**: Notifications collection updated

---

## TOKEN MANAGEMENT MODULE

### Token Request Tests

**Test Case: TOKEN-001 - Submit Token Request**
- **Description**: Student can request additional tokens
- **Test Steps**:
  - Navigate to token request page
  - Enter reason and token amount
  - Submit request
- **Expected Result**: Token request created with pending status
- **Validation**: TokenRequests collection document created

**Test Case: TOKEN-002 - Token Request Validation**
- **Description**: Validate token request inputs
- **Test Steps**: Submit request without reason or amount
- **Expected Result**: Form validation errors
- **Validation**: Required fields enforced

**Test Case: TOKEN-003 - Admin Token Request Review**
- **Description**: Admin can view pending token requests
- **Test Steps**: Admin navigates to token requests page
- **Expected Result**: All pending requests displayed
- **Validation**: Firestore query for pending status

**Test Case: TOKEN-004 - Approve Token Request**
- **Description**: Admin can approve token requests
- **Test Steps**:
  - Admin approves request
  - Verify token balance update
- **Expected Result**: User token balance increased, request status updated
- **Validation**: Multiple Firestore updates completed

**Test Case: TOKEN-005 - Reject Token Request**
- **Description**: Admin can reject token requests
- **Test Steps**: Admin rejects request
- **Expected Result**: Request status updated to rejected
- **Validation**: TokenRequests collection updated

**Test Case: TOKEN-006 - Token Request Notifications**
- **Description**: Notifications sent on request decisions
- **Test Steps**: Admin approves/rejects request
- **Expected Result**: Student receives notification
- **Validation**: Notifications collection updated

### Token Balance Tests

**Test Case: TOKEN-007 - Initial Token Allocation**
- **Description**: Students start with 3 tokens
- **Test Steps**: New student registration
- **Expected Result**: Student profile has tokenBalance = 3
- **Validation**: User document created with initial tokens

**Test Case: TOKEN-008 - Token Deduction on Order**
- **Description**: Tokens deducted when order placed
- **Test Steps**: Student places order
- **Expected Result**: Token balance reduced by order item count
- **Validation**: User tokenBalance field updated

**Test Case: TOKEN-009 - Weekly Token Reset**
- **Description**: Admin can reset all student tokens to 3
- **Test Steps**: Admin triggers weekly reset
- **Expected Result**: All student token balances reset to 3
- **Validation**: All student user documents updated

**Test Case: TOKEN-010 - Token Balance Display**
- **Description**: Users can view current token balance
- **Test Steps**: Check user profile or cart
- **Expected Result**: Current token balance displayed
- **Validation**: User tokenBalance field queried correctly

---

## ADMIN INVENTORY MANAGEMENT MODULE

### Inventory CRUD Tests

**Test Case: INVENTORY-001 - Add New Item**
- **Description**: Admin can add new items to inventory
- **Test Steps**:
  - Admin navigates to inventory page
  - Fills item form (name, description, category, quantity, image)
  - Submits form
- **Expected Result**: New item created in Firestore
- **Validation**: Items collection document created

**Test Case: INVENTORY-002 - Edit Existing Item**
- **Description**: Admin can modify item details
- **Test Steps**:
  - Select item to edit
  - Update fields
  - Save changes
- **Expected Result**: Item updated in Firestore
- **Validation**: Items collection document modified

**Test Case: INVENTORY-003 - Delete Item**
- **Description**: Admin can remove items from inventory
- **Test Steps**: Delete item from inventory
- **Expected Result**: Item removed from Firestore
- **Validation**: Items collection document deleted

**Test Case: INVENTORY-004 - Image Upload for Items**
- **Description**: Upload and store item images
- **Test Steps**: Add item with image upload
- **Expected Result**: Image stored in Firebase Storage, URL in item document
- **Validation**: Firebase Storage file created, URL saved

**Test Case: INVENTORY-005 - Category Management**
- **Description**: Items properly categorized
- **Test Steps**: Create items with different categories
- **Expected Result**: Items display in correct category filters
- **Validation**: Category field used in filtering

### Stock Monitoring Tests

**Test Case: INVENTORY-006 - Low Stock Detection**
- **Description**: System detects low stock items (quantity ≤ 5)
- **Test Steps**: Item quantity drops to 5 or below
- **Expected Result**: Low stock flag in UI
- **Validation**: Quantity comparison working

**Test Case: INVENTORY-007 - Out of Stock Detection**
- **Description**: System detects out of stock items
- **Test Steps**: Item quantity reaches 0
- **Expected Result**: Out of stock status, disabled ordering
- **Validation**: Quantity validation working

**Test Case: INVENTORY-008 - Low Stock Notifications**
- **Description**: Admins notified of low stock items
- **Test Steps**: Item quantity becomes low
- **Expected Result**: Notification created for admins
- **Validation**: Notifications collection updated

**Test Case: INVENTORY-009 - Inventory Display**
- **Description**: Proper inventory listing with stock levels
- **Test Steps**: View inventory page
- **Expected Result**: All items displayed with current quantities
- **Validation**: Firestore items collection queried

**Test Case: INVENTORY-010 - Inventory Search and Filter**
- **Description**: Search and filter inventory items
- **Test Steps**: Use search and category filters
- **Expected Result**: Filtered inventory results
- **Validation**: Search and filter logic working

---

## INTEGRATION AND EDGE CASE TESTS

### Cross-Module Integration Tests

**Test Case: INTEGRATION-001 - Complete User Journey**
- **Description**: End-to-end test of complete user flow
- **Test Steps**:
  - Register as student
  - Browse items
  - Add to cart
  - Checkout with tokens
  - View order history
- **Expected Result**: All steps complete successfully
- **Validation**: Full system integration working

**Test Case: INTEGRATION-002 - Admin Management Flow**
- **Description**: Complete admin management workflow
- **Test Steps**:
  - Login as admin
  - Manage inventory
  - Process orders
  - Handle token requests
  - View dashboard
- **Expected Result**: All admin functions working
- **Validation**: Admin role permissions working

**Test Case: INTEGRATION-003 - Concurrent Operations**
- **Description**: Handle multiple simultaneous operations
- **Test Steps**: Multiple users browsing, adding to cart simultaneously
- **Expected Result**: System handles concurrency without data corruption
- **Validation**: Firestore transactions working correctly

### Error Handling and Edge Cases

**Test Case: EDGE-001 - Network Failure Handling**
- **Description**: Graceful handling of network failures
- **Test Steps**: Simulate network disconnection during operations
- **Expected Result**: Appropriate error messages, no data corruption
- **Validation**: Error boundaries and fallbacks working

**Test Case: EDGE-002 - Firestore Security Rules**
- **Description**: Verify security rules prevent unauthorized access
- **Test Steps**: Attempt unauthorized operations
- **Expected Result**: Security rules block unauthorized access
- **Validation**: Firebase security rules enforced

**Test Case: EDGE-003 - Data Consistency**
- **Description**: Ensure data consistency across collections
- **Test Steps**: Verify related data matches (user orders, inventory updates)
- **Expected Result**: All related data consistent
- **Validation**: Cross-collection data integrity maintained

**Test Case: EDGE-004 - Performance Under Load**
- **Description**: System performance with large datasets
- **Test Steps**: Test with hundreds of items and orders
- **Expected Result**: Acceptable performance, no crashes
- **Validation**: Efficient Firestore queries and pagination

**Test Case: EDGE-005 - Browser Compatibility**
- **Description**: Functionality across different browsers
- **Test Steps**: Test in Chrome, Firefox, Safari, Edge
- **Expected Result**: Consistent functionality across browsers
- **Validation**: Cross-browser compatibility confirmed

---

## TESTING INFRASTRUCTURE

### Test Environment Setup
- **Firebase Emulator Suite**: Local Firestore, Auth, and Storage emulators
- **Test Data**: Pre-populated with sample users, items, and orders
- **Mock Services**: Mock external dependencies (email service, etc.)
- **Test Users**: Pre-configured student and admin test accounts

### Test Execution Strategy
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Cross-module functionality testing
- **End-to-End Tests**: Complete user journey testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Authentication and authorization testing

### Test Automation
- **CI/CD Integration**: Automated test execution
