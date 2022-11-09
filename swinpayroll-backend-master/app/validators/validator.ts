import { Database } from '../database';
import * as enums from '../enums';

import { Request } from 'express';

interface Class extends Function {
  new (...args: unknown[]): unknown;
}

export enum Type {
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  OBJECT = 'object',
  STRING = 'string'
}

interface CustomData<TModel, TValue> {
  addError: (message: string) => void;
  data: TModel;
  storedRecord: TModel;
  value: TValue;
}

interface RequiredIfData<TModel> {
  currentUser: Required<Request>['user'];
  data: TModel;
  isNew: boolean;
  req: Request;
}

interface BaseValidation<TModel, TValue> {
  custom?: (data: CustomData<TModel, TValue>, database: Database) => unknown;
  doNotTrim?: boolean;
  enum?: typeof enums[keyof typeof enums];
  isEqualTo?: keyof TModel;
  maxLength?: number;
  minLength?: number;
  unique?: boolean;
}

interface ValidationWithType {
  instanceOf?: never;
  type: Type;
}

interface ValidationWithInstanceOf {
  instanceOf: Class;
  type?: never;
}

interface ValidationWithRequired {
  required: boolean;
  requiredIf?: never;
}

interface ValidationWithoutRegex {
  regex?: never;
  regexMessage?: never;
}

interface ValidationWithRegex {
  regex: RegExp;
  regexMessage?: string;
}

interface ValidationWithRequiredIf<TModel> {
  required?: never;
  requiredIf: (data: RequiredIfData<TModel>) => boolean;
}

type Validation<TModel, TValue> = BaseValidation<TModel, TValue>
  & (ValidationWithType | ValidationWithInstanceOf)
  & (ValidationWithRequiredIf<TModel> | ValidationWithRequired)
  & (ValidationWithoutRegex | ValidationWithRegex);

export default class Validator<TModel> {
  static EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  static MAX_STRING_LENGTH = 255;
  static MAX_TEXT_LENGTH = 10000;
  static PHONE_REGEX = /^\+?[0-9\s]+$/;

  validations = new Map<keyof TModel, Validation<TModel, unknown>>();

  protected addValidation<K extends keyof TModel>(attribute: K, validation: Validation<TModel, TModel[K]>) {
    this.validations.set(attribute, validation as Validation<TModel, unknown>);
  }
}
