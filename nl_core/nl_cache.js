const Redis = require("redis");
const logger = global.logger;

class nl_cache {


    constructor(redisConf, onConnect, onError) {
        this.redisClient = Redis.createClient(redisConf);

        this.redisClient.on('error', onError);
        this.redisClient.connect().then(onConnect);
    }

    async inRedis(redisKey, redisTime, method) {
        //let redisTime = 3600;
        let toBeCached = await this.redisClient.get(redisKey);
        this.redisClient.publish()
        if(toBeCached){
            try {
                toBeCached = JSON.parse(toBeCached);
            }catch (e){
                logger.error(e.message);
                logger.error(toBeCached);

            }
            logger.log('found in redis: '+ redisKey)
            // console.log(toBeCached);
        } else {
            toBeCached = await method();
            this.redisClient.set(redisKey, JSON.stringify(toBeCached), {EX: redisTime});
        }
        return toBeCached;
    }
}

module.exports = nl_cache;

/*

var c = new nl_cache(()=>{
    console.log('connected')
}, (err) => console.log('Redis Client Error', err))

c.inRedis('zzz',10, async ()=>{
    return 'hiiii';
}).then((zzz)=>{
    console.log(zzz)
})*/

