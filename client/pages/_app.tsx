import 'bootstrap/dist/css/bootstrap.css';
import { AppProps } from 'next/app';

import buildClient from '../api/build-client';
import { AppContext } from 'next/app';
import { User } from '../interfaces/user';
import Header from '../components/Header';

const AppComponent = ({ Component, pageProps }: AppProps) => {
  return (
    <div>
      <Header currentUser={pageProps.currentUser} />
      <div className='container'>
        <Component currentUser={pageProps.currentUser} {...pageProps} />
      </div>
    </div>
  );
};

AppComponent.getInitialProps = async (context: AppContext) => {
  const client = buildClient(context.ctx.req);
  const { data } = await client.get('/api/users/currentuser');
  const currentUser: User = data.currentUser;

  let pageProps = {};
  if (context.Component.getInitialProps) {
    const nextPageProps = {
      ...context.ctx,
      client,
      currentUser,
    };
    pageProps = await context.Component.getInitialProps(nextPageProps);
  }

  return { pageProps: { ...data, ...pageProps } };
};

export default AppComponent;
