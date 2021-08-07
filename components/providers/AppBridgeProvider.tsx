import { FC } from 'react';
import { useRouter } from 'next/router'
import { Provider } from "@shopify/app-bridge-react";

export const AppBridgeProvider: FC = ({children}) => {
    const { query } = useRouter()
    const host = Array.isArray(query.host) ? query.host[0] :query.host || ''
    if (!host) {
        return <p>Loading...</p>
    }
  return (
    <Provider
      config={{
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY as string,
        host,
        forceRedirect: true
      }}>
      {children}
    </Provider>
  )
}