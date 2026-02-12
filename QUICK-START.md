# Quick Start Guide

## Start the Application

### Terminal 1: Backend API
```bash
cd backend
dotnet run
```
- Backend: http://localhost:5000  
- Swagger UI: http://localhost:5000/swagger

### Terminal 2: Frontend App
```bash
cd frontend
npm run dev
```
- Frontend: http://localhost:5173

## Test Authentication

1. Open http://localhost:5173
2. Click "Sign in with Microsoft"
3. Login with your Azure AD account
4. After successful login, you'll see the dashboard

### First Time Login
- Microsoft will show a consent screen - click "Accept"
- You'll be redirected back to the application

## What's Next?

After authentication works:
1. The app will auto-discover Azure App Configuration resources
2. Select a resource to view its feature flags
3. Toggle flags on/off (requires Data Owner role)
4. View audit log for change history

## Need Help?

- Full documentation: `README.md`
- Azure AD setup: `AZURE-AD-CONFIGURATION.md`
- New developer setup: `ONBOARDING.md`
- Azure deployment: `terraform/README.md`
