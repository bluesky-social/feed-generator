/**
 *
 * @param timeWithOffset hh:mm:ss(optional)±hh:mm(optional)
 * @param s separator between hours, minutes and optional seconds
 * @param isTimezoneCheckOn boolean flag, pass true not to check for valid timezone
 */
export declare function isValidTime(timeWithOffset: string, s?: string, isTimezoneCheckOn?: boolean): boolean;
