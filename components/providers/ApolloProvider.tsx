import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticatedFetch } from "@shopify/app-bridge-utils";
import { Redirect } from "@shopify/app-bridge/actions";
import ApolloClient from "apollo-boost";
import { ApolloProvider as ReactApolloProvider } from "react-apollo";
import { FC } from 'react';

const useApolloClient = () => {
  const app = useAppBridge();
  const fetchFunction = authenticatedFetch(app);

  const client = new ApolloClient({
    fetch: async (uri, options) => {
      const response = await fetchFunction(uri, options);
  
      if (
        response.headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1"
      ) {
        const authUrlHeader = response.headers.get(
          "X-Shopify-API-Request-Failure-Reauthorize-Url"
        );
  
        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.APP, authUrlHeader || `/auth`);
        return null as any;
      }
  
      return response;
    },
    fetchOptions: {
      credentials: "include",
    },
  });
  return {
    client
  }
}

export const ApolloProvider: FC = ({children}) => {
  const {client} = useApolloClient()
  return (
    <ReactApolloProvider client={client}>
      {children}
    </ReactApolloProvider>
  )
}