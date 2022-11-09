import { NextFunction, Request, Response } from 'express';
import { omit } from 'lodash';
import { v4 } from 'uuid';

import database from './database';
import { TableName } from './enums';
import { singularise } from './util';

interface TransformCallback<T> {
  (data: T): Promise<Record<string, unknown>>;
}

export const createRecord = <T>(tableName: TableName, doRespond = true, transformCallback?: TransformCallback<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = v4();
      const rawData = req.body[singularise(tableName)];
      const storeData = transformCallback ? await transformCallback(rawData) : rawData;
      await database.knex<T>(tableName)
        .insert({
          id,
          ...storeData
        });
      if (doRespond) {
        res.sendStatus(204);
      } else {
        res.locals.id = id;
        next();
      }
    } catch (error) {
      req.logger.error('error while creating record', {
        tableName,
        error
      });
      res.sendStatus(500);
    }
  };
}

export const deleteRecord = (tableName: TableName, doRespond = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const numResults = await database.knex(tableName)
        .del()
        .where('id', req.params.id);
      if (numResults === 0) {
        res.sendStatus(404);
        return;
      }
      if (doRespond) {
        res.sendStatus(204);
      } else {
        next();
      }
    } catch (error) {
      req.logger.error('error while deleting record', {
        tableName,
        error
      });
      const statusCode = (error as { code: string }).code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 500;
      res.sendStatus(statusCode);
    }
  };
}

export const getOneRecord = <T>(tableName: TableName, excludeFields?: (keyof T)[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await database.knex<T>(tableName)
        .where('id', req.params.id)
        .first();
      if (!record) {
        res.sendStatus(404);
        return;
      }

      res.json({
        [singularise(tableName)]: excludeFields ? omit(record as Record<string, unknown>, ['password_hash']) : record
      });
      next();
    } catch (error) {
      req.logger.error('error while getting record', {
        tableName,
        error
      });
      res.sendStatus(500);
    }
  };
};

export const getAllRecords = <T>(tableName: TableName, excludeFields?: (keyof T)[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const records = await database.knex<T>(tableName);
      res.json({
        [tableName]: records.map((record) => excludeFields ? omit(record as Record<string, unknown>, ...excludeFields) : record)
      });
      next();
    } catch (error) {
      req.logger.error('error while getting all records', {
        tableName,
        error
      });
      res.sendStatus(500);
    }
  };
};

export const updateRecord = <T>(tableName: TableName, doRespond = true, transformCallback?: TransformCallback<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawData = req.body[singularise(tableName)];
      const storeData = transformCallback ? await transformCallback(rawData) : rawData;
      const numResults = await database.knex<T>(tableName)
        .where('id', req.params.id)
        .update(storeData);
      if (numResults === 0) {
        res.sendStatus(404);
        return;
      }
      if (doRespond) {
        res.sendStatus(204);
      } else {
        next();
      }
    } catch (error) {
      req.logger.error('error while updating record', {
        tableName,
        error
      });
      res.sendStatus(500);
    }
  };
}
