import { PrismaClient } from "../generated/client";

const client = new PrismaClient();

// Named export for destructured imports: import { client } from "@repo/db"
export { client };

// Default export for: import client from "@repo/db"
export default client;
