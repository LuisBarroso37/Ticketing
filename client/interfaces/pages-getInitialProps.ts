import { AxiosInstance } from 'axios';
import { NextPageContext } from 'next';

import { User } from './user';

export type GetInitialPropsArg = NextPageContext & {
  client: AxiosInstance;
  currentUser: User;
};
