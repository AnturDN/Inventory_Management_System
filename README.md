# Inventory Management System

A full-stack Inventory Management System built to manage products, stock, suppliers, customers, purchases, sales, expenses, and other business operations from one platform.

## Live Demo

- **Frontend:** https://inventory-management-system-antur.vercel.app/
- **Backend API:** https://inventory-management-system-3079.onrender.com/

## Project Overview

The Inventory Management System helps businesses manage their daily inventory operations more easily. It provides a centralized platform to organize products, monitor stock levels, manage suppliers and customers, track sales and purchases, and maintain financial records.

The project uses React for the frontend and Laravel for the backend. TiDB is used as the cloud database.

## Features

- Dashboard for monitoring business activities
- Product management
- Brand and category management
- Warehouse management
- Stock and stock history tracking
- Supplier management
- Customer management
- Retail customer management
- Purchase and sales management
- Sell item management
- Transaction management
- Payment management
- Expense category and expense management
- Investment management
- User and role management

## Technologies Used

### Frontend
- React.js
- JavaScript
- Vite
- React Router
- Bootstrap
- Tailwind CSS

### Backend
- PHP
- Laravel 10
- Laravel Sanctum
- REST API

### Database
- TiDB Cloud (MySQL-compatible database)

### Deployment
- Vercel – Frontend Hosting
- Render – Backend Hosting
- TiDB Cloud – Database Hosting

## Project Structure

```text
Inventory_Management_System/
│
├── Inventory_Management_Frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── Inventory_Management_Backend/
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/
│   ├── routes/
│   ├── storage/
│   ├── Dockerfile
│   └── composer.json
│
└── README.md
```

## Installation and Setup

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/AnturDN/Inventory_Management_System.git
```

```bash
cd Inventory_Management_System
```

### 2. Backend Setup

Go to the backend directory:

```bash
cd Inventory_Management_Backend
```

Install PHP dependencies:

```bash
composer install
```

Create the environment file:

```bash
cp .env.example .env
```

Generate the application key:

```bash
php artisan key:generate
```

Configure your database credentials in the `.env` file.

Example:

```env
APP_NAME="Inventory Management"
APP_ENV=local
APP_DEBUG=true

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventory_management
DB_USERNAME=root
DB_PASSWORD=
```

Run database migrations:

```bash
php artisan migrate
```

Start the Laravel development server:

```bash
php artisan serve
```

The backend will run at:

`http://127.0.0.1:8000`

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd Inventory_Management_Frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the frontend directory and configure the backend API URL:

```env
VITE_BASE_URL=http://localhost:8000/api/
```

Start the development server:

```bash
npm run dev
```

The frontend will run at the local URL provided by Vite, usually:

`http://localhost:5173`

## Environment Configuration

The application requires environment variables for database connectivity and API communication.

**Backend:** Configure database credentials and Laravel application settings in `Inventory_Management_Backend/.env`.

**Frontend:** Configure the backend API URL using `VITE_BASE_URL`.

Do not commit `.env` files, database passwords, application keys, or other sensitive credentials to GitHub.

## Deployment

The application is deployed using the following services:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | TiDB Cloud |

The frontend communicates with the Laravel REST API, while the backend connects to the cloud database.

## Future Improvements

- Advanced inventory analytics and reporting
- Low-stock notifications
- Improved dashboard visualizations
- Enhanced authentication and authorization
- Better mobile responsiveness
- Automated testing

## Author

**Antur Deb Nath**

GitHub: [AnturDN](https://github.com/AnturDN)

---

*This project was developed as a full-stack software development project to demonstrate frontend development, backend API development, database management, and cloud deployment.*
