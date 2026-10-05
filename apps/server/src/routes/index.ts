import { Router } from "express";
import profilesRouter from "./profiles";
import leaderboardRouter from "./leaderboard";
import historyRouter from "./history";
import friendsRouter from "./friends";
import notificationsRouter from "./notifications";
import achievementsRouter from "./achievements";
import searchRouter from "./search";
import adminRouter from "./admin";

const apiRouter = Router();

apiRouter.use("/profiles", profilesRouter);
apiRouter.use("/leaderboard", leaderboardRouter);
apiRouter.use("/history", historyRouter);
apiRouter.use("/friends", friendsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/achievements", achievementsRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/admin", adminRouter);

export default apiRouter;
