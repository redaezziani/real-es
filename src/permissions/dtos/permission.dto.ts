import { HttpMethod } from '@prisma/client';

export class CreatePermissionDto {
  resource: string;
  method: HttpMethod;
  path: string;
  description?: string;
}

export class UpdatePermissionDto {
  resource?: string;
  method?: HttpMethod;
  path?: string;
  description?: string;
}
