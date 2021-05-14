import { Order } from '../../interfaces/order';
import { GetInitialPropsArg } from '../../interfaces/pages-getInitialProps';

type OrdersProps = { orders: Order[] };

const Orders = ({ orders }: OrdersProps) => {
  return (
    <ul>
      {orders.map((order) => {
        return (
          <li key={order.id}>
            {order.ticket.title} - {order.status}
          </li>
        );
      })}
    </ul>
  );
};

Orders.getInitialProps = async ({ client }: GetInitialPropsArg) => {
  const { data } = await client.get('/api/orders');

  return { orders: data };
};

export default Orders;
