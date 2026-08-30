# Environment Setup Guide

Define Horizon Business Management System requires proper environment configuration to run securely and correctly. This document provides comprehensive guidance on setting up environment variables.

## Quick Start

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required values in `.env.local` (see below for details)

3. Run the development server:
   ```bash
   npm run dev
   ```

The application will validate all environment variables at startup. If any required variables are missing or invalid, you'll see a clear error message.

## Environment Files

### `.env.example`

- Contains all possible environment variables with placeholder values
- Shared with the team via git
- Use this as a template when setting up new environments

### `.env.local` (Development)

- Contains actual values for local development
- **Never commit to git** (automatically ignored by `.gitignore`)
- Used during `npm run dev`

### `.env.staging` (Staging)

- Template for staging environment
- Not committed to git
- Used for testing in staging environment

### `.env.production` (Production)

- Template for production environment
- Not committed to git
- Used when deploying to production

## Required Environment Variables

All of these must be set in your environment files:

### Supabase Configuration

**NEXT_PUBLIC_SUPABASE_URL**

- Type: URL string
- Example: `https://your-project-id.supabase.co`
- How to get:
  1. Go to your Supabase project dashboard
  2. Click "Settings" in the left sidebar
  3. Under "API", copy the "Project URL"
- Why required: Connects your app to Supabase backend

**NEXT_PUBLIC_SUPABASE_ANON_KEY**

- Type: String (JWT token)
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- How to get:
  1. In Supabase project settings
  2. Under "API", look for "anon public" key
  3. Copy the full key
- Why required: Enables client-side authentication with Supabase

**SUPABASE_SERVICE_ROLE_KEY**

- Type: String (JWT token)
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- How to get:
  1. In Supabase project settings
  2. Under "API", look for "service_role secret" key
  3. Copy the full key
  4. **IMPORTANT**: This is sensitive - only use server-side!
- Why required: Enables privileged operations on the backend
- **Security**: Keep this private - never expose in frontend code

### Application Configuration

**NEXT_PUBLIC_APP_URL**

- Type: URL string
- Example:
  - Development: `http://localhost:3000`
  - Production: `https://app.definehorizon.com`
- Why required: Used for authentication redirects and callback URLs
- Note: Must match the URL used to access the application

## Optional Environment Variables

These provide sensible defaults if not set:

### Environment

**NODE_ENV**

- Type: Enum ('development' | 'staging' | 'production')
- Default: `development`
- Controls app behavior and logging levels

### Authentication

**AUTH_TIMEOUT_MINUTES**

- Type: Number
- Default: `30`
- How long user sessions remain active before requiring re-authentication
- Range: 1-1440 (1 minute to 24 hours)

### Service Charges

**DEFAULT_INTERNATIONAL_SERVICE_CHARGE_RATE**

- Type: Number (0-100)
- Default: `10`
- Service charge percentage applied to international transactions
- Example: `10` means 10% fee

**DEFAULT_LOCAL_SERVICE_CHARGE_RATE**

- Type: Number (0-100)
- Default: `8`
- Service charge percentage applied to local transactions
- Example: `8` means 8% fee

### Logging

**DEBUG_LOGGING**

- Type: Boolean string ('true' | 'false')
- Default: `false`
- Enable detailed debug logging for development

## Setup Instructions by Environment

### Local Development

1. Copy the template:

   ```bash
   cp .env.example .env.local
   ```

2. Update with your local Supabase project details:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   DEBUG_LOGGING=true
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Visit http://localhost:3000

### Staging Deployment

1. Create `.env.staging` from template
2. Use staging Supabase project credentials
3. Set `NEXT_PUBLIC_APP_URL` to staging domain
4. Set `NODE_ENV=staging` or `production`
5. Deploy via your CI/CD pipeline

### Production Deployment

1. Provision production Supabase project
2. Create `.env.production` from template
3. Set all variables with production values
4. Set `NODE_ENV=production`
5. Set `DEBUG_LOGGING=false` for security
6. Deploy securely (use environment secrets in your deployment platform)

## Security Best Practices

1. **Never commit `.env.local` or `.env.*.local`**
   - Already configured in `.gitignore`
   - These files contain sensitive keys

2. **Rotate keys regularly**
   - Update SUPABASE_SERVICE_ROLE_KEY periodically
   - Use Supabase dashboard to regenerate keys if compromised

3. **Use different credentials per environment**
   - Never use production keys in development
   - Create separate Supabase projects for dev, staging, production

4. **Protect SUPABASE_SERVICE_ROLE_KEY**
   - Only used on the server (backend)
   - Never include in client-side code
   - Never log or expose this key

5. **Review environment at startup**
   - The app validates all variables on startup
   - Invalid configuration is caught immediately
   - Check logs for validation errors in production

## Environment Validation

The application validates environment variables at startup using `lib/env-validation.ts`:

- **When**: Application initialization (in `app/layout.tsx`)
- **What**: Checks that all required variables are present and valid
- **Error handling**:
  - Invalid URLs trigger format validation errors
  - Missing variables show clear error messages
  - Invalid ranges (e.g., service charge > 100) are rejected

### Error Messages

If validation fails, you'll see detailed error output:

```
Environment validation failed. Missing or invalid environment variables:
  • NEXT_PUBLIC_SUPABASE_URL: NEXT_PUBLIC_SUPABASE_URL must be a valid URL
  • SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY is required

Please check the .env.local file and ensure all required variables are set.
Refer to .env.example for the required variables.
```

## Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL must be a valid URL"

- Check that URL starts with `https://`
- Verify URL format: `https://project-id.supabase.co`
- Ensure no extra spaces or characters

### "SUPABASE_SERVICE_ROLE_KEY is required"

- Copy the full service role key from Supabase settings
- Verify the key is not truncated
- Check for typos in variable name

### "NEXT_PUBLIC_APP_URL must be a valid URL"

- For development: Use `http://localhost:3000`
- For production: Use `https://` protocol
- Ensure URL format is correct

### Application won't start

1. Check terminal for environment validation errors
2. Run `cat .env.local` to verify file exists
3. Compare with `.env.example` for missing variables
4. Ensure all URLs are valid

## For CI/CD Deployment

Set environment variables in your deployment platform (Vercel, GitHub Actions, etc.):

```bash
# Example: GitHub Actions
NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
NODE_ENV: production
DEBUG_LOGGING: false
```

## File Reference

- `.env.example` - Template for all environment variables
- `.env.local` - Development configuration (not committed)
- `lib/env-validation.ts` - Environment validation logic
- `middleware.ts` - Validates environment on every request
- `app/app/layout.tsx` - Triggers validation at app startup

## Support

For questions about Supabase configuration:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase API Keys Guide](https://supabase.com/docs/guides/api/api-keys)

For questions about this project:

- Check the main README.md
- Review the design document
