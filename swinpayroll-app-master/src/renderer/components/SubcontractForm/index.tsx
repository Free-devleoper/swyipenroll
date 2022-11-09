import { Component } from 'react';
import { FetchApi } from 'renderer/components/Auth';
import InputWrapper from 'renderer/components/InputWrapper';
import MasterForm from 'renderer/components/MasterForm';
import { Data } from 'renderer/pages/MasterPage';

export interface Subcontract {
  id?: string;
  code: string;
  name: string;
  down_payment1: string;
  down_payment2: string;
  down_payment3: string;
}

interface Props {
  fetchApi: FetchApi;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: (data: Data) => Promise<void>;
  readonly: boolean;
  subcontract?: Subcontract;
}

interface State {
  subcontract: Subcontract;
}

export default class SubcontractForm extends Component<Props, State> {
  get defaultState() {
    return {
      subcontract: this.props.subcontract ?? {
        name: '',
        code: '',
        down_payment1: '',
        down_payment2: '',
        down_payment3: ''
      }
    };
  }

  constructor(props: Props) {
    super(props);

    this.state = this.defaultState;
  }

  componentDidUpdate(prevProps: Props) {
    if (!!prevProps.subcontract !== !!this.props.subcontract) {
      this.setState(this.defaultState);
    }
  }

  render() {
    const { readonly } = this.props;
    const { subcontract } = this.state;
    return (
      <MasterForm<Subcontract>
        isEditing={!!this.props.subcontract}
        onChange={(key, value) => {
          if (!key) {
            return;
          }

          this.setState({
            subcontract: {
              ...subcontract,
              [key]: value
            }
          })
        }}
        onClose={this.props.onClose}
        onDelete={this.props.onDelete}
        onSubmit={() => this.props.onSubmit(subcontract as unknown as Record<string, unknown>)}
        readonly={readonly}
      >
        {(errors) => (
          <>
            <div>
              <InputWrapper attribute="code" errors={errors}>
                <>
                  <div className="label">Subcontract Code:</div>
                  <input disabled={readonly} name="code" type="text" value={subcontract.code} />
                </>
              </InputWrapper>
              <InputWrapper attribute="name" errors={errors}>
                <>
                  <div className="label">Name:</div>
                  <input disabled={readonly} name="name" type="text" value={subcontract.name} />
                </>
              </InputWrapper>
            </div>
            <div>
              <InputWrapper attribute="down_payment1" errors={errors}>
                <>
                  <div className="label">Down Payment 1:</div>
                  <input disabled={readonly} name="down_payment1" type="number" min="0" step="0.01" value={subcontract.down_payment1} />
                </>
              </InputWrapper>
              <InputWrapper attribute="down_payment2" errors={errors}>
                <>
                  <div className="label">Down Payment 2:</div>
                  <input disabled={readonly} name="down_payment2" type="number" min="0" step="0.01" value={subcontract.down_payment2} />
                </>
              </InputWrapper>
              <InputWrapper attribute="down_payment3" errors={errors}>
                <>
                  <div className="label">Down Payment 3:</div>
                  <input disabled={readonly} name="down_payment3" type="number" min="0" step="0.01" value={subcontract.down_payment3} />
                </>
              </InputWrapper>
            </div>
          </>
        )}
      </MasterForm>
    );
  }
}
