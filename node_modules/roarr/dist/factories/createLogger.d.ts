import { type Logger, type MessageContext, type MessageEventHandler, type TransformMessageFunction } from '../types';
export declare const createLogger: (onMessage: MessageEventHandler, parentMessageContext?: MessageContext, transforms?: ReadonlyArray<TransformMessageFunction<MessageContext>>) => Logger;
//# sourceMappingURL=createLogger.d.ts.map