export interface ITask {
  run: (interval: number, ...args: unknown[]) => void
}

export interface TaskSessionData {
  access: string
  refresh: string
  did: string
  handle: string
  active: boolean
}
