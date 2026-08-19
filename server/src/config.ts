import { existsSync } from "node:fs";

if (existsSync(".env")) 
{
  process.loadEnvFile(".env");
}

export const PORT = Number(process.env.PORT ?? 3001);
export const SYSACAD_BASE_URL = process.env.SYSACAD_BASE_URL ?? `http://localhost:${PORT}/mock-sysacad`;
