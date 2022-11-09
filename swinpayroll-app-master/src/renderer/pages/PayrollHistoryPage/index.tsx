import { Component, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';

import printJS from 'print-js'

import { FetchApi } from 'renderer/components/Auth';
import { Employee } from 'renderer/components/EmployeeForm';
import InputWrapper from 'renderer/components/InputWrapper';
import MasterForm, { Resource } from 'renderer/components/MasterForm';
import getDateAtStartOfWeek from 'renderer/utils/getDateAtStartOfWeek';
import snakeCase from 'renderer/utils/snakeCase';
import titleCase from 'renderer/utils/titleCase';

import './style.scss';


interface PayrollHistory {
  id?: string;
  week_start_date: string;
  employee_id: string;
  hours_day_1: number;
  hours_day_2: number;
  hours_day_3: number;
  hours_day_4: number;
  hours_day_5: number;
  hours_day_6: number;
  hours_day_7: number;
  slip_regular_hours: number;
  slip_overtime_hours: number;
  slip_addition_1: number;
  slip_addition_2: number;
  slip_addition_3: number;
  slip_deduction_1: number;
  slip_deduction_2: number;
  slip_deduction_3: number;
  slip_deduction_4: number;
  slip_deduction_5: number;
  slip_deduction_6: number;
  // automatically filled in
  project_id: string;
  employee_hourly_rate: number;
  employee_overtime_rate: number
  employee_position: string;
}

interface Props {
  fetchApi: FetchApi;
  readonly: boolean;
}

type InFlight = 'creating' | 'error' | 'fetching' | null;

interface State {
  employees: Resource[];
  inFlight: InFlight;
  newWeeklyPayrollHistory: PayrollHistory;
  positions: Resource[];
  projects: Resource[];
  weeklyPayrollHistories: PayrollHistory[];
}

const numAttrs = [
  'hours_day_1',
  'hours_day_2',
  'hours_day_3',
  'hours_day_4',
  'hours_day_5',
  'hours_day_6',
  'hours_day_7',
  'slip_regular_hours',
  'slip_overtime_hours',
  'slip_addition_1',
  'slip_addition_2',
  'slip_addition_3',
  'slip_deduction_1',
  'slip_deduction_2',
  'slip_deduction_3',
  'slip_deduction_4',
  'slip_deduction_5',
  'slip_deduction_6'
] as const;


export default class PayrollHistoryPage extends Component<Props, State> {
  static formatStartDate(date: Date) {
    const pad = (number: number) => number.toString().padStart(2, '0');
    const startDate = getDateAtStartOfWeek(date);
    return `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
  }

  get defaultPayrollHistory() {
    return {
      week_start_date: PayrollHistoryPage.formatStartDate(new Date()),
      employee_id: '',
      hours_day_1: 0,
      hours_day_2: 0,
      hours_day_3: 0,
      hours_day_4: 0,
      hours_day_5: 0,
      hours_day_6: 0,
      hours_day_7: 0,
      slip_regular_hours: 0,
      slip_overtime_hours: 0,
      slip_addition_1: 0,
      slip_addition_2: 0,
      slip_addition_3: 0,
      slip_deduction_1: 0,
      slip_deduction_2: 0,
      slip_deduction_3: 0,
      slip_deduction_4: 0,
      slip_deduction_5: 0,
      slip_deduction_6: 0,
      project_id: '',
      employee_hourly_rate: 0,
      employee_overtime_rate: 0,
      employee_position: 'Choose an employee'
    };
  }

  get submitMethod() {
    const { newWeeklyPayrollHistory } = this.state;
    const isNew = !newWeeklyPayrollHistory.id;
    const allNumValues0 = numAttrs.every((attr) => newWeeklyPayrollHistory[attr] === 0);
    if (allNumValues0) {
      return isNew ? null : 'DELETE';
    }

    return isNew ? 'POST' : 'PUT';
  }

  constructor(props: Props) {
    super(props);

    this.state = {
      employees: [],
      inFlight: 'fetching',
      newWeeklyPayrollHistory: this.defaultPayrollHistory,
      positions: [],
      projects: [],
      weeklyPayrollHistories: []
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePrint = this.handlePrint.bind(this);
    this.handleSaveCsv = this.handleSaveCsv.bind(this);
    this.handleSavePdf = this.handleSavePdf.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchResources();
  }

  async fetchResources() {
    try {
      this.setState({
        inFlight: 'fetching'
      });
      const resources: Pick<State, 'employees' | 'positions' | 'projects' | 'weeklyPayrollHistories'> = {
        employees: [],
        positions: [],
        projects: [],
        weeklyPayrollHistories: []
      };
      await Promise.all((['employees', 'positions', 'projects', 'weeklyPayrollHistories'] as const).map(async (resourceName) => {
        const endpoint = snakeCase(resourceName);
        const response = await this.props.fetchApi('GET', endpoint);
        const data = response[endpoint];
        if (resourceName === 'employees') {
          (data as Employee[]).sort((a, b) => {
            if (a.name > b.name) {
              return 1;
            }

            if (b.name > a.name) {
              return -1;
            }

            return 0;
          });
        }
        resources[resourceName] = data;
      }));
      this.setState({
        inFlight: null,
        ...resources
      });
    } catch (error) {
      console.error('[payroll-history] error while fetching', {
        error
      });
      this.setState({
        inFlight: 'error'
      });
    }
  }

  handleChange(key: keyof PayrollHistory, value: PayrollHistory[keyof PayrollHistory]) {
    const extraAttrs: Partial<PayrollHistory> = {};
    if (key === 'employee_id') {
      const employee = this.state.employees.find(({ id }) => id === value) as Employee;
      const position = this.state.positions.find(({ id }) => id === employee?.position_id);
      extraAttrs.project_id = employee?.project_id ?? '';
      extraAttrs.employee_hourly_rate = employee?.hourly_rate ?? 0;
      extraAttrs.employee_overtime_rate = employee?.overtime_rate ?? 0;
      extraAttrs.employee_position = position?.name ?? (employee ? 'Unknown' : 'Choose an employee');
    }

    if (key === 'week_start_date') {
      value = PayrollHistoryPage.formatStartDate(new Date(value as string));
    }

    this.setState({
      newWeeklyPayrollHistory: {
        ...this.state.newWeeklyPayrollHistory,
        ...extraAttrs,
        [key]: value
      }
    }, () => {
      if (key === 'employee_id' || key === 'week_start_date') {
        const { newWeeklyPayrollHistory, weeklyPayrollHistories } = this.state;
        const matchingWeeklyPayrollHistory = weeklyPayrollHistories.find(({ employee_id, week_start_date }) => {
          return employee_id === newWeeklyPayrollHistory.employee_id && week_start_date === newWeeklyPayrollHistory.week_start_date;
        });
        if (matchingWeeklyPayrollHistory) {
          this.setState({
            newWeeklyPayrollHistory: matchingWeeklyPayrollHistory
          });
        }
      }
    });
  }

  handleClear() {
    this.setState({
      newWeeklyPayrollHistory: {
        ...this.state.newWeeklyPayrollHistory,
        hours_day_1: 0,
        hours_day_2: 0,
        hours_day_3: 0,
        hours_day_4: 0,
        hours_day_5: 0,
        hours_day_6: 0,
        hours_day_7: 0,
        slip_regular_hours: 0,
        slip_overtime_hours: 0,
        slip_addition_1: 0,
        slip_addition_2: 0,
        slip_addition_3: 0,
        slip_deduction_1: 0,
        slip_deduction_2: 0,
        slip_deduction_3: 0,
        slip_deduction_4: 0,
        slip_deduction_5: 0,
        slip_deduction_6: 0
      }
    });
  }

  handleKeyUp(event: KeyboardEvent<HTMLDivElement>) {
    if (event.code !== 'Enter') {
      return;
    }

    event.preventDefault();

    type Input = HTMLInputElement | HTMLSelectElement | null
    let nextInput: Input = event.target as HTMLInputElement | HTMLSelectElement;
    const find = (element: Element | null | undefined) => element?.nextElementSibling?.querySelector('input, select') as Input;
    do {
      let newNextInput = find(nextInput.parentElement)
      if (!newNextInput) {
        newNextInput = find(nextInput.parentElement?.parentElement);
      }

      nextInput = newNextInput;
    } while (nextInput?.disabled);
    nextInput?.focus();
  }

  async handlePrint() {
    const { id } = this.state.newWeeklyPayrollHistory;
    if (!id) {
      return;
    }

    const blob = await this.props.fetchApi('GET', `weekly_payroll_histories/${id}/pdf`);
    const fileReader = new FileReader();
    fileReader.addEventListener('load', async () => {
      if (fileReader.readyState === 2 && typeof fileReader.result === 'string') {
        console.log(fileReader.result, fileReader.result.split(',')[1])
        printJS({ printable: fileReader.result.split(',')[1], type: 'pdf', base64: true })
      }
    });
    fileReader.readAsDataURL(blob);
  }

  async handleSaveCsv() {
    const { app, dialog, getCurrentWindow } = require('@electron/remote');
    const fs = require('fs');
    const path = require('path');
    const blob = await this.props.fetchApi('GET', 'weekly_payroll_histories/csv');
    const fileReader = new FileReader();
    fileReader.addEventListener('load', async () => {
      if (fileReader.readyState === 2 && fileReader.result && fileReader.result instanceof ArrayBuffer) {
        const buffer = Buffer.from(new Uint8Array(fileReader.result));
        const { filePath } = await dialog.showSaveDialog(getCurrentWindow(), {
          defaultPath: path.join(app.getPath('downloads'), 'weekly-payroll-histories.csv'),
          filters: [
            { name: 'CSV', extensions: ['csv'] }
          ]
        });
        if (!filePath) {
          return;
        }

        await fs.promises.writeFile(filePath, buffer);
      }
    });
    fileReader.readAsArrayBuffer(blob);
  }

  async handleSavePdf() {
    const { id } = this.state.newWeeklyPayrollHistory;
    if (!id) {
      return;
    }

    const { app, dialog, getCurrentWindow } = require('@electron/remote');
    const fs = require('fs');
    const path = require('path');
    const blob = await this.props.fetchApi('GET', `weekly_payroll_histories/${id}/pdf`);
    const fileReader = new FileReader();
    fileReader.addEventListener('load', async () => {
      if (fileReader.readyState === 2 && fileReader.result && fileReader.result instanceof ArrayBuffer) {
        const buffer = Buffer.from(new Uint8Array(fileReader.result));
        const { filePath } = await dialog.showSaveDialog(getCurrentWindow(), {
          defaultPath: path.join(app.getPath('downloads'), `weekly-payroll-history-${id}.pdf`),
          filters: [
            { name: 'PDF', extensions: ['pdf'] }
          ]
        });
        if (!filePath) {
          return;
        }

        await fs.promises.writeFile(filePath, buffer);
      }
    });
    fileReader.readAsArrayBuffer(blob);
  }

  async handleSubmit() {
    const { submitMethod } = this;
    if (!submitMethod) {
      return;
    }

    const { newWeeklyPayrollHistory } = this.state;
    const endpoint = submitMethod === 'POST' ? 'weekly_payroll_histories' : `weekly_payroll_histories/${newWeeklyPayrollHistory.id}`;
    await this.props.fetchApi(submitMethod, endpoint, { weekly_payroll_history: newWeeklyPayrollHistory });
    this.setState({
      newWeeklyPayrollHistory: this.defaultPayrollHistory
    });
    await this.fetchResources();
  }

  render() {
    const { employees, inFlight, newWeeklyPayrollHistory, projects } = this.state;
    if (inFlight === 'fetching') {
      return <div>Loading...</div>;
    }

    if (inFlight === 'error') {
      return <div>An error occurred</div>
    }

    const employee = this.state.employees.find(({ id }) => id === newWeeklyPayrollHistory.employee_id) as Employee;
    return (
      <div className="PayrollHistoryPage">
        <div className="backToIndex">
          <Link to="/"><button type="button">Go Back</button></Link>
        </div>
          <div onKeyUp={this.handleKeyUp} className="payrollWrapper">
            <MasterForm<PayrollHistory>
              onChange={this.handleChange}
              onSubmit={this.handleSubmit}
              renderButtons={false}
            >
              {(errors, onSubmit) => (
                <>
                  <div>
                    <InputWrapper attribute="week_start_date" errors={errors}>
                      <>
                        <div className="label">Start of Week:</div>
                        <input name="week_start_date" type="date" value={newWeeklyPayrollHistory.week_start_date} />
                      </>
                    </InputWrapper>
                    <InputWrapper attribute="employee_id" errors={errors}>
                      <>
                        <div className="label">Employee:</div>
                        <select name="employee_id" value={newWeeklyPayrollHistory.employee_id}>
                          {MasterForm.renderSelectOptions(employees)}
                        </select>
                      </>
                    </InputWrapper>
                    <div>
                      <div>
                        <div className="label">Project Name</div>
                        <input disabled={true} type="text" value={employee ? (projects.find((project) => project.id === newWeeklyPayrollHistory.project_id)?.name ?? 'Unknown') : 'Choose an employee'} />
                      </div>
                    </div>

                    <div>
                      <div>
                        <div className="label">Employee Hourly Rate:</div>
                        <input disabled={true} type="number" value={newWeeklyPayrollHistory.employee_hourly_rate} />
                      </div>
                    </div>

                    <div>
                      <div>
                        <div className="label">Employee Overtime Rate:</div>
                        <input disabled={true} type="number" value={newWeeklyPayrollHistory.employee_overtime_rate} />
                      </div>
                    </div>

                    <div>
                      <div>
                        <div className="label">Employee Position</div>
                        <input disabled={true} type="text" value={newWeeklyPayrollHistory.employee_position} />
                      </div>
                    </div>
                  </div>
                  <div></div>
                  <div>
                    {
                      numAttrs.slice(0,9).map((attr) => (
                        <InputWrapper attribute={attr} errors={errors}>
                          <>
                            <div className="label">{titleCase(attr)}:</div>
                            <input disabled={this.props.readonly} name={attr} type="number" min="0" value={newWeeklyPayrollHistory[attr]} />
                          </>
                        </InputWrapper>
                      ))
                    }
                  </div>
                  <div>
                    {
                      numAttrs.slice(9,18).map((attr) => (
                        <InputWrapper attribute={attr} errors={errors}>
                          <>
                            <div className="label">{titleCase(attr)}:</div>
                            <input disabled={this.props.readonly} name={attr} type="number" min="0" value={newWeeklyPayrollHistory[attr]} />
                          </>
                        </InputWrapper>
                      ))
                    }
                  </div>

                  <div className="buttons">
                    <button disabled={!this.state.newWeeklyPayrollHistory.id} onClick={this.handlePrint} type="button">Print</button>
                    <button disabled={!this.state.newWeeklyPayrollHistory.id} onClick={this.handleSavePdf} type="button">Save PDF</button>
                    <button onClick={this.handleSaveCsv} type="button">Save CSV (all records)</button>
                    {!this.props.readonly && (
                      <>
                        <div></div>
                        <div></div>
                        <button onClick={this.handleClear} type="button">Clear</button>
                        <button onClick={onSubmit} type="button">Save</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </MasterForm>
          </div>

      </div>
    );
  }
}
