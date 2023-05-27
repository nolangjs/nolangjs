const schema_loader = require('./schema_loader');
const logger = global.logger;

module.exports = class direct_schema_loader extends schema_loader{

    async loadAll() {
        logger.log('load schema from app config ');
        this.schemasList = this.conf;
        for(let schema of this.schemasList) {
            await this.onLoad(schema, schema.$id, false);
        };

        //todo this.conf.watch
    }

    async loadOne(schemaIndicator) {
        //find schema from schema array using its $id
        let schema = this.schemasList.find(_schema=>_schema.$id===schemaIndicator);
        await this.onLoad(schema, schemaIndicator,false);
    }
}
