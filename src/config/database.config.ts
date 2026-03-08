import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import 'dotenv/config';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url:
    process.env.NODE_ENV !== 'production'
      ? process.env.EXTERNAL_DATABASE_URL
      : process.env.DATABASE_URL,

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  synchronize: process.env.NODE_ENV !== 'production',

  logging: ['error', 'warn'],

  ssl: {
    rejectUnauthorized: false,
  },

  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
};
