# jest-manga-api

**Backend Server for Scraping and Storing Manga**

---

## Badges

![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![REST API](https://img.shields.io/badge/REST%20API-ff9800?logo=api&logoColor=white)
![Web Scraping](https://img.shields.io/badge/Web%20Scraping-4caf50?logo=code&logoColor=white)

---

## Overview

`jest-manga-api` is a powerful backend server designed to **scrape manga data** from various sources and **store** it efficiently. The server exposes a flexible **API** that can be used by web applications and mobile apps to access manga content seamlessly.

---

## Features

- 🗃️ **Scraping:** Fetch manga details and chapters from multiple sources.
- 📦 **Storage:** Securely store manga metadata and chapters in a PostgreSQL database.
- 🔗 **RESTful API:** Easily integrate with web and mobile clients for reading manga.
- ⚡ **Fast & Reliable:** Built with TypeScript and NestJS for robustness and scalability.

---

## Use Cases

- **Web Applications:** Serve manga content to your website via the API.
- **Mobile Apps:** Power your manga reader app with fresh and updated manga data.
- **Automation:** Keep your manga library updated automatically with the latest chapters.

---

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/redaezziani/jest-manga-api-.git
   cd real-es
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in the required fields (database credentials, API keys, etc).

4. **Run the server:**
   ```bash
   npm run start
   ```

---

## API Endpoints

> **Note:** The following are example endpoints. See the actual code or API documentation for full details.

| Method | Endpoint            | Description                |
|--------|---------------------|----------------------------|
| GET    | `/api/manga`        | List all manga             |
| GET    | `/api/manga/:id`    | Get details of a manga     |
| POST   | `/api/scrape`       | Scrape new manga           |
| GET    | `/api/chapters/:id` | Get chapters for a manga   |

---

## Technologies Used

- **TypeScript** — Main backend language
- **Node.js & NestJS** — REST API framework
- **PostgreSQL** — Database
- **Scraping Libraries** — (e.g., Cheerio, Puppeteer—please specify)

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Author

- [Reda Ezziani](https://github.com/redaezziani)

---

## Tagline

> **Backend server for scraping and storing manga. Use as an API for your web and mobile manga applications!**
