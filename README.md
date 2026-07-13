# 🚀 MenuCraft - Premium Shopify Menu Builder

MenuCraft is a high-performance, interactive menu builder designed for Shopify merchants who want to create stunning navigation experiences without touching a single line of code.

## ✨ Key Features

- **Intuitive Drag & Drop Builder**: Create complex menu structures with ease.
- **Mega Menus**: Go beyond simple dropdowns with rich, content-filled mega menus.
- **Real-time Analytics**: Track menu performance and user engagement directly from your dashboard.
- **Multi-template Library**: Choose from a variety of pre-designed templates to match your brand style.
- **Performance Optimized**: Lightweight and fast, ensuring no impact on your store's loading speed.
- **Mobile First**: Fully responsive menus that look great on any device.

## 🛠️ Tech Stack

- **Framework**: [Remix](https://remix.run/)
- **Styling**: [Shopify Polaris](https://polaris.shopify.com/) & [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Prisma](https://www.prisma.io/)
- **API**: GraphQL (Shopify Admin API)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the local database** (Homebrew PostgreSQL 16):
   ```bash
   npm run db:up
   createdb menucraft   # first time only
   ```

3. **Configure environment**: copy `.env.example` to `.env` and adjust
   `DATABASE_URL` for your machine (the default uses Homebrew trust auth).

4. **Apply migrations** (first time only):
   ```bash
   npx prisma migrate dev
   ```

5. **Start Development**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `app/`: Main application logic.
  - `components/`: Reusable UI components.
  - `menu-builder/`: Core logic for the menu builder.
  - `routes/`: Remix routing and page definitions.
- `extensions/`: Shopify App Extensions (Theme App Extensions).
- `prisma/`: Database schema and migrations.
- `public/`: Static assets and template library.

---

Built with ❤️ by [huseyin](https://github.com/huseyinctnkaya)
