import fs from 'fs';
import { AddressInfo } from 'net';

import cors from 'cors';
import express, { Request, Response } from 'express';
import multer from 'multer';
import { render } from 'mustache';

import authManager from './auth-manager';
import browser from './browser';
import { httpPort } from './config';
import { TEMPLATES_DIR, UPLOADS_DIR } from './constants';
import crypto from './crypto';
import { Role, TableName } from './enums';
import database from './database';
import inputValidator from './input-validator';
import Logger from './logger';
import { Employee, Position, Project, UserCreate, UserStore, WeeklyPayrollHistory } from './models';
import { createRecord, deleteRecord, getAllRecords, getOneRecord, updateRecord } from './resources';
import { titleCase } from './util';

const upload = multer();

class HttpServer {
  private apiV1Router = express.Router();
  private app = express();
  private logger = new Logger('http-server');
  private requestId = 0;

  constructor() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(authManager.initialise());
    this.app.use((req, res, next) => {
      req.logger = Logger.wrapWithMetadata(this.logger, {
        requestId: ++this.requestId
      });
      req.logger.debug('request', {
        method: req.method,
        url: req.url
      });
      next();
    });
    this.app.use('/api/v1', this.apiV1Router);

    this.defineRoutes();
    const server = this.app.listen(httpPort, () => {
      this.logger.info('listening', {
        port: (server.address() as AddressInfo).port
      });
    });
  }

  private defineRoutes() {
    // Auth
    this.apiV1Router.post('/auth/log_in', authManager.authenticate(), (req, res) => {
      const user = req.user as UserStore;
      res.json(authManager.signUserObject(user));

      req.logger.info('logged in user', {
        user
      });
    });
    this.apiV1Router.get('/auth/verify', async (req, res) => {
      const { token } = req.query;
      if (typeof token !== 'string') {
        res.sendStatus(400);
        return;
      }
      const decoded = await authManager.decodeUserToken(token);
      if (!decoded) {
        req.logger.warn('refused to verify user due to unknown token decoding error');
        res.sendStatus(401);
        return;
      }

      try {
        const user = await database.knex<UserStore>(TableName.USERS)
          .where('id', decoded.id)
          .first();
        if (user && authManager.tokenIsValid(decoded)) {
          res.json(authManager.signUserObject(user));
        } else {
          req.logger.warn('refused to verify user, token is invalid', {
            iat: decoded.iat
          });
          res.sendStatus(401);
        }
      } catch (err) {
        req.logger.error('error while verifying user', {
          err
        });
        res.sendStatus(500);
      }
    });

    // Employees
    this.apiV1Router.get('/employees', authManager.assertUser(), getAllRecords(TableName.EMPLOYEES));
    this.apiV1Router.get('/employees/:id', authManager.assertUser(), getOneRecord(TableName.EMPLOYEES));
    this.apiV1Router.get('/employees/:id/photo',  authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), (req, res) => {
      res.sendFile(`${UPLOADS_DIR}/employee_photos/${req.params.id}`, (error) => {
        if (error) {
          res.sendStatus(404);
        }
      });
    });

    const employeeUploadFields = upload.fields([
      {
        maxCount: 1,
        name: 'cv'
      },
      {
        maxCount: 1,
        name: 'photo'
      }
    ]);
    const employeeFileStructure = [
      ['cv', 'application/pdf'],
      ['photo', 'image/']
    ];
    const handleEmployeeUploads = async (req: Request, res: Response) => {
      try {
        await Promise.all(Object.entries(req.files ?? {}).map(([name, [file]]) => {
          return fs.promises.writeFile(`${UPLOADS_DIR}/employee_${name}s/${req.params.id ?? res.locals.id}`, file.buffer);
        }));
        res.sendStatus(204);
      } catch (error) {
        req.logger.error('error while handling employee uploads', {
          error
        });
        res.sendStatus(500);
      }
    };
    this.apiV1Router.post('/employees', authManager.assertRoles(Role.LEVEL_1), employeeUploadFields, inputValidator.validateModel(TableName.EMPLOYEES), (req, res, next) => {
      const files = req.files as Record<string, Express.Multer.File[]>;
      if (!files) {
        next();
        return;
      }

      for (const [name, mimeStart] of employeeFileStructure) {
        const file = files[name]?.[0];
        if (!file) {
          continue;
        }

        if (!file.mimetype.startsWith(mimeStart)) {
          res.sendStatus(400);
          return;
        }
      }

      next();
    }, createRecord(TableName.EMPLOYEES, false), handleEmployeeUploads);
    this.apiV1Router.put('/employees/:id', authManager.assertRoles(Role.LEVEL_1), employeeUploadFields, inputValidator.validateModel(TableName.EMPLOYEES), (req, res, next) => {
      const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
      for (const [name, mimeStart] of employeeFileStructure) {
        const file = files[name]?.[0];
        if (file && !file.mimetype.startsWith(mimeStart)) {
          res.sendStatus(400);
          return;
        }
      }

      next();
    }, updateRecord(TableName.EMPLOYEES, false), handleEmployeeUploads);
    this.apiV1Router.delete('/employees/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.EMPLOYEES));

    // Insurance Companies
    this.apiV1Router.get('/insurance_companies', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.INSURANCE_COMPANIES));
    this.apiV1Router.get('/insurance_companies/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.INSURANCE_COMPANIES));
    this.apiV1Router.post('/insurance_companies', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.INSURANCE_COMPANIES), createRecord(TableName.INSURANCE_COMPANIES));
    this.apiV1Router.put('/insurance_companies/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.INSURANCE_COMPANIES), updateRecord(TableName.INSURANCE_COMPANIES));
    this.apiV1Router.delete('/insurance_companies/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.INSURANCE_COMPANIES));

    // Insurance Policies
    this.apiV1Router.get('/insurance_policies', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.INSURANCE_POLICIES));
    this.apiV1Router.get('/insurance_policies/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.INSURANCE_POLICIES));
    this.apiV1Router.post('/insurance_policies', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.INSURANCE_POLICIES), createRecord(TableName.INSURANCE_POLICIES));
    this.apiV1Router.put('/insurance_policies/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.INSURANCE_POLICIES), updateRecord(TableName.INSURANCE_POLICIES));
    this.apiV1Router.delete('/insurance_policies/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.INSURANCE_POLICIES));

    // Positions
    this.apiV1Router.get('/positions', authManager.assertUser(), getAllRecords(TableName.POSITIONS));
    this.apiV1Router.get('/positions/:id', authManager.assertUser(), getOneRecord(TableName.POSITIONS));
    this.apiV1Router.post('/positions', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.POSITIONS), createRecord(TableName.POSITIONS));
    this.apiV1Router.put('/positions/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.POSITIONS), updateRecord(TableName.POSITIONS));
    this.apiV1Router.delete('/positions/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.POSITIONS));

    // Projects
    this.apiV1Router.get('/projects', authManager.assertUser(), getAllRecords(TableName.PROJECTS));
    this.apiV1Router.get('/projects/:id', authManager.assertUser(), getOneRecord(TableName.PROJECTS));
    this.apiV1Router.post('/projects', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.PROJECTS), createRecord(TableName.PROJECTS));
    this.apiV1Router.put('/projects/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.PROJECTS), updateRecord(TableName.PROJECTS));
    this.apiV1Router.delete('/projects/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.PROJECTS));

    // Subcontracts
    this.apiV1Router.get('/subcontracts', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.SUBCONTRACTS));
    this.apiV1Router.get('/subcontracts/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.SUBCONTRACTS));
    this.apiV1Router.post('/subcontracts', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.SUBCONTRACTS), createRecord(TableName.SUBCONTRACTS));
    this.apiV1Router.put('/subcontracts/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.SUBCONTRACTS), updateRecord(TableName.SUBCONTRACTS));
    this.apiV1Router.delete('/subcontracts/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.SUBCONTRACTS));

    // Users
    const userTransformCallback = async (user: UserCreate) => {
      const { password, password_confirmation, ...rest } = user;
      if (!password) {
        return { ...rest };
      }

      return {
        ...rest,
        password_hash: await crypto.hashPassword(password)
      };
    };
    this.apiV1Router.get('/users', authManager.assertRoles(Role.LEVEL_1), getAllRecords(TableName.USERS, ['password_hash']));
    this.apiV1Router.get('/users/:id', authManager.assertRoles(Role.LEVEL_1), getOneRecord(TableName.USERS, ['password_hash']));
    this.apiV1Router.post('/users', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.USERS), createRecord(TableName.USERS, true, userTransformCallback));
    this.apiV1Router.put('/users/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.USERS), updateRecord(TableName.USERS, true, userTransformCallback));
    this.apiV1Router.delete('/users/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.USERS));

    // Weekly Payroll Histories
    const weeklyPayrollHistoryTransformCallback = async (weeklyPayrollHistory: WeeklyPayrollHistory) => {
      const employee = await database.knex<Employee>(TableName.EMPLOYEES)
        .where('id', weeklyPayrollHistory.employee_id)
        .first();
      const position = await database.knex<Position>(TableName.POSITIONS)
        .where('id', employee?.position_id)
        .first();

      return {
        ...weeklyPayrollHistory,
        project_id: employee?.project_id ?? '',
        employee_position: position?.name ?? 'Unknown',
        employee_hourly_rate: employee?.hourly_rate ?? 0,
        employee_overtime_rate: employee?.overtime_rate ?? 0
      };
    };
    this.apiV1Router.get('/weekly_payroll_histories', authManager.assertUser(), getAllRecords(TableName.WEEKLY_PAYROLL_HISTORIES));
    this.apiV1Router.get('/weekly_payroll_histories/csv', authManager.assertUser(), async (req, res) => {
      const weeklyPayrollHistories = await database.knex<WeeklyPayrollHistory>(TableName.WEEKLY_PAYROLL_HISTORIES);
      const projects = await database.knex<Project>(TableName.PROJECTS);
      const employees = await database.knex<Employee>(TableName.EMPLOYEES);
      const positions = await database.knex<Position>(TableName.POSITIONS);
      const numAttrs = [
        'employee_hourly_rate',
        'employee_overtime_rate',
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
      const csvHeader = [
        'Start of Week',
        'Project',
        'Employee',
        'Employee Position',
        ...numAttrs.map((attr) => titleCase(attr))
      ].join(',');
      const csvBody = weeklyPayrollHistories.map((weeklyPayrollHistory) => {
        const project = projects.find(({ id }) => id === weeklyPayrollHistory.project_id);
        const employee = employees.find(({ id }) => id === weeklyPayrollHistory.employee_id);
        const position = employee ? positions.find(({ id }) => id === employee.position_id) : null;
        return [
          weeklyPayrollHistory.week_start_date,
          project?.name ?? 'Unknown',
          employee?.name ?? 'Unknown',
          position?.name ?? 'Unknown',
          ...numAttrs.map((attr) => weeklyPayrollHistory[attr])
        ].join(',');
      }).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.send(`${csvHeader}\n${csvBody}`);
    });
    this.apiV1Router.get('/weekly_payroll_histories/:id', authManager.assertUser(), getOneRecord(TableName.WEEKLY_PAYROLL_HISTORIES));
    this.apiV1Router.get('/weekly_payroll_histories/:id/pdf', authManager.assertUser(), async (req, res) => {
      try {
        const { id } = req.params;
        const weeklyPayrollHistory = await database.knex<WeeklyPayrollHistory>(TableName.WEEKLY_PAYROLL_HISTORIES)
          .where('id', id)
          .first();
        if (!weeklyPayrollHistory) {
          res.sendStatus(404);
          return;
        }

        const project = await database.knex<Project>(TableName.PROJECTS)
          .where('id', weeklyPayrollHistory.project_id)
          .first();
        const employee = await database.knex<Employee>(TableName.EMPLOYEES)
          .where('id', weeklyPayrollHistory.employee_id)
          .first();
        const position = employee?.position_id ? await database.knex<Position>(TableName.POSITIONS)
          .where('id', employee.position_id)
          .first() : null;

        const numEntries = Object.entries(weeklyPayrollHistory).filter(([key, value]) => typeof value === 'number').map(([key, value]) => {
          return [titleCase(key), value];
        });
        const html = render(fs.readFileSync(`${TEMPLATES_DIR}/weekly_payroll_history.html`, 'utf8'), {
          entries: Object.entries({
            'Start of Week': weeklyPayrollHistory.week_start_date,
            Project: project?.name ?? 'Unknown',
            Employee: employee?.name ?? 'Unknown',
            'Employee Position': position?.name ?? 'Unknown',
            ...Object.fromEntries(numEntries)
          }).map(([key, value]) => ({
            key,
            value
          })),
          id
        });
        const buffer = await browser.htmlToPdf(html);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(buffer);
      } catch (error) {
        this.logger.error('error while serving weekly payroll history pdf', {
          error
        });
      }
    });
    this.apiV1Router.post('/weekly_payroll_histories', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), inputValidator.validateModel(TableName.WEEKLY_PAYROLL_HISTORIES), createRecord(TableName.WEEKLY_PAYROLL_HISTORIES, true, weeklyPayrollHistoryTransformCallback));
    this.apiV1Router.put('/weekly_payroll_histories/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), inputValidator.validateModel(TableName.WEEKLY_PAYROLL_HISTORIES), updateRecord(TableName.WEEKLY_PAYROLL_HISTORIES));
    this.apiV1Router.delete('/weekly_payroll_histories/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), deleteRecord(TableName.WEEKLY_PAYROLL_HISTORIES));
  }
}

export default new HttpServer();
