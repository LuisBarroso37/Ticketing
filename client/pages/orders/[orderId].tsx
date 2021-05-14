import Router from 'next/router';
import { useEffect, useState } from 'react';
import StripeCheckout from 'react-stripe-checkout';

import { Method } from '../../api/rest-methods';
import useRequest from '../../hooks/useRequest';
import { Order } from '../../interfaces/order';
import { GetInitialPropsArg } from '../../interfaces/pages-getInitialProps';
import { User } from '../../interfaces/user';

type OrderShowProps = { order: Order; currentUser: User };

const OrderShow = ({ order, currentUser }: OrderShowProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: Method.post,
    body: {
      orderId: order.id,
    },
    onSuccess: () => Router.push('/orders'),
  });

  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt).valueOf() - new Date().valueOf();
      setTimeLeft(Math.round(msLeft / 1000));
    };

    findTimeLeft(); // Update time left immediatly on render innstead of waiting 1 second
    const timerId = setInterval(findTimeLeft, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  if (timeLeft < 0) {
    return <div>Order Expired</div>;
  }

  return (
    <div>
      <h1>Time left to pay: {timeLeft} seconds</h1>
      <StripeCheckout
        token={({ id }) => doRequest({ token: id })}
        stripeKey={process.env.NEXT_PUBLIC_STRIPE_KEY!}
        amount={order.ticket.price * 100}
        email={currentUser?.email}
      />
      {errors}
    </div>
  );
};

OrderShow.getInitialProps = async ({
  query,
  client,
  currentUser,
}: GetInitialPropsArg) => {
  const { orderId } = query;
  const { data } = await client.get(`/api/orders/${orderId}`);

  return { order: data, currentUser };
};

export default OrderShow;
