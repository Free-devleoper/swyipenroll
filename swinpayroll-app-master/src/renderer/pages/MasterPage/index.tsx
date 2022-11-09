import './style.scss';

import EmployeeForm, { Employee } from 'renderer/components/EmployeeForm';
import InsuranceCompanyForm, { InsuranceCompany } from 'renderer/components/InsuranceCompanyForm';
import InsurancePolicyForm, { InsurancePolicy } from 'renderer/components/InsurancePolicyForm';
import PositionForm, { Position } from 'renderer/components/PositionForm';
import ProjectForm, { Project } from 'renderer/components/ProjectForm';
import SubcontractForm, { Subcontract } from 'renderer/components/SubcontractForm';
import UserForm, { User } from 'renderer/components/UserForm';

import { Resource as BaseResource } from 'renderer/components/MasterForm';
import { Component } from 'react';
import { FetchApi } from 'renderer/components/Auth';
import InputWrapper from 'renderer/components/InputWrapper';
import { Link } from 'react-router-dom';
import singularise from 'renderer/utils/singularise';

const resources = ['users', 'employees', 'subcontracts', 'positions', 'projects', 'insurance_policies', 'insurance_companies'] as const;

export type Data = Record<string, unknown>;
export type Files = Record<string, File>;
type InFlight = 'creating' | 'error' | 'fetching' | null;
type ResourceName = typeof resources[number];
type Resource = BaseResource & Record<string, unknown>;
type Resources = Map<ResourceName, Resource[]>;
type search_item= {value:string};

interface Props {
  fetchApi: FetchApi;
  readonly: boolean;
  showUsers: boolean;
}

interface State {
  activeSubTab: 'new' | 'edit' | 'view';
  activeTab: ResourceName;
  inFlight: InFlight;
  resourceEditing: Resource | null;
  resources: Resources;
  search_item:search_item;
}

