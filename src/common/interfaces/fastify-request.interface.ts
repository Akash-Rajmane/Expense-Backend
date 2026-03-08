import { FastifyRequest } from 'fastify';

export interface AuthenticatedFastifyRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
  };
}
