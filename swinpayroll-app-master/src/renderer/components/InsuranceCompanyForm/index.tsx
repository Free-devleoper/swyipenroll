import { Component } from 'react';

import { FetchApi } from 'renderer/components/Auth';
import InputWrapper from 'renderer/components/InputWrapper';
import MasterForm from 'renderer/components/MasterForm';
import { Data } from 'renderer/pages/MasterPage';

export interface InsuranceCompany {
  id?: string;
  code: string;
  name: string;
}

interface Props {
  insuranceCompany?: InsuranceCompany;
  fetchApi: FetchApi;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: (data: Data) => Promise<void>;
  readonly: boolean;
}

interface State {
  insuranceCompany: InsuranceCompany;
}

export default class InsuranceCompanyForm extends Component<Props, State> {
  get defaultState() {
    return {
      insuranceCompany: this.props.insuranceCompany ?? {
        code: '',
        name: ''
      }
    };
  }

  constructor(props: Props) {
    super(props);

    this.state = this.defaultState;
  }

  componentDidUpdate(prevProps: Props) {
    if (!!prevProps.insuranceCompany !== !!this.props.insuranceCompany) {
      this.setState(this.defaultState);
    }
  }

  render() {
    const { readonly } = this.props;
    const { insuranceCompany } = this.state;
    return (
      <MasterForm<InsuranceCompany>
        isEditing={!!this.props.insuranceCompany}
        onChange={(key, value) => {
          if (!key) {
            return;
          }

          this.setState({
            insuranceCompany: {
              ...this.state.insuranceCompany,
              [key]: value
            }
          })
        }}
        onClose={this.props.onClose}
        onDelete={this.props.onDelete}
        onSubmit={() => this.props.onSubmit(this.state.insuranceCompany as unknown as Record<string, unknown>)}
        readonly={readonly}
      >
        {(errors) => (
          <>
            <div>
              <InputWrapper attribute="code" errors={errors}>
                <>
                  <div className="label">Company Code:</div>
                  <input disabled={readonly} name="code" type="text" value={insuranceCompany.code} />
                </>
              </InputWrapper>
            </div>
            <div>
              <InputWrapper attribute="name" errors={errors}>
                <>
                  <div className="label">Company Name:</div>
                  <input disabled={readonly} name="name" type="text" value={insuranceCompany.name} />
                </>
              </InputWrapper>
            </div>
          </>
        )}
      </MasterForm>
    );
  }
}
