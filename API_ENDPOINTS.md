# Manga API Endpoints

## Get All Mangas
```http
GET /manga/all
```
**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page
- `search` (optional) - Search term for manga titles

Example: `/manga/all?page=1&limit=10&search=naruto`

## Get Single Manga
```http
GET /manga/info/:id
```
**Parameters:**
- `id` - Manga ID or slug

Example: `/manga/info/1234` or `/manga/info/naruto`

## Get Popular Mangas
```http
GET /manga/popular
```
Returns top 10 mangas sorted by rating and views.

## Get Latest Mangas
```http
GET /manga/latest
```
Returns 10 most recently added mangas.

## Get Mangas by Genre
```http
GET /manga/genre/:genre
```
**Parameters:**
- `genre` - Genre name
**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

Example: `/manga/genre/action?page=1&limit=10`

## Autocomplete Search
```http
GET /manga/search/autocomplete
```
**Query Parameters:**
- `search` - Search term for autocomplete

Example: `/manga/search/autocomplete?search=nar`

## Response Formats

### Paginated Response
```typescript
{
  success: boolean;
  data: {
    items: Manga[];
    meta: {
      currentPage: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    }
  }
}
```

### Single Item Response
```typescript
{
  success: boolean;
  message?: string;
  data: Manga;
}
```

### Autocomplete Response
```typescript
{
  success: boolean;
  data: string[];
  query: string;
}
```
