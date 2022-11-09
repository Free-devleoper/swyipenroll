import { Component } from 'react';
import { FetchApi } from 'renderer/components/Auth';
import InputWrapper from 'renderer/components/InputWrapper';
import MasterForm, { Resource } from 'renderer/components/MasterForm';
import { Data } from 'renderer/pages/MasterPage';

export interface InsurancePolicy {
  id?: string;
  code: string;
  project_id?: string;
  insurance_company_id?: string;
  details: string;
  comment: string;
  start_date: string;
  end_date: string;
}

interface Props {
  fetchApi: FetchApi;
  insuranceCompanies: Resource[];
  insurancePolicy?: InsurancePolicy;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: (data: Data) => Promise<void>;
  projects: Resource[];
  readonly: boolean;
}

interface State {
  insurancePolicy: InsurancePolicy;
}

export default class InsurancePolicyForm extends Component<Props, State> {
  get defaultState() {
    return {
      insurancePolicy: this.props.insurancePolicy ?? {
        code: '',
        project_id: undefined,
        insurance_company_id: undefined,
        details: '',
        comment: '',
        start_date: '',
        end_date: '',
      }
    };
  }

  constructor(props: Props) {
    super(props);

    this.state = this.defaultState;
  }

  render() {
    const { insuranceCompanies, projects, readonly } = this.props;
    const { insurancePolicy } = this.state;
    return (
      <MasterForm<InsurancePolicy>
        isEditing={!!this.props.insurancePolicy}
        onChange={(key, value) => {
          if (!key) {
            return;
          }

          this.setState({
            insurancePolicy: {
              ...this.state.insurancePolicy,
              [key]: value
            }
          })
        }}
        onClose={this.props.onClose}
        onDelete={this.props.onDelete}
        onSubmit={() => this.props.onSubmit(this.state.insurancePolicy as unknown as Record<string, unknown>)}
        readonly={readonly}
      >
        {(errors) => (
          <>
            <div>
              <InputWrapper attribute="code" errors={errors}>
                <>
                  <div className="label">Policy Code:</div>
                  <input disabled={readonly} name="code" type="text" value={this.state.insurancePolicy.code}/>
                </>
              </InputWrapper>
              <InputWrapper attribute="project_id" errors={errors}>
                <>
                  <div className="label">Project:</div>
                  <select disabled={readonly} name="project_id" value={insurancePolicy.project_id}>
                    {MasterForm.renderSelectOptions(projects)}
                  </select>
                </>
              </InputWrapper>
              <InputWrapper attribute="insurance_company_id" errors={errors}>
                <>
                  <div className="label">Insurance Company:</div>
                  <select disabled={readonly} name="insurance_company_id" value={insurancePolicy.insurance_company_id}>
                    {MasterForm.renderSelectOptions(insuranceCompanies)}
                  </select>
                </>
              </InputWrapper>
            </div>
            <div>
              <InputWrapper attribute="details" errors={errors}>
                <>
                  <div className="label">Policy Details:</div>
                  <input disabled={readonly} name="details" type="text" value={this.state.insurancePolicy.details}/>
                </>
              </InputWrapper>
              <InputWrapper attribute="comment" errors={errors}>
                <>
                  <div className="label">Comment:</div>
                  <input disabled={readonly} name="comment" type="text" value={this.state.insurancePolicy.comment}/>
                </>
              </InputWrapper>
              <InputWrapper attribute="start_date" errors={errors}>
                <>
                  <div className="label">Start Date:</div>
                  <input disabled={readonly} name="start_date" type="date" value={this.state.insurancePolicy.start_date}/>
                </>
              </InputWrapper>
              <InputWrapper attribute="end_date" errors={errors}>
                <>
                  <div className="label">End Date:</div>
                  <input disabled={readonly} name="end_date" type="date" value={this.state.insurancePolicy.end_date}/>
                </>
              </InputWrapper>
            </div>
          </>
        )}
      </MasterForm>
    );
  }
}
