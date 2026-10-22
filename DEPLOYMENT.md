# Deployment Guide - Eleva Landing Page

## Prerequisites

- Node.js 18+
- npm or yarn
- AWS CLI with the `eleva` profile only for the manual fallback; normal deploys go through the pipeline

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

## Deployment: the pipeline

> Hosting (created 2026-10-22, account `eleva`, us-east-1): bucket
> `elevaworks-166429125068-us-east-1` (website endpoint, objects public through ACLs),
> CloudFront `E66FS6J8XLRWN` (d87jyy595qcsf.cloudfront.net), Route 53 zone `eleva.works`
> with A/AAAA aliases for the apex and www, ACM certificate for eleva.works + www.
> The domain is registered at Namecheap: its nameservers must point to the zone's
> (ns-1719.awsdns-22.co.uk, ns-998.awsdns-60.net, ns-1511.awsdns-60.org, ns-273.awsdns-34.com);
> once the certificate shows ISSUED, `scripts/aws/attach-domain.sh` attaches the domain
> to the distribution.

Every push to `main` deploys eleva.works through the CodePipeline **eleva-work-prod**
(us-east-1): GitHub (CodeConnections) → CodeBuild running `buildspec.yml` from this repo.
The build installs with `npm ci`, runs `npm run build`, syncs `out/` to the site bucket
(hashed `_next` chunks with a one-year immutable cache, everything else with five minutes
and `--delete`) and invalidates the CloudFront distribution. Watch a run in the
CodePipeline console; a failed build never touches the bucket.

The pipeline was created once with `scripts/aws/create-landing-pipeline.sh` (idempotent:
re-running it only fills in what is missing). The site bucket and the distribution are not
managed by it; the script reads the bucket name from the account and the distribution id
from its `DISTRIBUTION_ID` default.

### Manual fallback

```bash
npm run build
aws s3 sync out/ s3://<site-bucket> --delete --acl public-read
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

`<site-bucket>` and `<distribution-id>` are the values the pipeline uses (CodeBuild project
`eleva-work-prod`, environment variables `SITE_BUCKET` and `DISTRIBUTION_ID`). Objects
must be uploaded with `--acl public-read`: the bucket serves as a website endpoint and has
no bucket policy.

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
