import { Component } from 'react';
import { Link } from 'react-router-dom';

import { OnLogout } from 'renderer/components/Auth';

import logo from './logo.jpg';

import './style.scss';

interface Props {
  onLogout: OnLogout;
  showRecords: boolean;
}

export default class IndexPage extends Component<Props> {
  render() {
    return (
      <div className="IndexPage">
        <div className="header">
          <div className="logoContainer">
            <img src={logo} />
          </div>
          <div className="headingMain">
            Welcome to SwinPayroll
          </div>
        </div>
        <div className="body">
          {this.props.showRecords && (
            <div className="master">
              <Link to="/master"><button>Records</button></Link>
            </div>
          )}
          <div className="masterDetail">
            <Link to="/payroll-history"><button>Payroll History</button></Link>
          </div>
          <div className="logout">
            <button onClick={() => this.props.onLogout()}>Log Out</button>
          </div>
        </div>
      </div>
    );
  }
};
