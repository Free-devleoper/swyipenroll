import { InsuranceCompany } from '../models';
import Validator, { Type } from './validator';

class InsuranceCompanyValidator extends Validator<InsuranceCompany> {
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
  }
}

export default new InsuranceCompanyValidator();
