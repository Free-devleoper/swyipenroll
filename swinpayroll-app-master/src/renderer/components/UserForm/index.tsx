import { Component } from 'react';
import { FetchApi, Role } from 'renderer/components/Auth';
import InputWrapper from 'renderer/components/InputWrapper';
import MasterForm from 'renderer/components/MasterForm';
import { Data } from 'renderer/pages/MasterPage';

export interface User {
  id?: string;
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role: Role;
}

interface Props {
  fetchApi: FetchApi;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: (data: Data) => Promise<void>;
  readonly: boolean;
  user?: User;
}

interface State {
  user: User;
}

const roleLabels: Record<Sex, string> = {
  [Role.LEVEL_1]: 'Level 1 (read/write everything)',
  [Role.LEVEL_2]: 'Level 2 (read records, write payroll history)',
  [Role.LEVEL_3]: 'Level 3 (read payroll history)'
};

export default class UserForm extends Component<Props, State> {
  get defaultState() {
    return {
      user: this.props.user ?? {
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: Role.LEVEL_3
      }
    };
  }

  constructor(props: Props) {
    super(props);

    this.state = this.defaultState;
  }

  render() {
    const { readonly } = this.props;
    const { user } = this.state;
    const isEditing = !!this.props.user;
    return (
      <MasterForm<User>
        isEditing={isEditing}
        onChange={(key, value) => {
          if (!key) {
            return;
          }

          this.setState({
            user: {
              ...this.state.user,
              [key]: value
            }
          })
        }}
        onClose={this.props.onClose}
        onDelete={this.props.onDelete}
        onSubmit={() => this.props.onSubmit(this.state.user as unknown as Record<string, unknown>)}
        readonly={readonly}
        >
          {(errors) => (
            <>
              <div>
                <InputWrapper attribute="name" errors={errors}>
                  <>
                    <div className="label">Name:</div>
                    <input disabled={readonly} name="name" type="text" value={user.name} />
                  </>
                </InputWrapper>
                <InputWrapper attribute="email" errors={errors}>
                  <>
                    <div className="label">Email:</div>
                    <input disabled={readonly} name="email" type="text" value={user.email} />
                  </>
                </InputWrapper>
              <InputWrapper attribute="role" errors={errors}>
                <>
                  <div className="label">Role:</div>
                  <select disabled={readonly} name="role" value={user.role}>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </>
              </InputWrapper>
              </div>
              <div>
                <InputWrapper attribute="password" errors={errors}>
                  <>
                    <div className="label">Password</div>
                    <input disabled={readonly} name="password" placeholder={isEditing ? '(unchanged)' : ''} type="password" value={user.password} />
                  </>
                </InputWrapper>
                {(user.password || !isEditing) && (
                  <InputWrapper attribute="password_confirmation" errors={errors}>
                    <>
                      <div className="label">Password Confirmation</div>
                      <input disabled={readonly} name="password_confirmation" type="password" value={user.password_confirmation} />
                    </>
                  </InputWrapper>
                )}
              </div>
            </>
          )}
        </MasterForm>
    );
  }
}
