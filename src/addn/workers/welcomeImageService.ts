import workerpool from 'workerpool'
import { RichText } from '@atproto/api'

import { createCanvas, Image, loadImage } from 'canvas'
import { AtpSessionData, BskyAgent, CredentialSession } from '@atproto/api'
import { TaskSessionData } from '../tasks/task'
import { ThreadViewPost } from '../../lexicon/types/app/bsky/feed/defs.js'
import { NewMemberData } from '../tasks/newMemberTask'

interface UserProfileInfo {
  handle: string
  avatar: string | undefined
}

function buildAgent(taskSession): BskyAgent {
  const creds = new CredentialSession(new URL('https://bsky.social'))
  const data: AtpSessionData = {
    accessJwt: taskSession.access,
    refreshJwt: taskSession.refresh,
    did: taskSession.did,
    handle: taskSession.handle,
    active: taskSession.active,
  }
  creds.resumeSession(data)

  // Rebuild Agent
  return new BskyAgent(creds)
}

function dataURLToUint8Array(dataURL: string): Uint8Array {
  const base64 = dataURL.split(',')[1] // Extract the base64 part
  const binaryString = atob(base64) // Decode the base64 string
  const len = binaryString.length
  const bytes = new Uint8Array(len)

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes
}

async function sendWelcomeMessage(
  taskSession: TaskSessionData,
  member: NewMemberData,
) {
  // Get agent
  const agent: BskyAgent = buildAgent(taskSession)

  const imgWidth = 1080
  const imgHeight = 1080
  let image1: Image
  let image2: Image = new Image()

  // Get User Data
  const userProfile = await agent.app.bsky.actor.getProfile({
    actor: member.author,
  })

  const handle = userProfile.data.handle
  const avatar = userProfile.data.avatar

  // Begin creating our image
  const canvas = createCanvas(imgWidth, imgHeight)
  const ctx = canvas.getContext('2d')

  // Get Random base image
  const randomImg = Math.floor(Math.random() * 4) + 1
  image1 = await loadImage(`images/bey-welcome${randomImg}.png`)

  if (avatar) {
    image2 = await loadImage(avatar)
  }

  ctx.quality = 'fast'
  ctx.drawImage(image1, 0, 0, imgWidth, imgHeight)

  ctx.font = 'normal 900 25px serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'right'
  ctx.fillText(`@${handle}`, 520, 98)
  ctx.restore()

  const circle = {
    x: 280,
    y: 550,
    radius: 165,
  }

  if (image2.complete) {
    const aspect = 290 / 290

    // Shadow
    ctx.shadowColor = 'black'
    ctx.shadowBlur = 15

    ctx.save()
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.clip()

    const hsx = circle.radius * Math.max(1.0 / aspect, 1.0)
    const hsy = circle.radius * Math.max(aspect, 1.0)

    ctx.drawImage(image2, circle.x - hsx, circle.y - hsy, hsx * 2, hsy * 2)
  }

  const image = await canvas.toDataURL('image/jpeg', 90)
  const { data } = await agent.uploadBlob(dataURLToUint8Array(image))

  const rt = new RichText({
    text: `Hi @${handle}! ✨ Welcome to the BeyHive Interactive feed! 🐝`,
  })
  await rt.detectFacets(agent)

  // Get the thread this post is a part of
  const threadRes = await agent.getPostThread({
    uri: member.uri,
  })
  const { thread } = threadRes.data

  await sendPost(agent, thread, rt, data, imgWidth, imgHeight)
}

/**
 * Constructs an instance from a ThreadViewPost.
 */
function fromThreadView(view: ThreadViewPost): any {
  if (!is('app.bsky.feed.post', view.post.record)) {
    throw new Error('Invalid post view record')
  }

  const parent =
    view.parent?.$type === 'app.bsky.feed.defs#threadViewPost'
      ? fromThreadView(view.parent as ThreadViewPost)
      : undefined
  const children = view.replies
    ?.map((reply) =>
      reply.$type === 'app.bsky.feed.defs#threadViewPost'
        ? fromThreadView(reply as ThreadViewPost)
        : undefined,
    )
    ?.filter((reply) => reply !== undefined)

  return { post: view.post, parent, children }
}

function getThreadRoot(view: ThreadViewPost): any {
  if (view.parent) {
    return getThreadRoot(view.parent as ThreadViewPost)
  } else {
    return view
  }
}

function is(lexicon, obj) {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '$type' in obj &&
    (obj.$type === lexicon || obj.$type === lexicon + '#main')
  )
}

async function sendPost(agent, thread, richText, data, imgWidth, imgHeight) {
  switch (thread?.$type) {
    case 'app.bsky.feed.defs#threadViewPost': {
      let view = fromThreadView(thread as ThreadViewPost)
      let root = getThreadRoot(view)

      await agent.post({
        text: richText?.text,
        facets: richText?.facets,
        embed: {
          $type: 'app.bsky.embed.images',
          images: [
            // can be an array up to 4 values
            {
              alt: 'Welcome to #BeyHive', // the alt text
              image: data.blob,
              aspectRatio: {
                // a hint to clients
                width: imgWidth,
                height: imgHeight,
              },
            },
          ],
        },
        createdAt: new Date().toISOString(),
        reply: {
          root: {
            uri: root.post.uri,
            cid: root.post.cid,
          },
          parent: {
            uri: view.post.uri,
            cid: view.post.cid,
          },
        },
      })

      break
    }
  }
}

// create a worker and register public functions
workerpool.worker({
  sendWelcomeMessage,
})
