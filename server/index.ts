import Koa from 'koa'
import Router from 'koa-router'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {

    const server = new Koa()
    const router = new Router()
    router.all('(.*)', async (ctx) => {
        await handle(ctx.req, ctx.res)
        ctx.respond = false
    })

    server.use(async (ctx, next) => {
        ctx.res.statusCode = 200
        await next()
    })

    server.use(router.routes())
    server.listen(3100, () => {
        console.log('> Ready on http://localhost:3000')
    })

})
