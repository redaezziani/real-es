export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: PaginatedData<T>;
  message?: string;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}
