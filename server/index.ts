import Koa from 'koa'
import Router from 'koa-router'

const server = new Koa()
const router = new Router()

router.get('/', (ctx) => {
    ctx.body = 'hello'
})

server.use(router.routes())

server.listen(3100, () => {
    console.log('> Ready on http://localhost:3000')
})