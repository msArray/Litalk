import { Hono } from 'hono'
import { createBunWebSocket, serveStatic } from 'hono/bun'
import { WSContext, WSMessageReceive } from 'hono/ws';
import { minify } from 'terser'
import * as fs from "fs"
import * as path from "path"

const { upgradeWebSocket, websocket } = createBunWebSocket()

interface IMessage {
  message: WSMessageReceive;
  time: number;
  id: string;
}

let script: string;

(async () => {
  const src = path.resolve(__dirname, './script.js');
  const srcCode = fs.readFileSync(src, 'utf-8');

  const { code } = await minify(srcCode, {
    mangle: true,
  });

  if (!code) {
    throw 'failed!'
  }

  script = code;
})()

const app = new Hono()
const db: IMessage[] = [];
const rdb: { [key: string]: IMessage[] } = {};
const connections: WSContext[] = [];
const rconn: { [key: string]: WSContext[] } = {};

app.use(serveStatic({ root: 'public' }))

const App = ({ title, path }: { title?: string, path: string }) => {
  return (
    <html>
      <head>
        <meta charset='UTF-8' />
        <link rel="stylesheet" href="/s.min.css" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0" />
        <title>Litalk {title}</title>
      </head>
      <body>
        <ul>
          <li>
            返信
          </li>
          <li>
            メッセージをコピー
          </li>
        </ul>
        <main>
          <section>
            <a href="/setting">設定</a>
          </section>
          <div>
            <input type="text" placeholder='ここに文字を入力' max={400} />
            <button disabled>送信</button>
          </div>
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: script.replace(new RegExp("DB_URL", "g"), "'" + (path == "ws" ? "/db" : ("/rwsdb/" + path)) + "'").replace(new RegExp("WS_URL"), process.env.WS_URL ? `'${process.env.WS_URL}'` : `'wss://refactored-sniffle-949g99pv7rqcpxpx-3000.app.github.dev/${path}'`)
          }}
        ></script>
      </body>
    </html>
  )
}

const Setting = () => {
  return (
    <html>
      <head>
        <meta charset='UTF-8' />
        <link rel="stylesheet" href="/s.min.css" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0" />
        <title>Litalk 設定</title>
      </head>
      <body>
        <main>
          <section>
            <p>名前は最大20文字までです</p><br />
            <p>アイコンURLは<a href="https://imgur.com/">Imgur</a>のURLを指定してください</p>
          </section>
          <div>
            <input type="text" placeholder='名前' />
            <button>保存</button>
          </div>
          <div>
            <input type="text" placeholder='アイコンURL https://i.imgur.com/<imgurID>.<png | jpg | gif>' />
            <button>保存</button>
          </div>
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: `let d=[document,"querySelectorAll"];d[0][d[1]]("button").forEach((e,t)=>{console.log(e),e.addEventListener("click",()=>localStorage.setItem("key"+t,d[0][d[1]]("input")[t].value))});`
          }}
        ></script>
      </body>
    </html>
  )

}

app.get('/', (c) => {
  return c.html(<App title='Portal' path='ws' />)
})

app.get('/room/:id', (c) => {
  return c.html(<App title={`Room ${c.req.param('id')}`} path={`rws/${c.req.param('id')}`} />)
})

app.get('/setting', (c) => {
  return c.html(<Setting />)
})

app.get('/db', (c) => {
  return c.json(db);
})

app.get('/rwsdb/rws/:id', (c) => {
  return c.json(rdb[c.req.param('id')] || []);
})

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onOpen(_event, ws) {
        connections.push(ws)
        ws.send(JSON.stringify({
          message: 'Hello from server',
          time: Date.now(),
          id: 'server',
        }))
      },
      onMessage(event, ws) {
        const rand = Math.random().toString(36).slice(-8);
        db.push({
          message: event.data,
          time: Date.now(),
          id: rand,
        })
        connections.forEach((conn) => {
          conn.send(JSON.stringify({
            message: event.data,
            time: Date.now(),
            id: rand,
          }))
        })
      },
      onClose(_event) {
        console.log('Connection closed')
      }
    }
  })
)

app.get('/rws/:id', upgradeWebSocket((c) => {
  return {
    onOpen(_event, ws) {
      if (!rconn[c.req.param('id')]) {
        rconn[c.req.param('id')] = []
      }
      rconn[c.req.param('id')].push(ws)
      ws.send(JSON.stringify({
        message: `Hello from room ${c.req.param('id')}`,
        time: Date.now(),
        id: 'server',
      }))
    },
    onMessage(event, ws) {
      const rand = Math.random().toString(36).slice(-8);
      if (!rdb[c.req.param('id')]) {
        rdb[c.req.param('id')] = []
      }
      rdb[c.req.param('id')].push({
        message: event.data,
        time: Date.now(),
        id: rand,
      })
      rconn[c.req.param('id')].forEach((conn) => {
        conn.send(JSON.stringify({
          message: event.data,
          time: Date.now(),
          id: rand,
        }))
      })
    },
    onClose(_event) {
      console.log('Connection closed')
    }
  }
}))

Bun.serve({
  port: process.env.PORT || 3000,
  fetch: app.fetch,
  websocket,
})