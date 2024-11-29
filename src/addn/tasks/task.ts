import { Database } from '../../db'

export interface ITask {
  name: string
  run: (interval: number, ...args: unknown[]) => void
  checkTask: (db: Database) => Promise<boolean>
}

export interface TaskSessionData {
  access: string
  refresh: string
  did: string
  handle: string
  active: boolean
}
