# 1️⃣ Clone the repository
git clone https://github.com/Kathula-Rajkumar/PayTM-wallet.git
cd PayTM-wallet

# 2️⃣ Install dependencies
npm install

# 3️⃣ Run PostgreSQL locally with Docker
docker run -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres

# 4️⃣ Copy .env.example files to .env
cp packages/db/.env.example packages/db/.env
cp apps/user-app/.env.example apps/user-app/.env

# 5️⃣ Update .env files with your database URL
# Example: DATABASE_URL="postgres://<USERNAME>:<PASSWORD>@localhost:5432/<DB_NAME>?sslmode=require"

# 6️⃣ Setup the database
cd packages/db
npx prisma migrate dev
npx prisma db seed (see the seed db)

# 7️⃣ Run the user app
cd ../../apps/user-app
npm run dev

# Open http://localhost:3000 in your browser
# Test login with:
# Phone: 1111111111
# Password: alice
