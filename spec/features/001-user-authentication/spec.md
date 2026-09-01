# 001-user-authentication Specification

## Purpose
Implement secure user registration and authentication using Better-Auth with Prisma adapter. Users can register with email/password and login to receive JWT tokens for accessing protected leaderboard endpoints.

## Requirements

### Requirement: User Registration
The system SHALL allow new users to register with email and password.

#### Scenario: Successful registration
- **WHEN** a user POSTs to `/api/auth/register` with valid email and password
- **THEN** the system creates a new user account
- **AND** the password is hashed using bcrypt (via Better-Auth)
- **AND** a verification email is sent (if email verification enabled)
- **AND** the response returns 201 with user data (no password)

#### Scenario: Duplicate email rejection
- **WHEN** a user POSTs to `/api/auth/register` with an existing email
- **THEN** the system returns 409 Conflict
- **AND** no new account is created

#### Scenario: Invalid input rejection
- **WHEN** a user POSTs with invalid email format or password < 8 chars
- **THEN** the system returns 400 Bad Request
- **AND** validation errors are returned

### Requirement: User Login
The system SHALL authenticate users and issue access tokens.

#### Scenario: Successful login
- **WHEN** a user POSTs to `/api/auth/login` with valid credentials
- **THEN** the system verifies password hash
- **AND** issues JWT access token (15min expiry)
- **AND** issues refresh token (7 days, HttpOnly cookie)
- **AND** returns 200 with access token and user data

#### Scenario: Failed login
- **WHEN** a user POSTs with invalid email or password
- **THEN** the system returns 401 Unauthorized
- **AND** no tokens are issued
- **AND** rate limiting is applied

### Requirement: Token Refresh
The system SHALL allow token renewal using refresh token.

#### Scenario: Valid refresh
- **WHEN** a user POSTs to `/api/auth/refresh` with valid refresh cookie
- **THEN** the system issues new access token
- **AND** rotates refresh token
- **AND** returns 200 with new access token

#### Scenario: Invalid/expired refresh
- **WHEN** refresh token is expired, revoked, or missing
- **THEN** the system returns 401 Unauthorized
- **AND** clears refresh cookie

### Requirement: Protected Route Access
The system SHALL validate JWT on protected endpoints.

#### Scenario: Valid token
- **WHEN** a request includes valid Authorization: Bearer <token>
- **THEN** the system extracts userId from token
- **AND** attaches user to request object
- **AND** allows request to proceed

#### Scenario: Missing/invalid token
- **WHEN** token is missing, malformed, or expired
- **THEN** the system returns 401 Unauthorized

### Requirement: User Logout
The system SHALL invalidate user session.

#### Scenario: Successful logout
- **WHEN** a user POSTs to `/api/auth/logout`
- **THEN** the system revokes refresh token
- **AND** clears refresh cookie
- **AND** returns 200 OK