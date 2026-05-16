import { t, type Static } from "elysia";

export const userRolesType = {
  user: "user",
  mentor: "mentor",
  admin: "admin",
} as const;

export const userType = t.Object({
  id: t.String(),
  email: t.String(),
  name: t.String(),
  role: t.Enum(userRolesType),
  createdAt: t.Date(),
})

export type User = Static<typeof userType>;
export type UserRole = User["role"];