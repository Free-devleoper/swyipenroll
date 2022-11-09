import { Role } from '../enums';
import { UserCreate } from '../models';
import Validator, { Type } from './validator';

class EmployeeValidator extends Validator<UserCreate> {
  constructor() {
    super();

    this.addValidation('name', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('email', {
      maxLength: Validator.MAX_STRING_LENGTH,
      regex: Validator.EMAIL_REGEX,
      required: true,
      type: Type.STRING,
      unique: true
    });

    this.addValidation('password', {
      doNotTrim: true,
      maxLength: 100,
      minLength: 8,
      requiredIf: ({ isNew }) => isNew,
      type: Type.STRING
    });

    this.addValidation('password_confirmation', {
      doNotTrim: true,
      isEqualTo: 'password',
      maxLength: 100,
      requiredIf: ({ isNew }) => isNew,
      type: Type.STRING
    });

    this.addValidation('role', {
      enum: Role,
      required: true,
      type: Type.STRING
    });
  }
}

export default new EmployeeValidator();
