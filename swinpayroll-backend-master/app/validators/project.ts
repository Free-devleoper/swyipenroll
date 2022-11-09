import { Project } from '../models';
import Validator, { Type } from './validator';

class ProjectValidator extends Validator<Project> {
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

    this.addValidation('acronym', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('accumulation_amount', {
      required: true,
      type: Type.NUMBER
    });

    this.addValidation('address', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('end_date', {
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

    this.addValidation('project_group', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('start_date', {
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
  }
}

export default new ProjectValidator();
