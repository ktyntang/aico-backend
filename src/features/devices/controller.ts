import { Request, Response, NextFunction } from 'express';
import { DeviceService } from './service';

export class DeviceController {
  constructor(private service: DeviceService) {}

  create = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const device = this.service.create(req.body);
      res.status(201).json(device);
    } catch (err) {
      next(err);
    }
  };

  findAll = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(this.service.findAll());
    } catch (err) {
      next(err);
    }
  };

  findById = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(this.service.findById(req.params.id));
    } catch (err) {
      next(err);
    }
  };

  update = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(this.service.update(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  };

  delete = (req: Request, res: Response, next: NextFunction): void => {
    try {
      this.service.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
