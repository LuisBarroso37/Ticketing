import { IncomingMessage } from 'node:http';
import axios from 'axios';

// Local environment
// baseURL: 'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local'

const buildClient = (req?: IncomingMessage) => {
  // If we are on the server, we need to add the domain (base url) for ingress-nginx
  if (typeof window === 'undefined') {
    return axios.create({
      baseURL: 'http://www.ticketing-app.shop/',
      headers: req ? req.headers : null,
    });
  } else {
    // If we are on the browser, we let the browser add the domain for us
    return axios.create({
      baseURL: '/',
    });
  }
};

export default buildClient;
