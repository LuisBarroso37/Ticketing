import { useState } from 'react';
import Router from 'next/router';

import useRequest from '../hooks/useRequest';
import { Method } from '../api/rest-methods';

type AuthFormProps = {
  type: 'signup' | 'signin';
};

const AuthForm = ({ type }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { doRequest, errors } = useRequest({
    url: '/api/users/signup',
    method: Method.post,
    body: {
      email,
      password,
    },
    onSuccess: () => Router.push('/'),
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await doRequest();
  };

  const text = type === 'signup' ? 'Sign Up' : 'Sign In';

  return (
    <form onSubmit={onSubmit}>
      <h1>{text}</h1>
      <div className='form-group'>
        <label>Email Address</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='form-control'
        />
      </div>
      {errors}
      <button className='btn btn-primary'>{text}</button>
    </form>
  );
};

export default AuthForm;
