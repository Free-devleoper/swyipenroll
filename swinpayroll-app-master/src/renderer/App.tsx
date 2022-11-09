import { Component } from 'react';
import { HashRouter as Router, Navigate, Routes, Route } from 'react-router-dom';

import Auth, { Role } from 'renderer/components/Auth';
import IndexPage from 'renderer/pages/IndexPage';
import LoginPage from 'renderer/pages/LoginPage';
import MasterPage from 'renderer/pages/MasterPage';
import PayrollHistoryPage from 'renderer/pages/PayrollHistoryPage';

import './App.css';

export default class App extends Component {
  render() {
    return (
      <Router>
        <Auth>
          {({ fetchApi, onLogin, onLogout, user }) => {
            return (
              <>
                {user ? (
                  <Routes>
                    <Route path="/" element={<IndexPage onLogout={onLogout} showRecords={user.role !== Role.LEVEL_3}  />} />
                    {user.role !== Role.LEVEL_3 && <Route path="/master" element={<MasterPage fetchApi={fetchApi} readonly={user.role !== Role.LEVEL_1} showUsers={user.role === Role.LEVEL_1} />} />}
                    <Route path="/payroll-history" element={<PayrollHistoryPage fetchApi={fetchApi} readonly={user.role === Role.LEVEL_3} />} />
                  </Routes>
                ) : (
                  <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
                  </Routes>
                )}
              </>
            );
          }}
        </Auth>
      </Router>
    );
  }
}
