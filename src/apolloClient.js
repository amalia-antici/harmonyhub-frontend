import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({ uri: 'http://localhost:8080/graphql'
  //link: new HttpLink({ uri: 'http://172.30.245.224:8080/graphql' 
  })
});

export default client;