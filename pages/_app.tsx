import '../styles/globals.css'
import type { AppProps } from 'next/app'
import "@shopify/polaris/dist/styles.css";
import { Provider } from '../components/providers/Providers';


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <Component {...pageProps} />
    </Provider>
  )
}

export default MyApp

