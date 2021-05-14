import Link from 'next/link';
import { User } from '../interfaces/user';

type HeaderProps = { currentUser: User };

const Header = ({ currentUser }: HeaderProps) => {
  const links: JSX.Element[] = [
    {
      label: 'Sign Up',
      href: '/auth/signup',
      show: currentUser ? false : true,
    },
    {
      label: 'Sign In',
      href: '/auth/signin',
      show: currentUser ? false : true,
    },
    {
      label: 'Sell Tickets',
      href: '/tickets/new',
      show: currentUser ? true : false,
    },
    {
      label: 'My Orders',
      href: '/orders',
      show: currentUser ? true : false,
    },
    {
      label: 'Sign Out',
      href: '/auth/signout',
      show: currentUser ? true : false,
    },
  ]
    .filter((link) => link.show)
    .map((link) => {
      return (
        <li key={link.href} className='nav-item'>
          <Link href={link.href}>
            <a className='nav-link'>{link.label}</a>
          </Link>
        </li>
      );
    });

  return (
    <nav className='navbar navbar-light bg-light'>
      <Link href='/'>
        <a className='navbar-brand'>GitTix</a>
      </Link>
      <div className='d-flex justify-content-end'>
        <ul className='nav d-flex align-items-center'>{links}</ul>
      </div>
    </nav>
  );
};

export default Header;
