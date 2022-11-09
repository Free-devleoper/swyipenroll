import { Component, FormEvent } from 'react';

import { OnLogin } from 'renderer/components/Auth';
import fetchApi from 'renderer/utils/fetchApi';

import logo from './logo.jpg';

import './style.scss';

interface Props {
  onLogin: OnLogin;
}

interface State {
  email: string;
  error: string;
  inFlight: boolean;
  password: string;
}

export default class LoginPage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      email: '',
      inFlight: false,
      password: ''
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(event: FormEvent) {
    event.preventDefault();

    this.setState({
      inFlight: true
    });

    try {
      const { email, password } = this.state;
      const user = await fetchApi('POST', 'auth/log_in', {
        email,
        password
      });
      this.props.onLogin(user);
    } catch (error: { status: number }) {
      console.error('error while logging in', {
        error
      });
      if (error.status >= 400 && error.status < 500) {
        this.setState({
          error: 'Invalid credentials'
        });
      } else {
        this.setState({
          error: 'Something went wrong, try again later'
        });
      }
    } finally {
      this.setState({
        inFlight: false
      });
    }
  }

  render() {
    const { error, inFlight } = this.state;
    return (
      <div className="LoginPage">
        <div className="header">
          <div className="logoContainer">
            <img src={logo} />
          </div>
          <div className="headingMain">
            Welcome to SwinPayroll
          </div>
        </div>

        <div className="body">
          <form onSubmit={this.handleSubmit}>
            <div className="headingSub">
              Sign In
            </div>

            <div>
              <label htmlFor="email">Email</label>
            </div>

            <div>
              <input type="text" id="email" onChange={(event) => this.setState({ email: event.target.value })} />
            </div>

            <div>
              <label htmlFor="password">Password</label>
            </div>

            <div>
              <input type="password" id="password" onChange={(event) => this.setState({ password: event.target.value })} />
            </div>

            <div>
              <button disabled={inFlight} type="submit">SIGN IN</button>
            </div>

            <div className="error">
              {error}
            </div>
          </form>
        </div>
      </div>
    );
  }
}
