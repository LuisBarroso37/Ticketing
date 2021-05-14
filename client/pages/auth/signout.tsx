import { useEffect } from 'react';
import Router from 'next/router';

import { Method } from '../../api/rest-methods';
import useRequest from '../../hooks/useRequest';

const SignOut = () => {
  const { doRequest } = useRequest({
    url: '/api/users/signout',
    method: Method.post,
    body: {},
    onSuccess: () => Router.push('/'),
  });

  useEffect(() => {
    const logout = async () => {
      await doRequest();
    };

    logout();
  }, []);

  return <div>Signing you out...</div>;
};

export default SignOut;
