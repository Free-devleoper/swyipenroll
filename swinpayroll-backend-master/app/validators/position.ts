import { Position } from '../models';
import Validator, { Type } from './validator';

class PositionValidator extends Validator<Position> {
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

    this.addValidation('minimum_pay', {
      custom: ({ addError, data, value }) => {
        if (value < 0) {
          addError('must be higher than 0');
        } else if (value > data.maximum_pay) {
          addError('must be lower than maximum pay');
        }
      },
      required: true,
      type: Type.NUMBER
    });

    this.addValidation('maximum_pay', {
      custom: ({ addError, data, value }) => {
        if (value < 0) {
          addError('must be higher than 0');
        } else if (value < data.minimum_pay) {
          addError('must be higher than minimum pay');
        }
      },
      required: true,
      type: Type.NUMBER
    });
  }
}

export default new PositionValidator();
