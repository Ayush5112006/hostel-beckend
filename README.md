# Backend (Vercel Deploy)

This backend is ready to deploy on Vercel.

## Required environment variables in Vercel

- `MONGODB_URI`
- `CLIENT_ORIGIN`
- `EMAIL_USER`
- `EMAIL_APP_PASSWORD`
- `OTP_EXPIRES_MINUTES`
- `ENABLE_SEED` (optional, set `true` only when you intentionally want seed data)

## Deploy steps

1. Open terminal in the `backend` folder.
2. Run `vercel` (first deploy) or `vercel --prod` (production deploy).
3. Add all required environment variables in Vercel project settings.

## API base after deploy

- Root: `/`
- Health: `/api/health`
- Auth: `/api/auth/*`
- Admin: `/api/admin/*`
- Chats: `/api/chats/*`
- Bookings: `/api/bookings/*`
- Complaints: `/api/complaints/*`
- Dashboard: `/api/dashboard/*`

## New admin panel data APIs

- `GET /api/admin/panel-data` -> fetches MongoDB-backed data used by all admin modules.
- `PUT /api/admin/panel-data` -> updates one module or multiple modules.
	- Module update body: `{ "module": "analytics", "payload": { ... }, "updatedBy": "admin@hostel" }`
	- Multi-module update body: `{ "panelData": { "analytics": { ... }, "notice": { ... } } }`
# hostel-beckend
