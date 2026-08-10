# Prime Creative Deployment

Use fresh accounts, not the old ones.

## 1. Create new Supabase account/project

1. Create a new Supabase account.
2. Create a new project.
3. Open SQL Editor and run `SUPABASE_SETUP.sql`.
4. Copy:
   - Project URL
   - Service role key

## 2. Create new Vercel account/project

1. Create a new Vercel account.
2. Import this project.
3. Add environment variables from `.env.example`.
4. Deploy.

Required variables:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
PUBLIC_SITE_URL=
WHATSAPP_NUMBER=09162902223
INQUIRY_EMAIL=primecreative66@gmail.com
```

## 3. Admin

Production admin URL:

```text
https://your-domain.com/admin.html
```

The admin page will ask for `ADMIN_PASSWORD` before saving settings, services, courses, and uploads.

For local backend testing, run:

```text
node local-server.js
```
