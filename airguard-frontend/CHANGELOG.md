# Airguard Project Changelog

## Overview
This document outlines all changes made to the Airguard project to add AI model API key management capabilities and related infrastructure improvements.

## Backend Changes

### Database Schema Updates
- **File**: `backend/prisma/schema.prisma`
- **Changes**: Added `UserSettings` model to store encrypted API keys and user preferences
  - `id`: Unique identifier
  - `userId`: Foreign key to User model
  - `openaiApiKey`: Encrypted OpenAI API key
  - `anthropicApiKey`: Encrypted Anthropic API key
  - `preferences`: JSON field for user preferences
  - `createdAt` and `updatedAt`: Timestamps
  - Added relationship to User model

### New Services

#### EncryptionService
- **File**: `backend/src/services/encryptionService.ts`
- **Purpose**: AES-256-CBC encryption for API keys
- **Features**:
  - Encrypt and decrypt sensitive data
  - Mask API keys for display (shows only first 4 and last 4 characters)
  - Environment-based encryption key management

#### SettingsService
- **File**: `backend/src/services/settingsService.ts`
- **Purpose**: CRUD operations for user settings
- **Features**:
  - Create, read, update, delete user settings
  - API key validation via OpenAI and Anthropic APIs
  - Automatic encryption/decryption of sensitive data
  - Error handling and validation

### New Controllers
- **File**: `backend/src/controllers/settingsController.ts`
- **Endpoints**:
  - `GET /api/settings` - Get user settings
  - `PUT /api/settings` - Update user settings
  - `POST /api/settings/test-openai` - Test OpenAI API key
  - `POST /api/settings/test-anthropic` - Test Anthropic API key
  - `DELETE /api/settings` - Delete user settings

### Validation Schemas
- **File**: `backend/src/validations/settingsValidation.ts`
- **Schemas**:
  - `updateSettingsSchema`: Validation for settings updates
  - `testApiKeySchema`: Validation for API key testing

### TypeScript Types
- **File**: `backend/src/types/settings.ts`
- **Types**:
  - `UserSettings`: Database model type
  - `UpdateSettingsRequest`: API request type
  - `SettingsResponse`: API response type
  - `ApiKeyTestResponse`: API key test response type

### Route Updates
- **File**: `backend/src/routes/index.ts`
- **Changes**: Added settings routes to the main router

## Frontend Changes

### New Components

#### SettingsPanel
- **File**: `src/components/dashboard/SettingsPanel.tsx`
- **Features**:
  - API key management (OpenAI and Anthropic)
  - Show/hide toggle for API keys
  - Test and delete buttons for each API key
  - User preferences controls
  - Loading states and error handling
  - Responsive design

### API Service Updates
- **File**: `src/services/api.ts`
- **New Methods**:
  - `getUserSettings()`: Fetch user settings
  - `updateUserSettings()`: Update user settings
  - `testOpenAIKey()`: Test OpenAI API key
  - `testAnthropicKey()`: Test Anthropic API key
  - `deleteUserSettings()`: Delete user settings

### Dashboard Integration
- **File**: `src/app/dashboard/manage/page.tsx`
- **Changes**: Integrated SettingsPanel component into the manage page

## Environment Configuration

### Database Configuration
- **File**: `.env`
- **Changes**:
  - Updated database port to 5543 (to avoid conflicts)
  - Added encryption key for API key security
  - Configured database credentials

### Docker Configuration
- **File**: `docker-compose.yml`
- **Changes**: Updated PostgreSQL container port to 5543

## Security Features

### API Key Encryption
- All API keys are encrypted using AES-256-CBC before storage
- Encryption key is stored in environment variables
- API keys are masked when displayed (shows only first 4 and last 4 characters)

### Validation
- API key format validation
- Real-time API key testing against OpenAI and Anthropic services
- Input sanitization and validation

## Database Migration
- Created Prisma migration for UserSettings model
- Migration includes:
  - UserSettings table creation
  - Foreign key relationship to User table
  - Indexes for performance optimization

## Usage Instructions

### Backend Setup
1. Ensure PostgreSQL is running on port 5543
2. Run Prisma migrations: `npx prisma migrate dev`
3. Start the backend server: `npm run dev`

### Frontend Setup
1. Start the frontend: `npm run dev`
2. Navigate to the dashboard manage page
3. Access the Settings panel to manage API keys

### API Key Management
1. Add OpenAI and/or Anthropic API keys
2. Test keys to ensure they're valid
3. Toggle visibility of API keys
4. Delete keys when no longer needed
5. Configure user preferences

## AI Integration Capabilities

With the stored API keys, the system can now support:
- Smart device management automation
- Automated alert analysis and categorization
- Intelligent dashboard insights and recommendations
- Automated report generation
- Smart configuration assistants
- Natural language query processing
- Predictive maintenance suggestions

## Technical Notes

### Dependencies Added
- Backend: No new dependencies (used existing crypto module)
- Frontend: No new dependencies (used existing React patterns)

### Performance Considerations
- API keys are cached in memory after decryption
- Database queries are optimized with proper indexing
- Frontend uses efficient state management

### Error Handling
- Comprehensive error handling for API failures
- User-friendly error messages
- Graceful degradation when services are unavailable

## Future Enhancements
- AI-powered device management automation
- Smart alert analysis and categorization
- Automated report generation
- Natural language query interface
- Predictive analytics for device maintenance
- Integration with additional AI services

## Files Modified Summary
- **Backend**: 8 new files, 2 modified files
- **Frontend**: 3 new files, 2 modified files
- **Configuration**: 2 modified files
- **Database**: 1 new migration file

Total: 14 new files, 6 modified files 