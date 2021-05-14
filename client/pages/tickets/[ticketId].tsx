import Router from 'next/router';

import { Method } from '../../api/rest-methods';
import useRequest from '../../hooks/useRequest';
import { Order } from '../../interfaces/order';
import { GetInitialPropsArg } from '../../interfaces/pages-getInitialProps';
import { Ticket } from '../../interfaces/ticket';

type TicketShowProps = { ticket: Ticket };

const TicketShow = ({ ticket }: TicketShowProps) => {
  const { doRequest, errors } = useRequest({
    url: '/api/orders',
    method: Method.post,
    body: {
      ticketId: ticket.id,
    },
    onSuccess: (order: Order) =>
      Router.push('/orders/[orderId]', `/orders/${order.id}`),
  });

  return (
    <div>
      <h1>{ticket.title}</h1>
      <h4>{ticket.price}</h4>
      {errors}
      <button onClick={() => doRequest()} className='btn btn-primary'>
        Purchase
      </button>
    </div>
  );
};

TicketShow.getInitialProps = async ({ query, client }: GetInitialPropsArg) => {
  const { ticketId } = query;
  const { data } = await client.get(`/api/tickets/${ticketId}`);

  return { ticket: data };
};

export default TicketShow;
