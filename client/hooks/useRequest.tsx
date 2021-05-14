import axios from 'axios';
import { useState } from 'react';

import { Method } from '../api/rest-methods';

interface Error {
  message: string;
  field?: string;
}

interface UseRequestArgs<T> {
  url: string;
  method: Method;
  body: T;
  onSuccess?(data: unknown): void;
}

function useRequest<T>({ url, method, body, onSuccess }: UseRequestArgs<T>) {
  const [errors, setErrors] = useState<JSX.Element | null>(null);

  const doRequest = async (props = {}) => {
    try {
      const response = await axios[method](url, { ...body, ...props });
      setErrors(null); // Clear errors every time this hook is called

      if (onSuccess) {
        onSuccess(response.data);
      }

      return response.data;
    } catch (err) {
      setErrors(
        <div className='alert alert-danger'>
          <ul className='my-0'>
            {err.response.data.errors.map((error: Error) => {
              return <li key={error.message}>{error.message}</li>;
            })}
          </ul>
        </div>
      );
    }
  };

  return { doRequest, errors };
}

export default useRequest;
