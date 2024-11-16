export interface ITask {
  run: (interval: number, ...args: unknown[]) => void
}
