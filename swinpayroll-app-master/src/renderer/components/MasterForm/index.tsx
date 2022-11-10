import './style.scss';

import { ChangeEvent, Component, FormEvent, ReactElement } from 'react';

export interface Resource {
  code: string;
  id: string;
  name: string;
}

export interface ValidationError {
  attribute: string;
  message: string;
}

interface Props<TResource> {
  children: (errors: ValidationError[], onSubmit: typeof MasterForm.prototype.handleSubmit) => ReactElement;
  isEditing?: boolean;
  onChange: (key: keyof TResource, value: TResource[keyof TResource]) => void;
  onClose?: () => void;
  onDelete?: () => void;
  onFileChange?: (key: string, value: File) => void;
  onSubmit: () => Promise<void>;
  readonly?: boolean;
  renderButtons?: boolean;
}

interface State {
  errors: ValidationError[];
}

export default class MasterForm<TResource> extends Component<Props<TResource>, State> {
  static renderSelectOptions(resources: Resource[]) {
    return [
      <option key="none" value="">None</option>,
      ...resources.map(({ code, id, name }, index) => (
        <option key={index} value={name}>{name}</option>
      ))
    ]
  }

  constructor(props: Props<TResource>) {
    super(props);

    this.state = {
      errors: []
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      await this.props.onSubmit();
    } catch (error) {
      const { errors } = (error as { errors?: ValidationError[] });
      if (errors) {
        this.setState({ errors });
        return;
      }

      throw error;
    }
  }

  render() {
    return (
      <div className="MasterForm">
        <form
          onChange={({ target: { files, name, type, value } }: ChangeEvent<HTMLFormElement>) => {
            if (type === 'file') {
              this.props.onFileChange?.(name, files[0]);
            } else if (type === 'number') {
              const parsedValue = parseFloat(value);
              this.props.onChange(name as keyof TResource, (isNaN(parsedValue) ? 0 : parsedValue) as unknown as TResource[keyof TResource]);
            } else {
              this.props.onChange(name as keyof TResource, value);
            }
          }}
          onSubmit={this.handleSubmit}
        >
          {this.props.children(this.state.errors, this.handleSubmit)}
          {this.props.renderButtons !== false && (
            <div>
              {this.props.onClose && (
                <button onClick={this.props.onClose} type="button">
                  Close
                </button>
              )}
              {!this.props.readonly && (
                <>
                  <button type="submit" className="submit">
                    Save
                  </button>
                  {this.props.onDelete && this.props.isEditing && (
                    <button className="delete" onClick={this.props.onDelete} type="button">
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </form>
      </div>
    );
  }
}
