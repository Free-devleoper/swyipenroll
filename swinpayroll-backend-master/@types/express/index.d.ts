import { Express } from 'express-serve-static-core';

import { Role } from '../../app/enums';
import CustomLogger from '../../app/logger';
import { User as CustomUser } from '../../app/models';

declare global {
  namespace Express {
    class Logger extends CustomLogger {}
    class User extends CustomUser {};
    interface Request {
      logger: Logger;
    }
  }
}
