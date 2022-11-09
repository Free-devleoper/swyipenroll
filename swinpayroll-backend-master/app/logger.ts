import fs from 'fs';
import { inspect } from 'util';

import chalk from 'chalk';

import { LOG_FILE_DIR } from './constants';
import { LogLevel } from './enums';

type Data = unknown[];
type MetadataData = Record<string, unknown>;
type Metadata = null | MetadataData | (() => MetadataData);

export default class Logger {
  private metadata: Metadata;
  private prefix: string;
  private static writeQueue = Promise.resolve();

  debug = this.logAlias(LogLevel.DEBUG);
  error = this.logAlias(LogLevel.ERROR);
  info = this.logAlias(LogLevel.INFO);
  warn = this.logAlias(LogLevel.WARN);

  constructor(prefix: string, metadata: Metadata = null) {
    this.prefix = prefix;
    this.metadata = metadata;
  }

  private static getChalkColour(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
        return 'cyan';
      case LogLevel.INFO:
        return 'green';
      case LogLevel.WARN:
        return 'yellow';
      case LogLevel.ERROR:
        return 'red';
    }
  }

  private getConsoleLevel(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        return 'log';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.ERROR:
        return 'error';
    }
  }

  static getFilenameToday() {
    const now = new Date();
    const pad = (number: number) => number.toString().padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.log`;
  }

  private getLogString(level: LogLevel, file: boolean) {
    const date = new Date();
    const time = date.toLocaleTimeString('en-US', {
      hour12: false
    });
    const milliseconds = date.getMilliseconds().toString().padEnd(3, '0');
    const levelString = level.toUpperCase();
    const chalkColour = Logger.getChalkColour(level);
    return `${time}:${milliseconds} ${file ? levelString : chalk[chalkColour](levelString)}: [${this.prefix}]`;
  }

  private logAlias(level: LogLevel) {
    return async (...data: Data) => {
      const metadata = typeof this.metadata === 'function' ? this.metadata() : this.metadata;
      if (metadata) {
        data.push(metadata);
      }

      this.logToConsole(level, ...data);
      await this.logToFile(level, ...data);
    };
  }

  private logToConsole(level: LogLevel, ...data: Data) {
    const consoleLevel = this.getConsoleLevel(level);
    // eslint-disable-next-line no-console
    console[consoleLevel](this.getLogString(level, false), ...data);
  }

  private logToFile(level: LogLevel, ...data: Data) {
    const stringifiedData = data.map((value) => typeof value === 'string' ? value : inspect(value, {
      compact: true,
      depth: 3, // match console.log
      showHidden: true
    }).replace(/\s\s+/g, ' '));
    const stringToWrite = `${this.getLogString(level, true)} ${stringifiedData.join(' ')}\n`;
    Logger.writeQueue = Logger.writeQueue.finally(() => {
      return fs.promises.writeFile(`${LOG_FILE_DIR}/${Logger.getFilenameToday()}`, stringToWrite, {
        flag: 'a'
      });
    }).catch((error) => this.logToConsole(LogLevel.ERROR, 'error while writing log to disk', {
      error
    }));

    return Logger.writeQueue;
  }

  static wrapForExternalUse(logger: Logger, level: LogLevel, prefix: string) {
    return Object.values(LogLevel).reduce((a, b) => ({
      ...a,
      [b]: (...data: Data) => logger[level](`${prefix}:`, `${b}:`, ...data)
    }), {});
  }

  static wrapWithMetadata(logger: Logger, metadata: Metadata) {
    return new Logger(logger.prefix, metadata);
  }
}
