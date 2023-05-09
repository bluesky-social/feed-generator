type ProcessWarning = () => processWarning.Warning

declare namespace processWarning {
  export interface Warning {
    create(name: string, code: string, message: string, opts?: ProcessWarningOptions): BuildWarnOptsFn,
    emit(cod: string, a?: any, b?: any, c?: any): void,
    emitted: Map<string, boolean>
  }

  export type BuildWarnOptsFn = (a?: any, b?: any, c?: any) => WarnOpts

  export type ProcessWarningOptions = {
    unlimited?: boolean,
  }

  export interface WarnOpts {
    code: string;
    name: string;
    message: string;
  }

  export const processWarning: ProcessWarning
  export { processWarning as default }
}

declare function processWarning(...params: Parameters<ProcessWarning>): ReturnType<ProcessWarning>
export = processWarning
