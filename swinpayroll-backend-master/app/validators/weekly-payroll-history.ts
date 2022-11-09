import { TableName } from '../enums';
import { WeeklyPayrollHistory } from '../models';
import Validator, { Type } from './validator';

class WeeklyPayrollHistoryValidator extends Validator<WeeklyPayrollHistory> {
  constructor() {
    super();

    this.addValidation('week_start_date', {
      custom: ({ addError, value }) => {
        const date = new Date(value);

        if (isNaN(date.getTime())) {
          addError('is invalid');
          return;
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('employee_id', {
      custom: async ({ addError, value }, database) => {
        const record = await database.knex(TableName.EMPLOYEES)
          .where('id', value)
          .first();

        if (!record) {
          addError('is invalid');
        }
      },
      required: true,
      type: Type.STRING
    });

    const numberFields: (keyof WeeklyPayrollHistory)[] = [
      'hours_day_1',
      'hours_day_2',
      'hours_day_3',
      'hours_day_4',
      'hours_day_5',
      'hours_day_6',
      'hours_day_7',
      'slip_regular_hours',
      'slip_overtime_hours',
      'slip_addition_1',
      'slip_addition_2',
      'slip_addition_3',
      'slip_deduction_1',
      'slip_deduction_2',
      'slip_deduction_3',
      'slip_deduction_4',
      'slip_deduction_5',
      'slip_deduction_6'
    ];
    numberFields.forEach((field) => {
      this.addValidation(field, {
        custom: ({ addError, value }) => {
          if (value < 0) {
            addError('must be at least 0');
          }
        },
        required: true,
        type: Type.NUMBER
      });
    });
  }
}

export default new WeeklyPayrollHistoryValidator();
