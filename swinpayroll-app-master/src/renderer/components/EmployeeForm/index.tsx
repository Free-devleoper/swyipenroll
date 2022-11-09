import { Data, Files } from 'renderer/pages/MasterPage';
import MasterForm, { Resource } from 'renderer/components/MasterForm';

import { Component } from 'react';
import { FetchApi } from 'renderer/components/Auth';
import InputWrapper from 'renderer/components/InputWrapper';
import SelectSearch from 'react-select-search';

enum MaritalStatus {
  SINGLE = 'single',
  DE_FACTO = 'de_facto',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  OTHER = 'other'
}

enum Sex {
  M = 'm',
  F = 'f',
  O = 'o'
}

export interface Employee {
  id?: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  date_of_birth: string;
  sex: Sex;
  marital_status: MaritalStatus;
  referee: string;
  emergency_name: string;
  emergency_address: string;
  emergency_phone: string;
  hired_date: string;
  skill: string;
  hourly_rate: number;
  overtime_rate: number;
  project_id: string;
  position_id: string;
  subcontract_id?: string;
}

interface Props {
  employee?: Employee;
  fetchApi: FetchApi;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: (data: Data, files: Files) => Promise<void>;
  positions: Resource[]
  projects: Resource[];
  readonly: boolean;
  subcontracts: Resource[];
}

interface State {
  employee: Employee;
  files: Files;
  photoNonce: string;
  photoSrc: string | undefined;
}

const maritalStatusLabels: Record<MaritalStatus, string> = {
  [MaritalStatus.SINGLE]: 'Single',
  [MaritalStatus.DE_FACTO]: 'De Facto',
  [MaritalStatus.MARRIED]: 'Married',
  [MaritalStatus.DIVORCED]: 'Divorced',
  [MaritalStatus.WIDOWED]: 'Widowed',
  [MaritalStatus.OTHER]: 'Other'
};

const sexLabels: Record<Sex, string> = {
  [Sex.M]: 'Male',
  [Sex.F]: 'Female',
  [Sex.O]: 'Other'
};

export default class EmployeeForm extends Component<Props, State> {
  get defaultState() {
    return {
      employee: this.props.employee ?? {
        code: '',
        name: '',
        address: '',
        phone: '',
        date_of_birth: '',
        sex: Sex.M,
        marital_status: MaritalStatus.SINGLE,
        referee: '',
        emergency_name: '',
        emergency_address: '',
        emergency_phone: '',
        hired_date: '',
        skill: '',
        hourly_rate: 0,
        overtime_rate: 0,
        project_id: '',
        position_id: '',
        subcontract_id: undefined
      },
      files: {},
      photoNonce: Date.now().toString(),
      photoSrc: undefined
    };
  }
  constructor(props: Props) {
    super(props);

    this.state = this.defaultState;

    this.loadPhotoSrc();
  }

  componentDidUpdate(prevProps: Props) {
    if (!!prevProps.employee !== !!this.props.employee) {
      this.setState(this.defaultState);
      this.loadPhotoSrc();
    }
  }

  async loadPhotoSrc() {
    const { employee } = this.props;
    if (!employee) {
      return;
    }

    try {
      const blob = await this.props.fetchApi('GET', `employees/${employee.id}/photo`);
      this.setPhotoSrc(blob);
    } catch {
      // swallow
    }
  }

  setPhotoSrc(blob: Blob) {
    const fileReader = new FileReader();

    fileReader.onload = ({ target }) => {
      if (!target || !target.result) {
        return;
      }

      this.setState({
        photoSrc: target.result as string
      });
    };

    fileReader.readAsDataURL(blob);
  }

