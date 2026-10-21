import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
export const session = {
  get: () => localStorage.getItem("libraryToken"),
  save: (token) => localStorage.setItem("libraryToken", token),
  remove: () => localStorage.removeItem("libraryToken"),
};
const http = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || "http://localhost:4000",
});
const auth = new SetContextLink(({ headers }) => ({
  headers: {
    ...headers,
    authorization: session.get() ? "Bearer " + session.get() : "",
  },
}));
const websocket = new GraphQLWsLink(
  createClient({
    url: import.meta.env.VITE_GRAPHQL_WS_URL || "ws://localhost:4000/graphql",
    connectionParams: () => ({
      authorization: session.get() ? "Bearer " + session.get() : "",
    }),
  }),
);
const link = split(
  ({ query }) => {
    const d = getMainDefinition(query);
    return d.kind === "OperationDefinition" && d.operation === "subscription";
  },
  websocket,
  auth.concat(http),
);
export const client = new ApolloClient({ link, cache: new InMemoryCache() });
