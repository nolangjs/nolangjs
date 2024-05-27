//cron
const cron = require('node-cron');

const jsonLogic = require("json-logic-js");

class nl_rule_runner {

    static runSchedulesOf(schema){
        let rules = schema.$$rules?.filter(rule => rule.schedule && rule.script );
        if(!rules) return;

        for (let rule of rules) {
            let thes = this;
            logger.trace({schedule:rule.schedule, ruleId:rule.ruleId, schema:schema.$id})
            cron.schedule(rule.schedule, () => {
                //runRule.bind(thes)(rule);
                this.runPacket(this.handlePacket({...rule.script}, rule.script)).then();//todo handlePacket data
            }, {
                timezone: rule.timezone
            })
        }
    }

    /**
     *
     * @param schema
     * @param on can be before or after
     * @param action C R U D ...
     */
    static async runOnAction(schema, on, action, packet, env) {
        let rules = schema.$$rules?.filter(rule => (rule[on] === action) || (Array.isArray(rule[on]) && rule[on].indexOf(action)>-1) );
        if(!rules || rules.size ===0) return;

        for (let rule of rules) {
            let thes = this;

            if(rule.hasOwnProperty('condition')) {
                if(rule.condition === false)
                    continue;
                let _condition = this.handlePacket({...rule.condition}, {script:packet, env: env});
                _condition = jsonLogic.apply(_condition, packet);
                if(!_condition)
                    continue;
            }

            if(rule.set) {
                let _set = this.handlePacket({...rule.set}, {script:packet, env: env});
                for(let key in _set){
                    packet[key] = _set[key];
                }
            }

            if(rule.script) {
                logger.trace({run: rule.script, ruleId:rule.ruleId, schema:schema.$id});
                this.runPacket(this.handlePacket({...rule.script}, {script:packet, env: env})).then(//todo handlePacket data
                    //todo
                );
            }

            if(rule.check) {
                let _check = this.handlePacket({...rule.check}, {script:packet, env: env});
                _check = jsonLogic.apply(_check, packet);
                if(!_check)
                    return {
                        success: false,
                        error: rule.message || `rule ${rule.ruleId} not passed`
                    };
            }
        }
    }
}




module.exports = nl_rule_runner;
