# Setup order

1. Scaffold the project (skip if already done):
   npx create-next-app@latest student-union-webapp --typescript --app --eslint --no-tailwind
   cd student-union-webapp

2. Install dependencies:
   npm install googleapis
   npm install next-auth@beta

3. Extract this zip's contents INTO the project root, overwriting the
   generated app/page.tsx when prompted. Folder structure should end up:
   student-union-webapp/
     app/
       page.tsx
       login/page.tsx
       unauthorized/page.tsx
       secretary/page.tsx
       api/auth/[...nextauth]/route.ts
     lib/
       googleSheets.ts
       roles.ts
     types/
       next-auth.d.ts
     auth.ts
     auth.config.ts
     middleware.ts
     .env.example

4. Create .env.local in the project root (next to package.json) with
   real values for all five variables listed in .env.example.
   Never commit .env.local.

5. Run:
   npm run dev

   Visit http://localhost:3000 for the read-only table.
   Visit http://localhost:3000/secretary to test the auth/role flow.
