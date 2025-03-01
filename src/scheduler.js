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
            const elapsedTime = process.hrtime(lastCheck);
            const elapsedMs = (elapsedTime[0] * 1e9 + elapsedTime[1]) / 1e6;
            const missedExecutions = Math.floor(elapsedMs / 1000);

            for(let i = missedExecutions; i >= 0; i--){
                const date = new Date(now - i * 1000);
                let date_tmp = this.timeMatcher.apply(date);
                date_tmp.setMilliseconds(0);
                if(lastExecution < date_tmp.getTime() && (i === 0 || this.autorecover) && this.timeMatcher.match(date)){
                    lastExecution = date_tmp.getTime();
                    this.emit('scheduled-time-matched', date_tmp);
                }
            }
            lastCheck = process.hrtime();
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
