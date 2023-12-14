'use strict';

const EventEmitter = require('events');
const TimeMatcher = require('./time-matcher');

class Scheduler extends EventEmitter{
    constructor(pattern, timezone, autorecover){
        super();
        this.timeMatcher = new TimeMatcher(pattern, timezone);
        this.autorecover = autorecover;
    }

    start(){
        // clear timeout if exists
        this.stop();

        let lastCheck = process.hrtime();
        let lastExecution = this.timeMatcher.apply(new Date()).getTime();

        const matchTime = () => {
            const delay = 1000;
            const now = new Date().getTime();
            console.log('node-cron: now', now);
            const elapsedTime = process.hrtime(lastCheck);
            console.log('node-cron: elapsedTime', elapsedTime);
            const elapsedMs = (elapsedTime[0] * 1e9 + elapsedTime[1]) / 1e6;
            const missedExecutions = Math.floor(elapsedMs / 1000);
            console.log('node-cron: missedExecutions', missedExecutions);

            for(let i = missedExecutions; i >= 0; i--){
                const date = new Date(now - i * 1000);
                let date_tmp = this.timeMatcher.apply(date);
                date_tmp.setMilliseconds(0);
                if(lastExecution < date_tmp.getTime() && (i === 0 || this.autorecover) && this.timeMatcher.match(date)){
                    console.log('node-cron: date_tmp', date_tmp.getTime());
                    console.log('node-cron: lastExecution before', lastExecution);
                    console.log('node-cron: date_tmp > lastExecution', date_tmp.getTime() > lastExecution);
                    lastExecution = date_tmp.getTime();
                    console.log('node-cron: lastExecution after', lastExecution);
                    this.emit('scheduled-time-matched', date_tmp);
                    console.log('node-cron: executed');
                }
            }
            lastCheck = process.hrtime();
            console.log('node-cron: lastCheck', lastCheck);
            this.timeout = setTimeout(matchTime, delay);
        };
        matchTime();
    }

    stop(){
        if(this.timeout){
            clearTimeout(this.timeout);
        }
        this.timeout = null;
    }
}

module.exports = Scheduler;
