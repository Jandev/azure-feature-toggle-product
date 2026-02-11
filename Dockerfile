# Multi-stage build for hosting both .NET backend and Vite frontend in a single container

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend with /api as the base URL for API calls
ENV VITE_API_BASE_URL=/api
RUN npm run build

# Stage 2: Build .NET Backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /backend

# Copy backend project files
COPY backend/*.csproj ./
RUN dotnet restore

# Copy backend source code
COPY backend/ ./

# Copy frontend build to wwwroot folder
COPY --from=frontend-build /frontend/dist ./wwwroot

# Publish backend
RUN dotnet publish -c Release -o /backend/out

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

# Copy backend and frontend (in wwwroot)
COPY --from=backend-build /backend/out ./

# Set environment variables
ENV ASPNETCORE_URLS=http://0.0.0.0:5173
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose only port 5173
EXPOSE 5173

# Run the application
CMD ["dotnet", "AzureFeatureToggleApi.dll"]
