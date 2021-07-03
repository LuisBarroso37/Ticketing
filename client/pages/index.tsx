import Link from 'next/link';

import { GetInitialPropsArg } from '../interfaces/pages-getInitialProps';
import { Ticket } from '../interfaces/ticket';

type LandingPageProps = { tickets: Ticket[] };

const LandingPage = ({ tickets }: LandingPageProps) => {
  const ticketList = tickets.map((ticket) => {
    return (
      <tr key={ticket.id}>
        <td>{ticket.title}</td>
        <td>{ticket.price}</td>
        <td>
          <Link href='/tickets/[ticketId]' as={`/tickets/${ticket.id}`}>
            <a>View Ticket</a>
          </Link>
        </td>
      </tr>
    );
  });

  return (
    <div>
      <h1>Tickets</h1>
      <table className='table'>
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>{ticketList}</tbody>
      </table>
    </div>
  );
};

LandingPage.getInitialProps = async ({ client }: GetInitialPropsArg) => {
  const { data } = await client.get('/api/tickets');

  return { tickets: data };
};

export default LandingPage;
