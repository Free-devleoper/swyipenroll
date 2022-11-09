import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const database = {
  host: process.env.DB_HOST ?? 'localhost',
  name: process.env.DB_NAME ?? 'swinpayroll',
  password: process.env.DB_PASS ?? '',
  username: process.env.DB_USER ?? 'root'
};
export const httpPort = parseInt(process.env.PORT ?? '8080', 10);
export const tokenSecret = process.env.TOKEN_SECRET as string;
