import {createTRPCReact} from '@trpc/react-query';
import type {Router} from '../../api-express-drizzle/src/router';

export const trpc = createTRPCReact<Router>();
