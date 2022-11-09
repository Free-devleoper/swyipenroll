import { Component, ReactElement } from 'react';

import { useNavigate } from 'react-router-dom';

import fetchApi from 'renderer/utils/fetchApi';

export enum Role {
  LEVEL_1 = 'level1',
  LEVEL_2 = 'level2',
  LEVEL_3 = 'level3'
}

interface User {
  id: string;
  create_date: string;
  update_date: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

export type FetchApi = typeof Auth.prototype.fetchApi;
export type OnLogin = typeof Auth.prototype.handleLogin;
export type OnLogout = typeof Auth.prototype.handleLogout;

interface Props {
  children: (args: {
    fetchApi: FetchApi;
    onLogin: OnLogin;
    onLogout: OnLogout;
    user: User | null;
  }) => ReactElement;
  navigate: ReturnType<typeof useNavigate>;
}

interface State {
  inFlight: boolean;
  user: User | null;
}

const LOCAL_STORAGE_KEY = 'auth_token';

function withNavigate(Component: typeof Auth) {
  return (props: Omit<Props, 'navigate'>) => {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  };
}

export class Auth extends Component<Props, State> {
  authToken = localStorage.getItem(LOCAL_STORAGE_KEY);

  constructor(props: Props) {
    super(props);

    this.state = {
      inFlight: true,
      user: null
    };

    this.fetchApi = this.fetchApi.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  async componentDidMount() {
    const isAuthed = await this.verify();
    if (!isAuthed) {
      this.props.navigate('/login');
    }

    this.setState({
      inFlight: false
    });
  }

  fetchApi(...[method, endpoint, data, headers, files]: Parameters<typeof fetchApi>) {
    return fetchApi(method, endpoint, data, {
      ...headers,
      Authorization: `Bearer ${this.authToken}`
    }, files);
  }

  handleLogin(user: User) {
    this.setState({
      user
    });
    this.storeToken(user);
    this.props.navigate('/');
  }

  handleLogout() {
    this.storeToken();
    this.setState({
      user: null
    });
    this.props.navigate('/login');
  }

  render() {
    if (this.state.inFlight) {
      return <div>Loading...</div>;
    }

    return this.props.children({
      fetchApi: this.fetchApi,
      onLogin: this.handleLogin,
      onLogout: this.handleLogout,
      user: this.state.user
    });
  }

  storeToken(user?: User) {
    const token = user?.token ?? null;
    this.authToken = token;

    if (token) {
      localStorage.setItem(LOCAL_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  async verify() {
    if (!this.authToken) {
      return false;
    }

    try {
      const user = await fetchApi('GET', 'auth/verify', {
        token: this.authToken
      });
      this.storeToken(user);
      this.setState({
        user
      });
      return true;
    } catch {
      return false;
    }
  }
}

export default withNavigate(Auth);
