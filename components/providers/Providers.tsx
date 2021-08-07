import { FC } from 'react';
import { AppProvider } from "@shopify/polaris";
import translations from "@shopify/polaris/locales/en.json";
import { ApolloProvider } from './ApolloProvider';
import { AppBridgeProvider } from './AppBridgeProvider';

export const Provider: FC = ({children}) => (
    <AppProvider i18n={translations}>
        <AppBridgeProvider>
            <ApolloProvider>
                {children}
            </ApolloProvider>
        </AppBridgeProvider>
    </AppProvider>
)