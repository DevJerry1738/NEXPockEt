# Orange Host Deployment Guide

## Issue
Getting 404 error on SPA routes (like `/login`) after deployment. This is because Apache is treating the routes as file requests instead of letting React handle them.

## Solution
The `.htaccess` file has been added to handle SPA routing properly.

## Deployment Steps

### 1. Build the Project Locally
```bash
npm run build
```
This creates a `dist/` folder with your production build.

### 2. Upload to Orange Host
Using FTP/SFTP, upload the following to your web root (`public_html` or equivalent):

**Required files:**
- `dist/index.html` → Goes to web root
- `dist/assets/` → Entire folder with CSS/JS files
- `.htaccess` → Goes to web root (same level as index.html)

**Directory structure on server:**
```
public_html/
├── index.html
├── .htaccess
└── assets/
    ├── index-[hash].js
    ├── index-[hash].css
    └── ... (other asset files)
```

### 3. Verify Apache Configuration
On Orange Host control panel:
1. Check that `mod_rewrite` is enabled (usually enabled by default)
2. Check that `.htaccess` overrides are allowed (AllowOverride All)
3. If you have access to `.htaccess` in the control panel, ensure it's writable

### 4. Clear Browser Cache
After uploading, clear your browser cache:
- **Chrome/Edge:** `Ctrl+Shift+Delete` → Clear browsing data
- **Firefox:** `Ctrl+Shift+Delete` → Clear All History
- **Safari:** ⌘+Shift+Delete

### 5. Test Routes
Try these URLs:
- `https://thenexpocket.com/` - Should work
- `https://thenexpocket.com/login` - Should work (not 404)
- `https://thenexpocket.com/register` - Should work
- `https://thenexpocket.com/admin` - Should work
- `https://thenexpocket.com/user/dashboard` - Should work

## Troubleshooting

### Still Getting 404?

1. **Check if `.htaccess` is uploaded:**
   - Use FTP to verify `.htaccess` file exists in web root
   - Filename must be exactly `.htaccess` (with the dot)

2. **Check if mod_rewrite is enabled:**
   - Create a test file: `test.php` with `<?php phpinfo(); ?>`
   - Upload to web root
   - Visit `https://thenexpocket.com/test.php`
   - Look for "mod_rewrite" in the Apache modules section
   - If not found, contact Orange Host support to enable it

3. **Check .htaccess syntax:**
   - The `.htaccess` file must be ASCII text, not Unicode
   - No special characters or extra spaces at the beginning

4. **Check file permissions:**
   - `.htaccess` should be readable (644 permissions)
   - Verify in FTP client under "View → Show hidden files"

5. **Contact Orange Host Support if:**
   - mod_rewrite is not enabled
   - AllowOverride is restricted
   - They have specific SPA deployment requirements

### Example: .htaccess Not Working

If `.htaccess` is not working despite being uploaded:
```bash
# Your app might be in a subdirectory
# For example: https://thenexpocket.com/nexpocket/

# In that case, change the RewriteBase in .htaccess to:
RewriteBase /nexpocket/
```

## Production Deployment Checklist

- [ ] Run `npm run build` locally
- [ ] Upload entire `dist/` folder contents to web root
- [ ] Upload `.htaccess` to web root (same level as `index.html`)
- [ ] Clear browser cache
- [ ] Test main routes: `/`, `/login`, `/register`, `/admin`, `/user/dashboard`
- [ ] Verify CSS and JS are loading (check Network tab in F12)
- [ ] Check browser console for errors (F12 → Console tab)
- [ ] Verify environment variables in Supabase are correct

## Environment Variables

Make sure your Supabase keys are correctly set:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

These should be in your `.env.local` file during build and are baked into the final build.

## Updating Your App

To deploy an update:
1. Make changes locally
2. Run `npm run build`
3. Upload `dist/` folder contents to replace old files on Orange Host
4. Upload new `.htaccess` (if changed)
5. Clear browser cache

## Performance Tips

- `.htaccess` includes caching rules for assets
- Files with hashes in the name (like `index-abc123.js`) are cached for 1 year
- HTML files are never cached (always checked for updates)
- Gzip compression is enabled for faster downloads

## Support

If you continue having issues:
1. Check Orange Host's documentation on deploying SPAs
2. Contact Orange Host support with: "I'm deploying a React SPA and need Apache mod_rewrite enabled for client-side routing"
3. Share the error from Supabase function logs (if applicable)
