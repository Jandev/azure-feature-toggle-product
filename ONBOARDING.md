# New Team Member Onboarding Checklist

## Prerequisites Setup

- [ ] Install .NET SDK 10.0+ ([Download](https://dotnet.microsoft.com/download))
- [ ] Install Node.js 18+ ([Download](https://nodejs.org/))
- [ ] Install Git ([Download](https://git-scm.com/downloads))
- [ ] Request access to Azure subscription from team lead
- [ ] Request Azure AD Tenant ID from team lead
- [ ] Request Azure AD Client ID from team lead

## Repository Setup

- [ ] Clone repository: `git clone <repository-url>`
- [ ] Navigate to project: `cd azure-feature-toggle-product`
- [ ] Make setup script executable: `chmod +x setup.sh`
- [ ] Run setup script: `./setup.sh`
  - Enter Tenant ID when prompted
  - Enter Client ID when prompted
  - Wait for dependencies to install

## Verify Installation

### Backend
- [ ] Navigate to backend: `cd backend`
- [ ] Verify secrets are set: `dotnet user-secrets list`
  - Should show: `AzureAd:TenantId` and `AzureAd:ClientId`
- [ ] Start backend: `dotnet run`
  - Should show: "Now listening on: http://localhost:5000"
  - Keep this terminal running

### Frontend
- [ ] Open new terminal
- [ ] Navigate to frontend: `cd frontend`
- [ ] Verify `.env.local` exists: `ls -la .env.local`
- [ ] Start frontend: `npm run dev`
  - Should show: "Local: http://localhost:5173"
  - Keep this terminal running

## First Login

- [ ] Open browser to: `http://localhost:5173`
- [ ] Click "Sign in with Microsoft"
- [ ] Login with your Microsoft work account
- [ ] Grant consent to permissions (first time only)
- [ ] Verify you see the dashboard with resources

## Azure Permissions Needed

Contact your Azure admin to ensure you have:
- [ ] **Reader** role on Azure subscriptions (for resource discovery)
- [ ] **App Configuration Data Reader** or **App Configuration Data Owner** on App Configuration resources
- [ ] Consent granted for Azure AD app permissions

## Troubleshooting

If you encounter issues:
1. Check `README.md` Troubleshooting section
2. Verify both backend and frontend are running
3. Check browser console for errors (F12)
4. Check backend terminal for errors
5. Ask team for help in #team-chat

## Common Issues

### "The 'ClientId' option must be provided"
- Run: `cd backend && dotnet user-secrets list`
- If empty, re-run: `./setup.sh`

### Frontend shows "your-client-id-here"
- Check: `cat frontend/.env.local`
- If shows placeholders, edit the file with actual values

### CORS errors in browser
- Ensure backend is running on port 5000
- Ensure frontend is running on port 5173
- Restart both servers

## Development Workflow

### Daily Startup
```bash
# Terminal 1
cd backend && dotnet run

# Terminal 2
cd frontend && npm run dev
```

### Before Committing
- [ ] Never commit `.env.local` (already gitignored)
- [ ] Never commit `appsettings.Development.json`
- [ ] Run `git status` to verify no secrets included
- [ ] Test your changes locally

### Pulling Latest Changes
```bash
git pull origin main
cd backend && dotnet restore
cd frontend && npm install
```

## Helpful Commands

### Backend
```bash
# View secrets
dotnet user-secrets list

# Update a secret
dotnet user-secrets set "AzureAd:TenantId" "new-value"

# Build
dotnet build

# Run tests (if available)
dotnet test
```

### Frontend
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Resources

- Project README: `README.md`
- Setup script: `setup.sh`
- Backend config example: `backend/appsettings.Example.json`
- Frontend config example: `frontend/.env.example`

## Team Contacts

- Team Lead: [Name]
- Azure Admin: [Name]
- DevOps: [Name]

---

**Welcome to the team! 🎉**

If you've completed all items above, you're ready to start developing!
