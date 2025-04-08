"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScripts = void 0;
const main_cron_job_1 = require("../cron/main-cron-job");
//TODO important:
//  - set the cronJob as an instance so you can declare it as it own module and:
//    - get next job time.
//    - get time until next job.
//  refer to: https://stackoverflow.com/questions/60828411/node-js-get-time-till-next-cron-job
const initScripts = () => {
    //"* * * * *" each minute
    //"0 0 * * *" each 24h at midnight.
    //TODO bellow reset to 24h
    main_cron_job_1.MainCronJob.startJob();
};
exports.initScripts = initScripts;
