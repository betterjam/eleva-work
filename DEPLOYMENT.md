# Deployment Guide - Eleva Landing Page

## Prerequisites

- Node.js 18+
- npm or yarn
- AWS CLI configured (for deployment)
- Access to S3 bucket and CloudFront distribution

## Available Commands

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Server will be available at `http://localhost:3000`

### Build

```bash
# Build for production (generates /out folder)
npm run build
```

This command:
1. Runs `next build` - compiles the application
2. Runs `postbuild` - copies `out/es/index.html` to `out/index.html` (Spanish as default)

### Linting

```bash
npm run lint
```

## AWS Deployment

### 1. Build the Site

```bash
npm run build
```

### 2. Upload to S3

```bash
# Sync out/ folder with S3 bucket
aws s3 sync out/ s3://eleva-landing --delete
```

Useful options:
- `--delete`: Removes files in S3 that no longer exist locally
- `--cache-control "max-age=31536000"`: For static assets
- `--exclude` / `--include`: To filter files

### 3. Invalidate CloudFront Cache

```bash
# Invalidate entire cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

Specific invalidations:
```bash
# HTML pages only
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/index.html" "/es/*" "/en/*"

# Assets only (CSS/JS)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/_next/*"
```

## Generated File Structure

```
out/
├── index.html          # Main page (Spanish)
├── es/
│   ├── index.html      # Spanish
│   ├── privacy/
│   │   └── index.html  # Privacy policy (ES)
│   └── terms/
│       └── index.html  # Terms of service (ES)
├── en/
│   ├── index.html      # English
│   ├── privacy/
│   │   └── index.html  # Privacy policy (EN)
│   └── terms/
│       └── index.html  # Terms of service (EN)
├── privacy/
│   └── index.html      # Redirect to /es/privacy
├── terms/
│   └── index.html      # Redirect to /es/terms
├── _next/
│   └── static/         # Compiled assets (JS, CSS, fonts)
└── images/             # Optimized images
```

## S3 Configuration

### Bucket Policy (for static website)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::eleva-landing/*"
    }
  ]
}
```

### Static Hosting Settings

- **Index document**: `index.html`
- **Error document**: `index.html` (for SPA routing)

## CloudFront Configuration

### Recommended Behaviors

| Path Pattern | Origin | Cache Policy |
|--------------|--------|--------------|
| `/_next/static/*` | S3 | CachingOptimized (1 year) |
| `*.html` | S3 | CachingDisabled or short TTL |
| Default (*) | S3 | CachingOptimized |

### Error Pages

- **403/404**: Redirect to `/index.html` with 200 status code

## Complete Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

BUCKET="eleva-landing"
DISTRIBUTION_ID="YOUR_DISTRIBUTION_ID"

echo "Building..."
npm run build

echo "Uploading to S3..."
aws s3 sync out/ s3://$BUCKET --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "Done!"
```

Run:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Environment Variables

No environment variables are required for the static build.

## Important Notes

1. **Default language**: Spanish (`/` serves Spanish content)
2. **Themes**: Dark/Light handled with CSS and localStorage (no SSR needed)
3. **Images**: Optimized at build time (no server required)
4. **Browser cache**: Assets in `/_next/static/` can be cached indefinitely
5. **Free invalidations**: First 1,000 paths/month are free on CloudFront

## Troubleshooting

### Images not loading
- Verify filenames don't contain spaces
- Check browser console for 404 errors

### Changes not reflecting
- Run CloudFront invalidation
- Clear browser cache (Ctrl+Shift+R)

### Light/dark theme not working
- Verify `localStorage` is accessible
- Check that theme script is in `<head>`
