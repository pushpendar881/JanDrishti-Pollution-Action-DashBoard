# JanDrishti Backend API

FastAPI backend for JanDrishti Pollution Action Dashboard.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Fill in your Supabase credentials in `.env`:
- Get your Supabase URL and keys from your Supabase project settings
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (for admin operations)

4. Run the Supabase schema:
- Go to your Supabase project SQL Editor
- Copy and paste the contents of `../supabase/schema.sql`
- Execute the SQL

5. Run the server:
```bash
python main.py
# or
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (requires auth)

### Reports
- `GET /api/reports` - Get all reports (public)
- `POST /api/reports` - Create a report (requires auth)
- `GET /api/reports/{id}` - Get a specific report
- `PUT /api/reports/{id}` - Update a report (requires auth, owner only)
- `POST /api/reports/{id}/upvote` - Upvote a report

### Chat
- `GET /api/chat/messages` - Get chat history (requires auth)
- `POST /api/chat/messages` - Send a message (requires auth)

## Environment Variables

See `.env.example` for all required environment variables.
