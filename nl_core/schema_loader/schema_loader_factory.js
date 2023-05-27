const direct_schema_loader = require('./direct_schema_loader');
const file_schema_loader = require('./file_schema_loader');
module.exports = class schema_loader_factory {
    /**
     *
     * @param conf equals to section "schemas" in nlpackage.json
     * @param cb callback for each file
     */
    constructor(conf, cb) {
        //direct schemas
        if (Array.isArray(conf)) {
            return new direct_schema_loader(conf, cb);
        }
        //file schemas
        if (!conf.hasOwnProperty('adapter') || conf.adapter === 'file') {
            return new file_schema_loader(conf, cb);
        }
        //todo db schemas, loads schemas from a database
    }
}
