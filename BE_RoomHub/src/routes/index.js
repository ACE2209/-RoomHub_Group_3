import {
  authMiddleware,
  ownerMiddleware,
  adminMiddleware,
  staffMiddleware,
} from '../middlewares/index.js';
import { commonRouter } from './commonRouter.js';
import { authRouter } from './authRouter.js';
// import { ownerRouter } from './ownerRouter.js';
import { adminRouter } from './adminRouter.js';
// import { staffRouter } from './staffRouter.js';

function routes(app) {
  app.use('/', commonRouter);
  app.use('/auth', authMiddleware, authRouter);
  // app.use('/staff', staffMiddleware, staffRouter);
  // app.use('/owner', ownerMiddleware, ownerRouter);
  app.use('/dashboard', adminMiddleware, adminRouter);
}

export default routes;
