import knex from 'knex';

import { database as databaseConfig } from './config';

const [host, port] = databaseConfig.host.split(':');
const parsedPort = parseInt(port ?? '3306', 10);

export class Database {
  knex = knex({
    client: 'mysql2',
    connection: {
      host,
      user: databaseConfig.username,
      password: databaseConfig.password,
      database: databaseConfig.name,
      port: parsedPort,
      dateStrings: true
    }
  });
}

export default new Database();
