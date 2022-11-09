import { promisify } from 'util';

import { Handler, Request } from 'express';
import { Secret, sign, verify } from 'jsonwebtoken';
import { omit, pick } from 'lodash';
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, VerifyCallbackWithRequest } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';

import { tokenSecret } from './config';
import crypto from './crypto';
import database from './database';
import { Role, TableName }  from './enums';
import Logger from './logger';
import { UserStore } from './models';

// constants
const TOKEN_EXPIRY_PERIOD = 1000 * 60 * 60 * 24 * 30; // 30 days

interface ModifiedRequest extends Request {
  roles: Role[];
}

interface Payload {
  id: string;
  iat: number;
}

class AuthManager {
  private logger = new Logger('auth-manager');
  private passport = passport;

  constructor() {
    this.configurePassport();
  }

  assertRoles(...roles: Role[]): Handler {
    return (req, res, next) => {
      (req as ModifiedRequest).roles = roles;

      this.passport.authenticate('user', {
        session: false
      })(req, res, next);
    };
  }

  assertUser() {
    // assert any role
    return this.assertRoles(...Object.values(Role));
  }

  authenticate() {
    return this.passport.authenticate('local', {
      session: false
    });
  }

  private configurePassport() {
    this.passport.use(new LocalStrategy({
      usernameField: 'email',
      session: false
    }, async (email, password, done) => {
      try {
        const user = await database.knex<UserStore>(TableName.USERS)
          .where('email', email.toLowerCase())
          .first();
        if (user) {
          const passwordIsCorrect = await crypto.verifyPassword(password, user.password_hash);
          done(null, passwordIsCorrect && this.sanitiseUser(user));
        } else {
          done(null, false);
        }
      } catch (err) {
        this.logger.error('error while authenticating user', {
          err
        });
        done(err);
      }
    }));

    this.passport.use('user', new JwtStrategy({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      secretOrKey: tokenSecret
    }, (async (req, payload: Payload, done) => {
      const { logger, roles } = (req as ModifiedRequest);

      try {
        const user = await database.knex<UserStore>(TableName.USERS)
          .where('id', payload.id)
          .first();
        const tokenValid = this.tokenIsValid(payload);
        const ret = tokenValid && typeof user === 'object' && user !== null && roles.includes(user.role) ? user : false;

        done(null, ret);

        if (ret) {
          logger.debug('verified user', {
            payload
          });
        } else {
          logger.warn('refused to verify user', {
            iat: payload.iat,
            user: user && this.sanitiseUser(user),
            tokenValid,
            payload,
            roles
          });
        }
      } catch (err) {
        done(err);
        logger.error('error while verifying user', {
          err
        });
      }
    }) as VerifyCallbackWithRequest));
  }

  async decodeUserToken(token: string): Promise<null | Payload> {
    try {
      const decoded = await promisify<string, Secret>(verify)((token || '').replace('Bearer ', ''), tokenSecret) as unknown as Payload;
      if (!decoded) {
        return null;
      }

      const user = await database.knex<UserStore>(TableName.USERS)
        .where('id', decoded.id)
        .first();
      if (user) {
        return decoded;
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  }

  initialise() {
    return this.passport.initialize();
  }

  private sanitiseUser<T extends object>(user: T): Partial<T> {
    return omit(user, ['password_hash']);
  }

  signUserObject(user: Partial<Payload> & Partial<UserStore>) {
    const payload = this.sanitiseUser(user);
    return {
      ...payload,
      token: sign({ id: payload.id }, tokenSecret)
    };
  }

  tokenIsValid({ iat }: Payload) {
    return typeof iat === 'number' && iat * 1000 >= Date.now() - TOKEN_EXPIRY_PERIOD;
  }
}

export default new AuthManager();
