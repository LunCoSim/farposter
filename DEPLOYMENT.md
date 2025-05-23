# Farpost Game Deployment Guide

This guide will help you deploy the Farpost lunar mining game using Supabase for the database and Netlify for hosting and server functions.

## Prerequisites

- Node.js 16+ installed
- Git installed
- A Supabase account
- A Netlify account
- GitHub account (for deployment)

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project
3. Choose your organization and set project details:
   - **Name**: `farpost-game`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users

### 1.2 Set up the Database

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the contents of `supabase/schema.sql` and run it
3. This will create all necessary tables, policies, and functions

### 1.3 Configure Authentication

1. Go to **Authentication > Settings**
2. Set **Site URL** to your domain (or `http://localhost:8888` for development)
3. Add any additional redirect URLs you need
4. Configure email templates if desired

### 1.4 Get API Keys

1. Go to **Settings > API**
2. Copy the following values (you'll need them later):
   - **Project URL**
   - **anon public key**
   - **service_role key** (keep this secret!)

## Step 2: Local Development Setup

### 2.1 Clone and Install

```bash
git clone <your-repo-url>
cd farposter
npm install
```

### 2.2 Configure Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 2.3 Update Configuration

1. Edit `js/config.js` and update the Supabase configuration:
   ```javascript
   supabase: {
     url: 'https://your-project-id.supabase.co',
     anonKey: 'your-anon-key'
   }
   ```

### 2.4 Test Locally

```bash
npm run dev
```

The game should be available at `http://localhost:8888`

## Step 3: Netlify Deployment

### 3.1 GitHub Setup

1. Push your code to a GitHub repository
2. Make sure all files are committed and pushed

### 3.2 Create Netlify Site

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"New site from Git"**
3. Choose **GitHub** and authorize if needed
4. Select your repository
5. Configure build settings:
   - **Build command**: Leave empty (static site)
   - **Publish directory**: `/` (root directory)

### 3.3 Configure Environment Variables

1. In your Netlify site dashboard, go to **Site settings > Environment variables**
2. Add the following variables:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 3.4 Configure Functions

The `netlify.toml` file is already configured to:
- Set up function routing (`/api/*` → `/.netlify/functions/`)
- Configure CORS headers
- Set security headers

### 3.5 Deploy

1. Netlify will automatically deploy when you push to GitHub
2. You can also manually deploy by dragging the project folder to Netlify

## Step 4: Post-Deployment Configuration

### 4.1 Update Supabase URLs

1. Go back to your Supabase project
2. In **Authentication > Settings**, update:
   - **Site URL**: `https://your-netlify-domain.netlify.app`
   - **Additional Redirect URLs**: Add your Netlify domain

### 4.2 Test Authentication

1. Visit your deployed site
2. Try signing up for a new account
3. Check that the user appears in Supabase **Authentication > Users**
4. Verify that game data is saved correctly

## Step 5: Optional Enhancements

### 5.1 Custom Domain

1. In Netlify, go to **Domain settings**
2. Add your custom domain
3. Update Supabase redirect URLs accordingly

### 5.2 Analytics

Add analytics to track game usage:
```javascript
// Add to your game initialization
if (window.gtag) {
  gtag('event', 'game_start', {
    'event_category': 'engagement'
  });
}
```

### 5.3 Performance Monitoring

Consider adding error tracking:
```javascript
window.addEventListener('error', (e) => {
  console.error('Game error:', e);
  // Send to your error tracking service
});
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check that Netlify functions are deployed correctly
   - Verify `netlify.toml` configuration
   - Check browser developer tools for specific errors

2. **Authentication Issues**
   - Verify Supabase site URLs are correct
   - Check environment variables in Netlify
   - Ensure redirect URLs include your domain

3. **Database Errors**
   - Check that the schema was applied correctly
   - Verify Row Level Security policies
   - Check Supabase logs for SQL errors

4. **Function Errors**
   - Check Netlify function logs
   - Verify environment variables are set
   - Test API endpoints manually

### Debugging Steps

1. **Check Netlify Function Logs**:
   ```bash
   netlify dev
   # or check the Netlify dashboard functions tab
   ```

2. **Test API Endpoints**:
   ```bash
   curl -X GET https://your-site.netlify.app/api/game-state \
     -H "Authorization: Bearer your-jwt-token"
   ```

3. **Check Database Connectivity**:
   ```javascript
   // In browser console
   const { data, error } = await farpostAPI.supabase
     .from('player_profiles')
     .select('*')
     .limit(1);
   console.log({ data, error });
   ```

## Security Considerations

1. **Environment Variables**: Never commit API keys to git
2. **Row Level Security**: All database tables have RLS enabled
3. **Authentication**: All API endpoints require valid JWT tokens
4. **CORS**: Configured for your domain only
5. **HTTPS**: Netlify provides free SSL certificates

## Monitoring and Maintenance

1. **Monitor Supabase Usage**: Check dashboard for API limits
2. **Monitor Netlify Functions**: Watch for execution time and errors
3. **Database Performance**: Monitor query performance in Supabase
4. **User Feedback**: Set up feedback collection for bug reports

## Support

- **Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Netlify**: [docs.netlify.com](https://docs.netlify.com)
- **Game Issues**: Create issues in your GitHub repository 