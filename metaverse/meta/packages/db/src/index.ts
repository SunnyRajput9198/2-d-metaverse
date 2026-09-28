import { PrismaClient } from "../generated/client";
export type { Prisma } from "../generated/client";

const client = new PrismaClient();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => void client.$disconnect());
}

// Named export for destructured imports: import { client } from "@repo/db"
export { client };

// Default export for: import client from "@repo/db"
export default client;
