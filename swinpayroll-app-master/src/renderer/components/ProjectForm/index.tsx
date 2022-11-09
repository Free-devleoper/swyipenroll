import { Component } from 'react';

import { FetchApi } from 'renderer/components/Auth';
import InputWrapper from 'renderer/components/InputWrapper';
import MasterForm from 'renderer/components/MasterForm';
import { Data } from 'renderer/pages/MasterPage';

export interface Project {
  id?: string;
  code: string;
  name: string;
  acronym: string;
  accumulation_amount: number;
  address: string;
  end_date: string;
  project_group: string;
  start_date: string;
}

interface Props {
  project?: Project;
  fetchApi: FetchApi;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: (data: Data) => Promise<void>;
  readonly: boolean;
}

interface State {
  project: Project;
}

export default class ProjectForm extends Component<Props, State> {
  get defaultState() {
    return {
      project: this.props.project ?? {
        code: '',
        name: '',
        acronym: '',
        accumulation_amount: 0,
        address: '',
        end_date: '',
        project_group: '',
        start_date: ''
      }
    };
  }

  constructor(props: Props) {
    super(props);

    this.state = this.defaultState;
  }

  componentDidUpdate(prevProps: Props) {
    if (!!prevProps.project !== !!this.props.project) {
      this.setState(this.defaultState);
    }
  }

  render() {
    const { readonly } = this.props;
    const { project } = this.state;
    return (
      <MasterForm<Project>
        isEditing={!!this.props.project}
        onChange={(key, value) => {
          if (!key) {
            return;
          }

          this.setState({
            project: {
              ...this.state.project,
              [key]: value
            }
          })
        }}
        onClose={this.props.onClose}
        onDelete={this.props.onDelete}
        onSubmit={() => this.props.onSubmit(this.state.project as unknown as Record<string, unknown>)}
        readonly={readonly}
      >
        {(errors) => (
          <>
            <div>
              <InputWrapper attribute="code" errors={errors}>
                <>
                  <div className="label">Project #:</div>
                  <input disabled={readonly} name="code" type="text" value={project.code} />
                </>
              </InputWrapper>
              <InputWrapper attribute="name" errors={errors}>
                <>
                  <div className="label">Name:</div>
                  <input disabled={readonly} name="name" type="text" value={project.name} />
                </>
              </InputWrapper>
              <InputWrapper attribute="acronym" errors={errors}>
                <>
                  <div className="label">Acronym:</div>
                  <input disabled={readonly} name="acronym" type="text" value={project.acronym} />
                </>
              </InputWrapper>
              <InputWrapper attribute="accumulation_amount" errors={errors}>
                <>
                  <div className="label">Accumulation Amount:</div>
                  <input disabled={readonly} name="accumulation_amount" type="number" min="0" step="0.01" value={project.accumulation_amount} />
                </>
              </InputWrapper>
            </div>
            <div>
              <InputWrapper attribute="project_group" errors={errors}>
                <>
                  <div className="label">Project Group:</div>
                  <input disabled={readonly} name="project_group" type="text" value={project.project_group} />
                </>
              </InputWrapper>
              <InputWrapper attribute="address" errors={errors}>
                <>
                  <div className="label">Address:</div>
                  <input disabled={readonly} name="address" type="text" value={project.address} />
                </>
              </InputWrapper>
              <InputWrapper attribute="start_date" errors={errors}>
                <>
                  <div className="label">Start Date:</div>
                  <input disabled={readonly} name="start_date" type="date" value={project.start_date} />
                </>
              </InputWrapper>
              <InputWrapper attribute="end_date" errors={errors}>
                <>
                  <div className="label">End Date:</div>
                  <input disabled={readonly} name="end_date" type="date" value={project.end_date} />
                </>
              </InputWrapper>
            </div>
          </>
        )}
      </MasterForm>
    );
  }
}
