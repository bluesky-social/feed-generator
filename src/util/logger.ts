import fs from 'fs'
import path from 'path'
import { env } from './config.js'

process.stdout.write('Setting up logging file...')
const logDirPath = env.LOG_PATH
if (!fs.existsSync(logDirPath)) fs.mkdirSync(logDirPath, {recursive: true})
const logFilePath = path.join(logDirPath, `${new Date().toISOString().replaceAll(':','-').replace('.',',')}.txt`)
const logWriteStream = fs.createWriteStream(path.resolve(logFilePath), {encoding: 'utf8', flags: 'wx'})
const writeLog = (text: string) => {
  logWriteStream.write(`${text}\n`)
}
console.log(`\rSetting up logging file => ${logFilePath}`)
process.stdin.resume()
process.stdin.setEncoding('utf-8')
process.stdin.on('data', (data) => {
  process.stdout.write('\x1b[1A\x1b[2K> ')
})
process.stdout.write('> ')

const generateLogMessage = (level: string, levelColor: string, childs: string[], message: string): {text: string, log: string} => {
  const dateString: string = new Date().toISOString().replace('T',' ').replace('Z','')
  let prefixString: string = `${dateString} ${`[${level}]`.padEnd(8, ' ')}`
  for (const child of childs) {
    prefixString += `[${child}]: `
  }
  const messageArray: string[] = []
  message.split('\n').forEach((element, index) => {
    if (index === 0) {
      messageArray.push(element)
    } else {
      messageArray.push(`${' '.repeat(prefixString.length)}${element}`)
    }
  })
  const messageString: string = messageArray.join('\n')
  let childString: string = ""
  for (const child of childs) {
    childString += `[\x1b[32m${child}\x1b[0m]: `
  }
  return {
    text: `${prefixString}${messageString}`,
    log: `\x1b[90m${dateString}\x1b[0m [${levelColor}${`${level}\x1b[0m]`.padEnd(10, ' ')} ${childString}${messageString}`
  }
}

export interface Logger {
  debug(message: string): void
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}

export const createLogger = (childs: string[]): Logger => {
  return {
    debug: (message: string): void => {
      const {text, log} = generateLogMessage('DEBUG', '\x1b[35m', childs, message)
      if (!env.isProduction) {
        console.debug(`\r\x1b[2K${log}`)
        process.stdout.write('> ')
        writeLog(text)
      }
    },
    info: (message: string): void => {
      const {text, log} = generateLogMessage('INFO', '\x1b[36m', childs, message)
      console.info(`\r\x1b[2K${log}`)
      process.stdout.write('> ')
      writeLog(text)
    },
    warn: (message: string): void => {
      const {text, log} = generateLogMessage('WARN', '\x1b[33m', childs, message)
      console.warn(`\r\x1b[2K${log}`)
      process.stdout.write('> ')
      writeLog(text)
    },
    error: (message: string): void => {
      const {text, log} = generateLogMessage('ERROR', '\x1b[31m', childs, message)
      console.error(`\r\x1b[2K${log}`)
      process.stdout.write('> ')
      writeLog(text)
    }
  }
}

process.on('uncaughtException', (e) => {
  const text = `${e.stack}`
  console.error(`\r\x1b[2K${text}`)
  process.stdout.write('> ')
  writeLog(text)
  process.exit(1)
})

process.on('exit', () => logWriteStream.end())
