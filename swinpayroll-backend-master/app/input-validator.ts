import { Handler, NextFunction, Request, Response } from 'express';
import { isPlainObject, startCase } from 'lodash';

import database from './database';
import { TableName } from './enums';
import {
  Employee,
  InsuranceCompany,
  InsurancePolicy,
  Position,
  Project,
  Subcontract,
  UserCreate,
  WeeklyPayrollHistory
} from './models';
import { singularise } from './util';
import {
  BaseValidator,
  employeeValidator,
  insuranceCompanyValidator,
  insurancePolicyValidator,
  positionValidator,
  projectValidator,
  subcontractValidator,
  userValidator,
  weeklyPayrollHistoryValidator
} from './validators';

interface ValidationError {
  attribute: string;
  message: string;
}

class InputValidator {
  private async __validateModel<TModel>(validator: BaseValidator<TModel>, tableName: TableName, data: TModel, req: Request) {
    if (!isPlainObject(data)) {
      data = {} as TModel;
    }

    const isNew = req.method === 'POST';
    const storedRecord: TModel | undefined = isNew ? undefined : await database.knex(tableName)
      .where('id', req.params.id)
      .first();
    if (!isNew && !storedRecord) {
      return null;
    }
    const { validations } = validator;
    let attributes = Array.from(validations.keys());
    const errors: ValidationError[] = [];

    Object.keys(data).forEach((attribute) => {
      if (!attributes.includes(attribute as keyof TModel)) {
        delete data[attribute as keyof TModel];
        return;
      }

      const validation = validations.get(attribute as keyof TModel);
      if (!validation) {
        throw new Error('missing validation when filtering data');
      }
      if (typeof data[attribute as keyof TModel] === 'string') {
        // this is an abomination
        data[attribute as keyof TModel] = validation.doNotTrim ? (data[attribute as keyof TModel] as unknown as string).replace(/\n/g, '') as unknown as TModel[keyof TModel] : (data[attribute as keyof TModel] as unknown as string).trim() as unknown as TModel[keyof TModel];
      }
    });

    for (const attribute of attributes) {
      const validation = validations.get(attribute);
      if (!validation) {
        throw new Error('missing validation when validating');
      }
      const value = data[attribute];
      const isRequired = typeof validation.required === 'undefined' ? validation.requiredIf?.({
        currentUser: req.user as Required<Request>['user'],
        data,
        isNew,
        req
      }) : validation.required;
      const { instanceOf, isEqualTo, type } = validation;

      const addError = (message: string) => errors.push({
        attribute: attribute as string,
        message
      });

      if (isEqualTo && (!this.isBlank(value) || !this.isBlank(data[isEqualTo])) && value !== data[isEqualTo]) {
        addError(`does not match ${startCase(isEqualTo as string)}`);
        continue;
      }

      if (isRequired && this.isBlank(value)) {
        addError('can\'t be blank');
        continue;
      }

      if (type && typeof value !== type || instanceOf && !(value instanceof instanceOf)) {
        if (isRequired) {
          addError('is invalid');
        } else {
          delete data[attribute];
        }
        continue;
      }

      if (validation.unique && (isNew || value !== storedRecord?.[attribute as keyof TModel] as unknown as TModel[keyof TModel])) {
        const existingRecord = await database.knex(tableName)
          .where(attribute, value)
          .first();

        if (existingRecord) {
          addError('is already in use');
        }
      }

      if (validation.enum && !Object.values(validation.enum).includes(value)) {
        addError('is invalid');
      } else if (validation.regex && !validation.regex.test(value as unknown as string)) {
        addError(validation.regexMessage || 'is invalid');
      }

      if (!this.isBlank(value)) {
        if (validation.minLength && (value as unknown as string).length < validation.minLength) {
          addError(`can't be shorter than ${validation.minLength} characters`);
        } else if (validation.maxLength && (value as unknown as string).length > validation.maxLength) {
          addError(`can't be longer than ${validation.maxLength} characters`);
        }
      }

      if (validation.custom) {
        await validation.custom({
          addError,
          data,
          storedRecord: storedRecord as TModel,
          value
        }, database);
      }
    }

    return errors;
  }

  private _validateModel(tableName: TableName, data: unknown, req: Request) {
    switch (tableName) {
      case TableName.EMPLOYEES:
        return this.__validateModel<Employee>(employeeValidator, tableName, data as Employee, req);
      case TableName.INSURANCE_COMPANIES:
        return this.__validateModel<InsuranceCompany>(insuranceCompanyValidator, tableName, data as InsuranceCompany, req);
      case TableName.INSURANCE_POLICIES:
        return this.__validateModel<InsurancePolicy>(insurancePolicyValidator, tableName, data as InsurancePolicy, req);
      case TableName.POSITIONS:
        return this.__validateModel<Position>(positionValidator, tableName, data as Position, req);
      case TableName.PROJECTS:
        return this.__validateModel<Project>(projectValidator, tableName, data as Project, req);
      case TableName.SUBCONTRACTS:
        return this.__validateModel<Subcontract>(subcontractValidator, tableName, data as Subcontract, req);
      case TableName.USERS:
        return this.__validateModel<UserCreate>(userValidator, tableName, data as UserCreate, req);
      case TableName.WEEKLY_PAYROLL_HISTORIES:
        return this.__validateModel<WeeklyPayrollHistory>(weeklyPayrollHistoryValidator, tableName, data as WeeklyPayrollHistory, req);
      default:
        throw new Error('no validator for model');
    }
  }

  generateError(res: Response, attribute: string, message: string) {
    this.generateErrors(res, [{
      attribute,
      message
    }]);
  }

  private generateErrors(res: Response, errors: ValidationError[]) {
    res.status(422).json({
      errors
    });
  }

  private isBlank(value: unknown) {
    // value could never be undefined because we get the data in json, but better safe than sorry
    return value === null || typeof value === 'undefined' || value === '';
  }

  isValidEmail(email: string) {
    return BaseValidator.EMAIL_REGEX.test(email);
  }

  private respond(errors: ValidationError[], res: Response, next: NextFunction) {
    if (errors.length) {
      this.generateErrors(res, errors);
    } else {
      next();
    }
  }

  validateModel(tableName: TableName): Handler {
    return async (req, res, next) => {
      const key = singularise(tableName);
      let data: unknown = req.body[key];
      if (typeof data === 'string') {
        req.body[key] = data = JSON.parse(data);
      }
      const errors = await this._validateModel(tableName, data, req);
      if (errors === null) {
        res.sendStatus(404);
        return;
      }
      if (errors.length) {
        req.logger.warn('validation errors', {
          tableName,
          errors
        });
      }
      this.respond(errors, res, next);
    };
  }
}

export default new InputValidator();
