import { Subcontract } from '../models';
import Validator, { Type } from './validator';

class SubcontractValidator extends Validator<Subcontract> {
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

    this.addValidation('down_payment1', {
      custom: ({ addError, value }) => {
        if (value < 0) {
          addError('must be higher than 0');
        }
      },
      required: false,
      type: Type.NUMBER
    });

    this.addValidation('down_payment2', {
      custom: ({ addError, value }) => {
        if (value < 0) {
          addError('must be higher than 0');
        }
      },
      required: false,
      type: Type.NUMBER
    });

    this.addValidation('down_payment3', {
      custom: ({ addError, value }) => {
        if (value < 0) {
          addError('must be higher than 0');
        }
      },
      required: false,
      type: Type.NUMBER
    });
  }
}

export default new SubcontractValidator();
