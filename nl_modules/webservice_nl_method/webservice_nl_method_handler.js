const axios = require('axios');
module.exports = {
    callWebService : async function () {
        try {
            let response = await axios(this.params);
            return response.data;
        } catch (e) {
            return {success: false, error: e.message}
        }
    }
}
