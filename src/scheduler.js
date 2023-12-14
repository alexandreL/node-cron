'use strict';

const EventEmitter = require('events');
const TimeMatcher = require('./time-matcher');

class Scheduler extends EventEmitter{
    constructor(pattern, timezone, autorecover, name){
        super();
        this.name = name;
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
            console.log('node-cron: now', { now, name: this.name });
            const elapsedTime = process.hrtime(lastCheck);
            console.log('node-cron: elapsedTime', { elapsedTime, name: this.name });
            const elapsedMs = (elapsedTime[0] * 1e9 + elapsedTime[1]) / 1e6;
            const missedExecutions = Math.floor(elapsedMs / 1000);
            console.log('node-cron: missedExecutions', { missedExecutions, name: this.name });

            for(let i = missedExecutions; i >= 0; i--){
                const date = new Date(now - i * 1000);
                let date_tmp = this.timeMatcher.apply(date);
                date_tmp.setMilliseconds(0);
                if(lastExecution < date_tmp.getTime() && (i === 0 || this.autorecover) && this.timeMatcher.match(date)){
                    console.log('node-cron: date_tmp', { date_tmp: date_tmp.getTime(), name: this.name });
                    console.log('node-cron: lastExecution before', { lastExecution, name: this.name });
                    console.log('node-cron: date_tmp > lastExecution', { compare: date_tmp.getTime() > lastExecution, name: this.name });
                    lastExecution = date_tmp.getTime();
                    console.log('node-cron: lastExecution after', { lastExecution, name: this.name });
                    this.emit('scheduled-time-matched', date_tmp);
                    console.log('node-cron: executed', { name: this.name });
                }
            }
            lastCheck = process.hrtime();
            console.log('node-cron: lastCheck', { lastCheck, name: this.name });
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
