import express from 'express'
import { type AppContext } from './util/config.js'

const makeRouter = (ctx: AppContext): express.Router => {
  const router = express.Router()

  router.get('/.well-known/did.json', (_req, res) => {
    if (!ctx.cfg.service.did.endsWith(ctx.cfg.service.hostname)) {
      return res.sendStatus(404)
    }
    res.json({
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: ctx.cfg.service.did,
      service: [
        {
          id: '#bsky_fg',
          type: 'BskyFeedGenerator',
          serviceEndpoint: `https://${ctx.cfg.service.hostname}`,
        },
      ],
    })
  })

  return router
}
export default makeRouter
