// 📄 src/auth/enums/role.enum.ts
export enum Role {
  EMPLOYE = 'EMPLOYE',
  ADMIN = 'ADMIN',
}

// Type étendu pour inclure le statut virtuel "MANAGER" dans les décorateurs @Roles()
export type ExtendedRole = Role | 'MANAGER';