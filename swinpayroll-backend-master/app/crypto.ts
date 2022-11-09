import { compare, hash } from 'bcrypt';

const SALT_ROUNDS = 10;

class Crypto {
  hashPassword(password: string) {
    return hash(password, SALT_ROUNDS);
  }

  verifyPassword(password: string, hash: string) {
    return compare(password, hash);
  }
}

export default new Crypto();
