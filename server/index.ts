import Koa from 'koa'
import Router from 'koa-router'
import next from 'next'
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import dotenv from 'dotenv'

dotenv.config()

const {
  PORT,
  NODE_ENV,
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SCOPES,
  HOST
} = process.env as any

const port = parseInt(PORT, 10) || 8081;
const dev = NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

Shopify.Context.initialize({
    API_KEY: SHOPIFY_API_KEY,
    API_SECRET_KEY: SHOPIFY_API_SECRET,
    SCOPES: SCOPES.split(","),
    HOST_NAME: HOST.replace(/https:\/\//, ""),
    API_VERSION: ApiVersion.October20,
    IS_EMBEDDED_APP: true,
    // This should be replaced with your preferred storage strategy
    SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
  });
  
// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS: {
    [shop: string]: string
} = {};


const handleRequest = async (ctx: any) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

app.prepare().then(() => {

    const server = new Koa()
    const router = new Router()
    server.keys = [Shopify.Context.API_SECRET_KEY];
    server.use(
      createShopifyAuth({
        async afterAuth(ctx) {
          // Access token and shop available in ctx.state.shopify
          const { shop, accessToken, scope } = ctx.state.shopify;
          const host = ctx.query.host;
          ACTIVE_SHOPIFY_SHOPS[shop] = scope;
  
          const response = await Shopify.Webhooks.Registry.register({
            shop,
            accessToken,
            path: "/webhooks",
            topic: "APP_UNINSTALLED",
            webhookHandler: async (topic, shop, body) => {
              if (shop && ACTIVE_SHOPIFY_SHOPS[shop]) { 
                delete ACTIVE_SHOPIFY_SHOPS[shop]
              }
            },
          });
  
          if (!response.success) {
            console.log(
              `Failed to register APP_UNINSTALLED webhook: ${response.result}`
            );
          }
  
          // Redirect to app with shop parameter upon auth
          ctx.redirect(`/?shop=${shop}&host=${host}`);
        },
      })
    );

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    const shop = (() => {
        const { shop } = ctx.query
        if (!shop) return undefined
        if (typeof shop === 'string') return shop
        return shop[0]
    })();

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (!shop || ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });

})
