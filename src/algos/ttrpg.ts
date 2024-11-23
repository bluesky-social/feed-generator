import { InvalidRequestError } from '@atproto/xrpc-server'
import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'

export const shortname = 'aaabotewjkiv4'

const terms = [
  // general
  'ttrpgs?',
  'tabletop rpg',
  'tabletop roleplaying',
  'tabletop game',
  'tabletop gaming',
  'game master',
  'dungeon master',
  'character art',

  // promo stuff
  'self(-\\s)promo saturday',
  'wip wednesday',
  'ttrpg rising',

  // events
  'gen con (2023)?',
  'big bad con',

  // shows
  'critical role',
  'dimension 20',
  'dungeons and daddies',
  'dungeons & daddies',
  'glass cannon pod',
  'the adventure zone',
  'not another d&d pod',
  'nadp pod',

  // publishers
  'free league',
  'wotc',
  'wizards of the coast',
  'paizo',
  'limithron',
  'evil genius games',
  'evil hat productions',
  'r.? talsorian',
  'darrington press',

  // creators
  'bob the world builder',
  'matt(hew)? colville',
  'mcdm',
  'ginny di',
  'dungeon dudes',
  'pointy hat',
  'jp coovert',
  'the dm lair',
  'bonus action',
  'map crow',
  'arcane anthems',
  "griffon'?s saddlebag",

  // D&D
  'dungeons and dragons',
  'dungeons & dragons',
  'd&d',
  'dnd',
  'd&d beyond',
  'dndbeyond',
  'dnd beyond',

  // paizo
  'pathfinder',
  'starfinder',

  // Free League
  'mork borg',
  'pirate borg',
  'death in space',
  'the one ring',
  'vast grimm',
  'cy_borg',
  'mutant year zero',
  'tales from the loop',
  'vaesen',

  // other games
  'tormenta',
  'das schwarze auge',
  'apocalypse world',
  'mutants and masterminds',
  'shadowrun',
  'savage worlds',
  'vampire: the masquerade',
  'lancer',
  'dungeon world',
  'transformers rpg',
  'warhammer',
  'wrath and glory',
  'wrath & glory',
  'mutant:? year zero',
  'alien rpg',
  'fate system',
  'gurps',
  'cyberpunk red',
  'blades in the dark',
  'urban shadows',
  'symbaroum',
  'shadowdark',
  'call of cthulhu',
  'dish pit witches',
  'liminal horror',
  'into the cess & citadel',
  'into the wyrd & wild',
  'thirsty swords lesbians',
  'quest rpg',
  'coyote & crow',
  'coyote and crow',
  'troika',
  'mothership rpg',
  'mother lands rpg',
  'witcher rpg',
  'powered by the apocalypse',
  'pbta',
  'forged in the dark',
  'candela obscura',
  'daggerheart',
  'monster hearts',
  'eco mofos',
  'monsters and counselors',
  '(Æ|æ|ae)lf',

  // looser terms
  'worldbuilding',
  'worldanvil',
  'role20',
  'foundry vtt',
  'alchemy rpg',

  // awards
  'ennies',
  'crit awards',
]

const excludeTerms = ['crit(ical)? role spoilers?', 'nofeed', 'nottrpgfeed']

const emojis = ['🎲']

import buildRegex from './buildRegex'

export const matchRegex = buildRegex(terms)
const excludeRegex = buildRegex(excludeTerms)

export const matcher = (post) => {
  const matchTerms = matchRegex.test(post.record.text.toLowerCase())
  const matchEmoji = emojis.some((emoji) => post.record.text.includes(emoji))
  const optout = excludeRegex.test(post.record.text.toLowerCase())
  return !optout && (matchTerms || matchEmoji)
}

export const filterAndMap = (posts) =>
  posts.filter(matcher).map((create) => {
    return {
      uri: create.uri,
      cid: create.cid,
      replyParent: create.record?.reply?.parent.uri ?? null,
      replyRoot: create.record?.reply?.root.uri ?? null,
      indexedAt: new Date().toISOString(),
    }
  })

const pinnedMessage = ''

export const handler = async (ctx: AppContext, params: QueryParams) => {
  let builder = ctx.db
    .selectFrom('post')
    .innerJoin('post_tag', 'post_tag.post_uri', 'post.uri')
    .where('post_tag.tag', '=', shortname)
    .selectAll('post')
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit)

  if (params.cursor) {
    const [indexedAt, cid] = params.cursor.split('::')
    if (!indexedAt || !cid) {
      throw new InvalidRequestError('malformed cursor')
    }
    const timeStr = new Date(parseInt(indexedAt, 10)).toISOString()
    builder = builder
      .where((eb) =>
        eb.or([
          eb('post.indexedAt', '<', timeStr),
          eb('post.indexedAt', '=', timeStr),
        ]),
      )
      .where('post.cid', '<', cid)
  }
  const res = await builder.execute()

  const feed = res.map((row) => ({
    post: row.uri,
  }))

  if (pinnedMessage) {
    feed.unshift({ post: pinnedMessage })
  }

  let cursor: string | undefined
  const last = res.at(-1)
  if (last) {
    cursor = `${new Date(last.indexedAt).getTime()}::${last.cid}`
  }

  return {
    cursor,
    feed,
  }
}
