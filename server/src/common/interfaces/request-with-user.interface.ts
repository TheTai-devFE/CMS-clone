import { Request } from 'express';
import { CurrentUser } from '../../auth/interfaces/current-user.interface';

export interface RequestWithUser extends Request {
  user: CurrentUser;
}
