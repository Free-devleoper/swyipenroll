import { tokenSecret } from './app/config';

if (!tokenSecret) {
  console.error('token secret not set');
  process.exit(1);
}

import './app/http-server';