  render() {
    const { positions, projects, readonly, subcontracts } = this.props;
    const { employee } = this.state;
    return (
      <MasterForm<Employee>
        isEditing={!!this.props.employee}
        onChange={(key, value) => {
          if (!key) {
            return;
          }

          this.setState({
            employee: {
              ...this.state.employee,
              [key]: value
            }
          })
        }}
        onClose={this.props.onClose}
        onDelete={this.props.onDelete}
        onFileChange={(key, value) => this.setState({
          files: {
            ...this.state.files,
            [key]: value
          }
        })}
        onSubmit={() => this.props.onSubmit(this.state.employee as unknown as Record<string, unknown>, this.state.files)}
        readonly={readonly}
      >
        {(errors) => (
        <>
          <div>
            <InputWrapper attribute="code" errors={errors}>
              <>
                <div className="label">Employee #:</div>
                <input disabled={readonly} name="code" type="text" value={employee.code} />
              </>
            </InputWrapper>

            <InputWrapper attribute="name" errors={errors}>
              <>
                <div className="label">Name:</div>
                <input disabled={readonly} name="name" type="text" value={employee.name} />
              </>
            </InputWrapper>
            <InputWrapper attribute="address" errors={errors}>
              <>
                <div className="label">Address:</div>
                <input disabled={readonly} name="address" type="text" value={employee.address} />
              </>
            </InputWrapper>

            <InputWrapper attribute="phone" errors={errors}>
              <>
                <div className="label">Phone:</div>
                <input disabled={readonly} name="phone" type="text" value={employee.phone} />
              </>
            </InputWrapper>

            <InputWrapper attribute="date_of_birth" errors={errors}>
              <>
                <div className="label">DOB:</div>
                <input disabled={readonly} name="date_of_birth" type="date" value={employee.date_of_birth} />
              </>
            </InputWrapper>

            <InputWrapper attribute="sex" errors={errors}>
              <>
                <div className="label">Sex:</div>
                <select disabled={readonly} name="sex" value={employee.sex}>
                  {Object.entries(sexLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </>
            </InputWrapper>

            <InputWrapper attribute="marital_status" errors={errors}>
              <>
                <div className="label">Marital Status:</div>
                <select disabled={readonly} name="marital_status" value={employee.marital_status}>
                  {Object.entries(maritalStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </>
            </InputWrapper>

            <InputWrapper attribute="referee" errors={errors}>
              <>
                <div className="label">Referee:</div>
                <input disabled={readonly} name="referee" type="text" value={employee.referee} />
              </>
            </InputWrapper>

            <InputWrapper attribute="hired_date" errors={errors}>
              <>
                <div className="label">Date Hired:</div>
                <input disabled={readonly} name="hired_date" type="date" value={employee.hired_date} />
              </>
            </InputWrapper>

            <InputWrapper attribute="hourly_rate" errors={errors}>
              <>
                <div className="label">Regular Hourly Rate:</div>
                <input disabled={readonly} name="hourly_rate" type="number" min="0" step="0.01" value={employee.hourly_rate} />
              </>
            </InputWrapper>

            <InputWrapper attribute="overtime_rate" errors={errors}>
              <>
                <div className="label">Overtime Hourly Rate:</div>
                <input disabled={readonly} name="overtime_rate" type="number" min="0" step="0.01" value={employee.overtime_rate} />
              </>
            </InputWrapper>

            <InputWrapper attribute="skill" errors={errors}>
              <>
                <div className="label">Skills:</div>
                <textarea disabled={readonly} name="skill" value={employee.skill}></textarea>
              </>
            </InputWrapper>

            <InputWrapper attribute="subcontract_id" errors={errors}>
              <>
                <div className="label">Subcontract:</div>
                <select disabled={readonly} name="subcontract_id" value={employee.subcontract_id}>
                  {MasterForm.renderSelectOptions(subcontracts)}
                </select>
              </>
            </InputWrapper>
          </div>
          <div>
            <img key={this.state.photoNonce} src={this.state.photoSrc} />

            <div>
              <div className="label">Image:</div>
              <input
                accept="image/*"
                disabled={readonly} name="photo"
                type="file"
                onChange={({ currentTarget }) => {
                  if (!currentTarget || !currentTarget.files) {
                    return;
                  }

                  this.setPhotoSrc(currentTarget.files[0]);
                }}
              />
            </div>

            <div>
              <div className="label">CV:</div>
              <input accept="application/pdf" disabled={readonly} name="cv" type="file" />
            </div>

            <InputWrapper attribute="position_id" errors={errors}>
              <>

                <div className="label">Position:</div>
                
                <select disabled={readonly} name="position_id" value={employee.position_id}>
                  {MasterForm.renderSelectOptions(positions)}
                </select>
              </>
            </InputWrapper>

            <InputWrapper attribute="project_id" errors={errors}>
              <>
                <div className="label">Project:</div>
                <select disabled={readonly} name="project_id" value={employee.project_id}>
                  {MasterForm.renderSelectOptions(projects)}
                </select>
              </>
            </InputWrapper>

            <div>Emergency Contact</div>

            <InputWrapper attribute="emergency_name" errors={errors}>
              <>
                <div className="label">Name:</div>
                <input disabled={readonly} name="emergency_name" type="text" value={employee.emergency_name} />
              </>
            </InputWrapper>

            <InputWrapper attribute="emergency_address" errors={errors}>
              <>
                <div className="label">Address:</div>
                <input disabled={readonly} name="emergency_address" type="text" value={employee.emergency_address} />
              </>
            </InputWrapper>

            <InputWrapper attribute="emergency_phone" errors={errors}>
              <>
                <div className="label">Phone:</div>
                <input disabled={readonly} name="emergency_phone" type="text" value={employee.emergency_phone} />
              </>
            </InputWrapper>
          </div>
        </>
        )}
      </MasterForm>
    );
  }
}
