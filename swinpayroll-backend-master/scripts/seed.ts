import { v4 } from 'uuid';

import crypto from '../app/crypto';
import database from '../app/database';
import { Role, TableName } from '../app/enums';
import Logger from '../app/logger';
import { UserStore } from '../app/models';

const DEFAULT_EMAIL = 'staff@swinpayroll.xyz';
const DEFAULT_PASSWORD = 'password';

const logger = new Logger('seed-script');

/**
 * exit codes:
 * 0 - success
 * 1 - user already exists
 * 2 - unknown error
 */

(async () => {
  logger.info('seeding default user...');
  const user = await database.knex<UserStore>(TableName.USERS)
    .where('email', DEFAULT_EMAIL)
    .first();
  if (user) {
    logger.warn('default user already exists, exiting');
    process.exit(1);
    return;
  }

  try {
    await database.knex<UserStore>(TableName.USERS)
      .insert({
        id: v4(),
        name: 'Default User',
        email: DEFAULT_EMAIL,
        password_hash: await crypto.hashPassword(DEFAULT_PASSWORD),
        role: Role.LEVEL_1
      });
    logger.info('seeded default user', {
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD
    });
    process.exit();
  } catch (error) {
    logger.error('error while seeding default user', {
      error
    });
    process.exit(2);
  }
})();
