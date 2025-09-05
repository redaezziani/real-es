# Bookmarks and LikedManga Modules

This document describes the API endpoints for the Bookmarks and LikedManga modules.

## Bookmarks Module

### Endpoints

#### Create Bookmark

- **POST** `/bookmarks`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "mangaId": "string"
  }
  ```
- **Response**: Returns the created bookmark with manga details

#### Remove Bookmark

- **DELETE** `/bookmarks/:mangaId`
- **Auth Required**: Yes
- **Response**: No content (204)

#### Get User Bookmarks

- **GET** `/bookmarks`
- **Auth Required**: Yes
- **Query Parameters**:
  - `search` (optional): Search by manga title
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `genre` (optional): Filter by genre
  - `status` (optional): Filter by manga status
- **Response**: Paginated list of bookmarks with manga details

#### Check if Manga is Bookmarked

- **GET** `/bookmarks/check/:mangaId`
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "bookmarked": boolean
  }
  ```

#### Toggle Bookmark

- **POST** `/bookmarks/toggle/:mangaId`
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "bookmarked": boolean,
    "message": "string"
  }
  ```

## LikedManga Module

### Endpoints

#### Like Manga

- **POST** `/liked-manga`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "mangaId": "string"
  }
  ```
- **Response**: Returns the created like with manga details

#### Unlike Manga

- **DELETE** `/liked-manga/:mangaId`
- **Auth Required**: Yes
- **Response**: No content (204)

#### Get User Liked Manga

- **GET** `/liked-manga`
- **Auth Required**: Yes
- **Query Parameters**:
  - `search` (optional): Search by manga title
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `genre` (optional): Filter by genre
  - `status` (optional): Filter by manga status
- **Response**: Paginated list of liked manga with details

#### Check if Manga is Liked

- **GET** `/liked-manga/check/:mangaId`
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "liked": boolean
  }
  ```

#### Toggle Like

- **POST** `/liked-manga/toggle/:mangaId`
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "liked": boolean,
    "message": "string"
  }
  ```

#### Get Manga Like Count

- **GET** `/liked-manga/count/:mangaId`
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "mangaId": "string",
    "likeCount": number
  }
  ```

#### Get Most Liked Manga

- **GET** `/liked-manga/most-liked`
- **Auth Required**: Yes
- **Query Parameters**:
  - `limit` (optional): Number of results (default: 10)
- **Response**: Array of manga with like counts

## Notes

- All endpoints require JWT authentication
- Both modules include proper error handling for not found and conflict scenarios
- Pagination is supported with standard parameters
- Search functionality is case-insensitive
- All responses include proper TypeScript types and validation
