module.exports = {
    log : async function() {
        console.log(this.params.message)
    },

    error : async function() {
        console.error(this.params.message)
    }
}