export default class MasterPage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      activeTab: 'employees',
      activeSubTab: props.readonly ? 'view' : 'new',
      inFlight: 'fetching',
      resourceEditing: null,
      resources: new Map(),
      search_item:{value:""},
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchResources()
  }
  componentDidUpdate(prevProps: Props, prevState: State) {
    if(prevState.search_item.value!=this.state.search_item.value){
      if(this.state.search_item.value!=''){
      // console.log(res[0]["name"]);
      }else{
      }

    }
    if (prevState.activeTab !== this.state.activeTab) {
      this.setState({
        activeSubTab: this.state.activeSubTab === 'edit' ? (this.props.readonly ? 'view' : 'new') : this.state.activeSubTab,
        resourceEditing: null,
        search_item:{value:''}
      });
    }
  }

  async fetchResources() {
    try {
      this.setState({
        inFlight: 'fetching'
      });
      const ret: Resources = new Map();
      await Promise.all(resources.map(async (resourceName) => {
        if (!this.props.showUsers && resourceName === 'users') {
          return;
        }
        const response = await this.props.fetchApi('GET', resourceName);
        ret.set(resourceName, response[resourceName]);
      }));
      this.setState({
        inFlight: null,
        resources: ret
      });
    } catch (error) {
      console.error('[master] error while fetching', {
        error
      });
      this.setState({
        inFlight: 'error'
      });
    }
  }

  getTableKeys() {
    switch (this.state.activeTab) {
      case 'users':
        return ['name', 'email', 'role'];
      case 'employees':
        return ['hired_date', 'code', 'name', 'date_of_birth', 'sex', 'skill'];
      case 'subcontracts':
        return ['code', 'name'];
      case 'projects':
        return ['code', 'name', 'acronym', 'start_date', 'end_date'];
      case 'insurance_policies':
        return ['code', 'start_date', 'end_date', 'details'];
      case 'insurance_companies':
        return ['code', 'name'];
      case 'positions':
        return ['code', 'name', 'minimum_pay', 'maximum_pay'];
    }
  }

  async handleDelete(id: string) {
    try {
      await this.props.fetchApi('DELETE', `${this.state.activeTab}/${id}`);
      await this.fetchResources();
    } catch (error: { status: number }) {
      if (error.status === 409) {
        alert('Sorry - something is dependent on that resource. Please delete all child resources first.');
        return;
      }

      throw error;
    }
  }

  async handleSubmit(data: Data, files: Files = {}) {
    const { activeSubTab, activeTab, resourceEditing } = this.state;
    const method = activeSubTab === 'edit' ? 'PUT' : 'POST';
    const endpoint = activeSubTab === 'edit' ? `${activeTab}/${resourceEditing?.id}` : activeTab
    await this.props.fetchApi(method, endpoint, { [singularise(activeTab)]: data }, {}, files);
    await this.fetchResources();
    this.setState({ activeSubTab: 'view' });
  }

  render() {
    const { readonly, showUsers } = this.props;
    const { activeSubTab, inFlight, resourceEditing } = this.state;
    if (inFlight === 'fetching') {
      return <div>Loading...</div>;
    }

    if (inFlight === 'error') {
      return <div>An error occurred</div>
    }

    return (
      <div className="MasterPage">
        <div className="backToIndex">
          <Link to="/"><button type="button">Go Back</button></Link>
        </div>
        <div className="tabs">
          {showUsers && (
            this.renderTab('users')
          )}
          {this.renderTab('employees')}
          {this.renderTab('subcontracts')}
          {this.renderTab('projects')}
          {this.renderTab('insurance_policies')}
          {this.renderTab('insurance_companies')}
          {this.renderTab('positions')}
        </div>

        <div className="container">
          <div className="containerTabs">
            {!readonly && (
              <button className={`containerTab newTab ${activeSubTab === 'new' ? 'active' : ''}`} onClick={() => this.setState({ activeSubTab: 'new'})}>New</button>
            )}
            <button className={`containerTab editTab ${activeSubTab === 'edit' ? 'active' : ''}`} disabled={!resourceEditing} onClick={() => this.setState({ activeSubTab: 'edit'})}>{readonly ? 'View One' : 'Edit'}</button>
            <button className={`containerTab viewTab ${activeSubTab === 'view' ? 'active' : ''}`} onClick={() => this.setState({ activeSubTab: 'view' })}>{readonly ? 'View All' : 'View'}</button>
          </div>
          <div className="containerContent">
            {activeSubTab === 'view' ? this.renderTable() : this.renderForm()}
          </div>
        </div>
      </div>
    );
  }

  renderForm() {
    const { readonly } = this.props;
    const { activeSubTab, activeTab, resources, resourceEditing } = this.state;
    if (activeSubTab === 'edit' && !resourceEditing) {
      return (
        <div>Select a record from the view tab first</div>
      );
    }

    switch (activeTab) {
      case 'employees':
        return (
          <EmployeeForm
            employee={this.state.activeSubTab === 'edit' ? this.state.resourceEditing as unknown as Employee : undefined}
            fetchApi={this.props.fetchApi}
            onClose={() => this.setState({
              activeSubTab: 'view',
              resourceEditing: null
            })}
            onDelete={async () => {
              await this.handleDelete(resourceEditing?.id ?? '');
              this.setState({
                activeSubTab: 'view',
                resourceEditing: null
              });
            }}
            onSubmit={this.handleSubmit}
            positions={resources.get('positions') ?? []}
            projects={resources.get('projects') ?? []}
            readonly={readonly}
            subcontracts={resources.get('subcontracts') ?? []}
          />
        );
      case 'insurance_companies':
        return (
          <InsuranceCompanyForm
            fetchApi={this.props.fetchApi}
            insuranceCompany={this.state.activeSubTab === 'edit' ? this.state.resourceEditing as unknown as InsuranceCompany : undefined}
            onClose={() => this.setState({
              activeSubTab: 'view',
              resourceEditing: null
            })}
            onDelete={async () => {
              await this.handleDelete(resourceEditing?.id ?? '');
              this.setState({
                activeSubTab: 'view',
                resourceEditing: null
              });
            }}
            onSubmit={this.handleSubmit}
            readonly={readonly}
          />
        );
      case 'insurance_policies':
        return (
          <InsurancePolicyForm
            fetchApi={this.props.fetchApi}
            insuranceCompanies={resources.get('insurance_companies') ?? []}
            insurancePolicy={this.state.activeSubTab === 'edit' ? this.state.resourceEditing as unknown as InsurancePolicy : undefined}
            onClose={() => this.setState({
              activeSubTab: 'view',
              resourceEditing: null
            })}
            onDelete={async () => {
              await this.handleDelete(resourceEditing?.id ?? '');
              this.setState({
                activeSubTab: 'view',
                resourceEditing: null
              });
            }}
            onSubmit={this.handleSubmit}
            projects={resources.get('projects') ?? []}
            readonly={readonly}
          />
        );
      case 'positions':
        return (
          <PositionForm
            fetchApi={this.props.fetchApi}
            onClose={() => this.setState({
              activeSubTab: 'view',
              resourceEditing: null
            })}
            onDelete={async () => {
              await this.handleDelete(resourceEditing?.id ?? '');
              this.setState({
                activeSubTab: 'view',
                resourceEditing: null
              });
            }}
            onSubmit={this.handleSubmit}
            position={this.state.activeSubTab === 'edit' ? this.state.resourceEditing as unknown as Position : undefined}
            readonly={readonly}
          />
        );
      case 'projects':
        return (
          <ProjectForm
            fetchApi={this.props.fetchApi}
            onClose={() => this.setState({
              activeSubTab: 'view',
              resourceEditing: null
            })}
            onDelete={async () => {
              await this.handleDelete(resourceEditing?.id ?? '');
              this.setState({
                activeSubTab: 'view',
                resourceEditing: null
              });
            }}
            onSubmit={this.handleSubmit}
            project={this.state.activeSubTab === 'edit' ? this.state.resourceEditing as unknown as Project : undefined}
            readonly={readonly}
          />
        );
      case 'subcontracts':
        return (
          <SubcontractForm
            fetchApi={this.props.fetchApi}
            onClose={() => this.setState({
              activeSubTab: 'view',
              resourceEditing: null
            })}
            onDelete={async () => {
              await this.handleDelete(resourceEditing?.id ?? '');
              this.setState({
                activeSubTab: 'view',
                resourceEditing: null
              });
            }}
            onSubmit={this.handleSubmit}
            readonly={readonly}
            subcontract={this.state.activeSubTab === 'edit' ? this.state.resourceEditing as unknown as Subcontract : undefined}
          />
        );
      case 'users':
        return (
          <UserForm
            fetchApi={this.props.fetchApi}
            onClose={() => this.setState({
              activeSubTab: 'view',
              resourceEditing: null
            })}
            onDelete={async () => {
              await this.handleDelete(resourceEditing?.id ?? '');
              this.setState({
                activeSubTab: 'view',
                resourceEditing: null
              });
            }}
            onSubmit={this.handleSubmit}
            readonly={readonly}
            user={this.state.activeSubTab === 'edit' ? this.state.resourceEditing as unknown as User : undefined}
          />
        );
      default:
        return <></>;
    }
  }

  renderTab(name: ResourceName) {
    const label = name
      .replace(/_/g, ' ').split(' ')
      .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
      .join(' ');
    return (
      <button
        className={`tab ${this.state.activeTab === name ? 'active' : ''}`}
        onClick={() => this.setState({ activeTab: name })}
      >
        {label}
      </button>
    );
  }


  onChange_input_search(val){
    this.setState({search_item:{value:val.currentTarget.value}})
    // console.log(val.currentTarget.value)
  }
  filter_resource(resources){
    switch(this.state.activeTab){
      case 'users':
      return resources.filter(o => {return o.name.toLowerCase().includes(this.state.search_item.value.toLowerCase())|| o.email.toLowerCase().includes(this.state.search_item.value.toLowerCase()) });
      case 'employees':
        resources.filter(o => o.code.includes(this.state.search_item.value))
        return resources.filter(o => {
          return o.code.includes(this.state.search_item.value) || o.name.toLowerCase().includes(this.state.search_item.value.toLowerCase())});
      case 'positions':
        return resources.filter(o => {
          return o.code.includes(this.state.search_item.value) || o.name.toLowerCase().includes(this.state.search_item.value.toLowerCase())});
      case 'projects':
        return resources.filter(o => {
          return o.code.includes(this.state.search_item.value) || o.name.toLowerCase().includes(this.state.search_item.value.toLowerCase()) || o.acronym.toLowerCase().includes(this.state.search_item.value.toLowerCase())     });
      case 'subcontracts':
        return resources.filter(o => {
          return o.code.includes(this.state.search_item.value) || o.name.toLowerCase().includes(this.state.search_item.value.toLowerCase())});
      case 'insurance_policies':
        return resources.filter(o => {return o.code.includes(this.state.search_item.value)});
      case 'insurance_companies':
        resources.filter(o => o.code.includes(this.state.search_item.value))
        return resources.filter(o => {
          return o.code.includes(this.state.search_item.value) || o.name.toLowerCase().includes(this.state.search_item.value.toLowerCase())});
        default:
        return resources;
    }
  }
  renderTable() {
    var resources = this.state.resources.get(this.state.activeTab) ?? [];
    const keys = this.getTableKeys();
    resources=this.filter_resource(resources)
    
    return (
      <div className="tableWrapper">
        <div className='InputWrapper'>
        <input type="text" placeholder='Search by name or code' onChange={this.onChange_input_search.bind(this)} value={this.state.search_item.value}  name="search bar"  />
       </div>
        <table>
          <thead>
            <tr>
              <th className="buttons"></th>
              {keys.map((key) => <th>{key}</th>)}
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr>
                <td className="buttons">
                  <button
                    onClick={() => this.setState({
                      activeSubTab: 'edit',
                      resourceEditing: resource
                    })}
                  >{this.props.readonly ? 'View' : 'Edit'}</button>
                  {!this.props.readonly && (
                    <button
                      className="delete"
                      onClick={() => this.handleDelete(resource.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
                {keys.map((key, index) => {
                  const value = resource[key];
                  return <td key={index}>{typeof value === 'string' ? value : JSON.stringify(value)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
