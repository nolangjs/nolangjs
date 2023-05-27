/**
 * salartayefeh Mehdi
 */

function deepEach(obj, callback) {
    for (var key in obj) {
        if( typeof obj[key] === "object" ) {
            deepEach(obj[key], callback);
        }

        callback(key, obj);

    }
};

exports.deepEach = deepEach;
