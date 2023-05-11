import express from 'express'

const makeRouter = (serverHostname: string) => {
  const router = express.Router()

  router.get('/.well-known/did.json', (_req, res) => {
    res.json({
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: `did:web:${serverHostname}`,
      service: [
        {
          id: '#bsky_fg',
          type: 'BskyFeedGenerator',
          serviceEndpoint: `https://${serverHostname}`,
        },
      ],
    })
  })

  return router
}
export default makeRouter
