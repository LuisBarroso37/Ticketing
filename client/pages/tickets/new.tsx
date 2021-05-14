import Router from 'next/router';
import { useState } from 'react';
import { Method } from '../../api/rest-methods';
import useRequest from '../../hooks/useRequest';

interface Ticket {
  title: string;
  price: string;
}

const NewTicket = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const { doRequest, errors } = useRequest<Ticket>({
    url: '/api/tickets',
    method: Method.post,
    body: {
      title,
      price,
    },
    onSuccess: () => Router.push('/'),
  });

  // When user clicks out of the price input
  const onBlur = () => {
    const value = parseFloat(price);

    if (isNaN(value)) {
      return;
    }

    // Round price to 2 point decimal
    setPrice(value.toFixed(2));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await doRequest();
  };

  return (
    <div>
      <h1>Create a Ticket</h1>
      <form onSubmit={onSubmit}>
        <div className='form-group'>
          <label>Title</label>
          <input
            value={title}
            className='form-control'
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className='form-group'>
          <label>Price</label>
          <input
            value={price}
            className='form-control'
            onBlur={onBlur}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        {errors}
        <button className='btn btn-primary'>Submit</button>
      </form>
    </div>
  );
};

export default NewTicket;
