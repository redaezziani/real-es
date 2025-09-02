export const baseRoles = [
  {
    name: 'SUPER_ADMIN',
    description: 'Super administrator with full system access',
  },
  {
    name: 'ADMIN',
    description: 'Administrator with elevated privileges',
  },
  {
    name: 'MODERATOR',
    description: 'Content moderator with content management access',
  },
  {
    name: 'USER',
    description: 'Standard user with basic access',
  },
  {
    name: 'GUEST',
    description: 'Limited access for non-registered users',
  },
];

import { HttpMethod } from '@prisma/client';

export const basePermissions = [
  // User management
  {
    resource: 'users',
    method: HttpMethod.GET,
    path: '/users',
    description: 'View users',
  },
  {
    resource: 'users',
    method: HttpMethod.POST,
    path: '/users',
    description: 'Create users',
  },

  // Profile management
  {
    resource: 'profiles',
    method: HttpMethod.GET,
    path: '/profiles',
    description: 'View profiles',
  },
  {
    resource: 'profiles',
    method: HttpMethod.PATCH,
    path: '/profiles',
    description: 'Update profiles',
  },

  // Manga management
  {
    resource: 'manga',
    method: HttpMethod.GET,
    path: '/manga',
    description: 'View manga',
  },
  {
    resource: 'manga',
    method: HttpMethod.POST,
    path: '/manga',
    description: 'Create manga',
  },
  {
    resource: 'manga',
    method: HttpMethod.PATCH,
    path: '/manga',
    description: 'Update manga',
  },
  {
    resource: 'manga',
    method: HttpMethod.DELETE,
    path: '/manga',
    description: 'Delete manga',
  },
];

// Role-Permission mappings
export const rolePermissions = {
  SUPER_ADMIN: ['*'], // All permissions
  ADMIN: [
    'users.GET',
    'users.POST',
    'profiles.GET',
    'profiles.PATCH',
    'manga.GET',
    'manga.POST',
    'manga.PATCH',
    'manga.DELETE',
  ],
  MODERATOR: [
    'users.GET',
    'profiles.GET',
    'manga.GET',
    'manga.POST',
    'manga.PATCH',
  ],
  USER: ['profiles.GET', 'profiles.PATCH', 'manga.GET'],
  GUEST: ['manga.GET'],
};
