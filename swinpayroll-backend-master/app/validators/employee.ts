import { MaritalStatus, Sex, TableName } from '../enums';
import { Employee, Position } from '../models';
import Validator, { Type } from './validator';

class EmployeeValidator extends Validator<Employee> {
  constructor() {
    super();

    this.addValidation('code', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('name', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('address', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('phone', {
      regex: Validator.PHONE_REGEX,
      required: true,
      type: Type.STRING
    });

    this.addValidation('date_of_birth', {
      custom: ({ addError, value }) => {
        const date = new Date(value);

        if (isNaN(date.getTime())) {
          addError('is invalid');
          return;
        }

        if (date > new Date()) {
          addError('can\'t be in the future');
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('sex', {
      enum: Sex,
      required: true,
      type: Type.STRING
    });

    this.addValidation('marital_status', {
      enum: MaritalStatus,
      required: true,
      type: Type.STRING
    });

    this.addValidation('referee', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('emergency_name', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('emergency_address', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('emergency_phone', {
      regex: Validator.PHONE_REGEX,
      required: true,
      type: Type.STRING
    });

    this.addValidation('hired_date', {
      custom: ({ addError, value }) => {
        const date = new Date(value);

        if (isNaN(date.getTime())) {
          addError('is invalid');
          return;
        }

        if (date > new Date()) {
          addError('can\'t be in the future');
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('skill', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('hourly_rate', {
      custom: ({ addError, data, value }) => {
        if (value < 0) {
          addError('must be higher than 0');
        } else if (value > data.overtime_rate) {
          addError('must be lower than overtime rate');
        }
      },
      required: true,
      type: Type.NUMBER
    });

    this.addValidation('overtime_rate', {
      custom: ({ addError, data, value }) => {
        if (value < 0) {
          addError('must be higher than 0');
        } else if (value < data.hourly_rate) {
          addError('must be higher than hourly rate');
        }
      },
      required: true,
      type: Type.NUMBER
    });

    this.addValidation('project_id', {
      custom: async ({ addError, value }, database) => {
        const record = await database.knex(TableName.PROJECTS)
          .where('id', value)
          .first();

        if (!record) {
          addError('is invalid');
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('position_id', {
      custom: async ({ addError, data, value }, database) => {
        const record = await database.knex<Position>(TableName.POSITIONS)
          .where('id', value)
          .first();

        if (!record) {
          addError('is invalid');
          return;
        }

        const { hourly_rate, overtime_rate } = data;
        if (!(typeof (hourly_rate && overtime_rate) === 'number')) {
          return;
        }

        const { maximum_pay, minimum_pay } = record;
        if (maximum_pay < hourly_rate) {
          addError('has a lower maximum pay than the specified hourly rate');
        }
        if (minimum_pay > hourly_rate) {
          addError('has a higher minimum pay than the specified hourly rate');
        }
        if (maximum_pay < overtime_rate) {
          addError('has a lower maximum pay than the specified overtime rate');
        }
        if (minimum_pay > overtime_rate) {
          addError('has a higher minimum pay than the specified overtime rate');
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('subcontract_id', {
      custom: async ({ addError, value }, database) => {
        const record = await database.knex(TableName.PROJECTS)
          .where('id', value)
          .first();

        if (!record) {
          addError('is invalid');
        }
      },
      required: false,
      type: Type.STRING
    });
  }
}

export default new EmployeeValidator();
