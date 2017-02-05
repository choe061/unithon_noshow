/**
 * Created by choi on 2017-02-04.
 */
var mysql = require('mysql');

exports.dbConnect = function() {
    return connection = mysql.createConnection({
        host: '',
        user: '',
        password: '',
        database: ''
    });
};
