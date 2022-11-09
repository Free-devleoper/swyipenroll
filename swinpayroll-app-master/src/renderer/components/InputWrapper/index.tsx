import { Component, ReactElement } from 'react';

import { ValidationError } from 'renderer/components/MasterForm';

import './style.scss';

interface Props {
  attribute: string;
  children: ReactElement;
  errors: ValidationError[];
}

export default class InputWrapper extends Component<Props> {
  render() {
    const { attribute, children, errors } = this.props;
    const error = errors.find((error) => error.attribute === attribute);
    return (
      <div className="InputWrapper">
        <div>{children}</div>
        <div className="errorMessage">{error ? error.message : ''}</div>
      </div>
    );
  }
}
