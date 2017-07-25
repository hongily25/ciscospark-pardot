'use strict';

console.log('Loading function');
const request = require('request');


/* Cisco Spark Client secret: 7605da2b7bf8538768d99e67a9317d9aa08c805a13f13d54d00d6edbafdf8360 */
/* Pardot API Key: bc43de5fbe7057f5ac6846b71d6354f7 */

exports.handler = (event, context, callback) => {
    console.log("event: ", event);



    //console.log('Received event:', JSON.stringify(event, null, 2));
    /*
    console.log('email', event.email);
    console.log('password', event.password);
    console.log('user_key', event.user_key);
    var options = {
        url: 'https://pi.pardot.com/api/login/version/3?format=json',
        headers: {
            'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json'
        },
        body: 'email=' + event.email + ' &password=' + event.password + '&user_key=' + event.user_key
    }
    request.post(options, (error, response, body) => {
        var obj = JSON.parse(body);
        console.log(obj);

        

        callback(null, obj.api_key); // Echo back the first key value
        //callback('Something went wrong');

    });
    */
};
