export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: {
    items: T[];
    meta: {
      currentPage: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

export interface SingleResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
