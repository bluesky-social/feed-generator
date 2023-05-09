import { from } from './base.js'

const alphabet = Array.from('🚀🪐☄🛰🌌🌑🌒🌓🌔🌕🌖🌗🌘🌍🌏🌎🐉☀💻🖥💾💿😂❤😍🤣😊🙏💕😭😘👍😅👏😁🔥🥰💔💖💙😢🤔😆🙄💪😉☺👌🤗💜😔😎😇🌹🤦🎉💞✌✨🤷😱😌🌸🙌😋💗💚😏💛🙂💓🤩😄😀🖤😃💯🙈👇🎶😒🤭❣😜💋👀😪😑💥🙋😞😩😡🤪👊🥳😥🤤👉💃😳✋😚😝😴🌟😬🙃🍀🌷😻😓⭐✅🥺🌈😈🤘💦✔😣🏃💐☹🎊💘😠☝😕🌺🎂🌻😐🖕💝🙊😹🗣💫💀👑🎵🤞😛🔴😤🌼😫⚽🤙☕🏆🤫👈😮🙆🍻🍃🐶💁😲🌿🧡🎁⚡🌞🎈❌✊👋😰🤨😶🤝🚶💰🍓💢🤟🙁🚨💨🤬✈🎀🍺🤓😙💟🌱😖👶🥴▶➡❓💎💸⬇😨🌚🦋😷🕺⚠🙅😟😵👎🤲🤠🤧📌🔵💅🧐🐾🍒😗🤑🌊🤯🐷☎💧😯💆👆🎤🙇🍑❄🌴💣🐸💌📍🥀🤢👅💡💩👐📸👻🤐🤮🎼🥵🚩🍎🍊👼💍📣🥂')
const alphabetBytesToChars = /** @type {string[]} */ (alphabet.reduce((p, c, i) => { p[i] = c; return p }, /** @type {string[]} */([])))
const alphabetCharsToBytes = /** @type {number[]} */ (alphabet.reduce((p, c, i) => { p[/** @type {number} */ (c.codePointAt(0))] = i; return p }, /** @type {number[]} */([])))

/**
 * @param {Uint8Array} data
 * @returns {string}
 */
function encode (data) {
  return data.reduce((p, c) => {
    p += alphabetBytesToChars[c]
    return p
  }, '')
}

/**
 * @param {string} str
 * @returns {Uint8Array}
 */
function decode (str) {
  const byts = []
  for (const char of str) {
    const byt = alphabetCharsToBytes[/** @type {number} */ (char.codePointAt(0))]
    if (byt === undefined) {
      throw new Error(`Non-base256emoji character: ${char}`)
    }
    byts.push(byt)
  }
  return new Uint8Array(byts)
}

export const base256emoji = from({
  prefix: '🚀',
  name: 'base256emoji',
  encode,
  decode
})
