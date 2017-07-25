console.log('starting function')

const request = require('request');
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1'
});

var development = false;

exports.handle = function (event, ctx, callback) {
  console.log('processing event: %j', event);



  // Webhook from Cisco Spark
  if (event.name == "AWS") {
    console.log('webhook triggered: new message')

    /* Get Cisco Spark Token out of DynamoDB */
    var getCiscoTokenDB = {
      TableName: 'guestbook',
      Key: {
        'email': event.data.personEmail
      }
    }

    /* Process Message from Webhook */
    docClient.get(getCiscoTokenDB, function (err, data) {
      if (err) {
        console.log('error :(');
        console.log(err);
      } else {

        if (typeof data.Item.ciscoToken == undefined) {
          callback(null, 'You need to register your Cisco Spark account.')
        }
        console.log('data.Item.ciscoToken', data.Item.ciscoToken);
        console.log('event.data.id', event.data.id);
        // Is there a Cisco Spark Token?
        console.log('data.Item.ciscoToken', data.Item.ciscoToken);

        /* Get Message Details */
        var GetMessageDetails = {
          url: 'https://api.ciscospark.com/v1/messages/' + event.data.id,
          headers: {
            'Content-type': 'application/json; charset=utf-8',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + data.Item.ciscoToken
          }
        };
        request(GetMessageDetails, (error, response, body) => {
          try {
            console.log('getmessagedetails body: ', body);
            var message = JSON.parse(body);
          } catch (error) {
            console.log('getmessagedetails error:', error);
          }
          console.log('message.text:', message.text);

          // If text matches 'forecast' and pardot user_key is not undefined show forecast
          //&& (data.Item.user_key != undefined) for when there is real pardot info
          if (data.Item.user_key != undefined) {
            console.log('data.Item.api_key: ', data.Item.api_key);
            console.log('data.Item.user_key: ', data.Item.user_key);

            // TODO: Get pardot information 
            var markdownMsg = "";

            // Make Pardot Request to get Opportunites

            var pardotOptions = {
              url: 'https://pi.pardot.com/api/opportunity/version/3/do/query?limit=5&format=json&&sort_by=probability&sort_order=descending&created_after=this_month',
              headers: {
                'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json'
              },
              body: 'api_key=' + data.Item.api_key + ' &user_key=' + data.Item.user_key
            }

            request.post(pardotOptions, (error, response, body) => {
              console.log("pardot body: ", body);

              try {
                var pardot = JSON.parse(body);
              } catch (e) {
                console.log('pardot body catch: ', body);
                console.log("error:", e)
              }
              console.log('body.err pardot: ', pardot.err);

              switch (message.text) {
                case "yay!":
                  {
                    // Get ready to send message Cisco Spark
                    var sendImg = {
                      url: 'https://api.ciscospark.com/v1/messages',
                      headers: {
                        'Content-type': 'application/json; charset=utf-8',
                        'Accept': 'application/json',
                        'Authorization': 'Bearer ' + data.Item.ciscoToken
                      },
                      body: JSON.stringify({
                        "roomId": message.roomId,
                        "files": [
                          "https://emilytlam.com/smiley-face.png"
                        ]
                      })
                    }

                    // Send message to Cisco Spark room
                    request.post(sendImg, (error, response, body) => {
                      console.log('status: ', response.statusCode);
                      console.log('status: ', response.statusMessage);
                      callback(null, message.text);
                    })
                    break;
                  }
                case "tell me about my opportunities":
                case "Tell me about my opportunities":
                case "/opportunities":
                  {
                    if (development == true) {
                      var stringLabel = "2017 IBM Contract,Dimension Data North America,Verizon Services - Expansion,Red River Co. Renewal,Pivot Technology Solutions";
                      var stringValue = "30580,17506,5900,43000,50780"
                      markdownMsg = "There are **17** results. Your top 5 opportunities are: <ul><li>**2017 IBM Contract**<br>Value: **$30,580**. Probability: **60%**</li><li>**Dimension Data North America**<br>Value: **$17,506**. Probability: **75%** </li><li>**Verizon Services - Expansion**<br>Value: **$5,900**. Probability: **30%**</li><li>**Red River Co. Renewal**<br>Value: **$43,000** Probability: **20%**  </li><li>**Pivot Technology Solutions**<br>Value: **$50,780** Probability: **25%**  </li></ul><br>" + "<a href='https://emilytlam.com/chart.html?labels=" + encodeURI(stringLabel) + "&values=" + encodeURI(stringValue) + "' target='blank'>View the infographic</a> ";
                    } else if (pardot.result.total_results == undefined) {
                      markdownMsg = "Please sign in to the <a href='https://emilytlam.com/pardot.html'>Salazar application</a> with your Cisco Spark account and Pardot credentials."
                    } else {
                      console.log("total_results is undefined")
                      var results = 0;
                      var results = pardot.result.total_results;
                      var opp = pardot.result;
                      var stringLabel = "";
                      var stringValue = "";
                      for (let i = 0; i < opp.opportunity.length; i++) {
                        if (i == 4) {
                          stringLabel += opp.opportunity[i].name;
                          stringValue += opp.opportunity[i].value
                        } else
                          stringLabel += opp.opportunity[i].name + ",";
                        stringValue += opp.opportunity[i].value + ",";
                      }
                      var labelString = "";
                      console.log('results: ', results);

                      var liBody = "";

                      for (let i = 0; i < opp.opportunity.length; i++) {
                        liBody += "<li>**" + opp.opportunity[i].name + "**<br>" + "Value: **$" + opp.opportunity[i].value.toLocaleString() + "**. Probability: **" + opp.opportunity[i].probability + "%**</li>"
                      }

                      markdownMsg = "There are **" + results + "** results. Your top 5 opportunities are: <ol>" + liBody + "</ol>" + "<a href='https://emilytlam.com/chart.html?labels=" + encodeURI(stringLabel) + "&values=" + encodeURI(stringValue) + "' target='blank'>View the infographic</a> ";
                    }
                    break;
                  }
                case "what's my forecast?":
                case "What's my forecast?":
                case "what's my forecast this month?":
                case "What's my forecast this month?":
                case "/forecast":
                  { // For testing
                    if (development == true) {
                      markdownMsg = "There are **7** open leads this month. The total value is **$265,500**.";
                    } else if (pardot.result == undefined) { // No Pardot result
                      markdownMsg = "Please sign in sign to the <a href='https://emilytlam.com/pardot.html'>Salazar application</a> with your Cisco Spark account and Pardot credentials."
                    } else { // Pardot has results
                      var leads = pardot.result.total_results;
                      var sum = 0;
                      for (let i = 0; i < pardot.result.opportunity.length; i++) {
                        sum += pardot.result.opportunity[i].value;
                      }
                      markdownMsg = "There are **" + leads + "** open leads this month. The total value is **$" + sum.toLocaleString() + "**.";
                    }

                  }
                default: // Don't send any message
                  callback(null, "Silence is golden.");
              }



              console.log('trigger forecast');
              console.log('cisco token inside sendmsg: ', data.Item.ciscoToken);
              console.log('roomID', message.roomId);
              console.log('markdownMsg', markdownMsg);

              // Get ready to send message Cisco Spark
              var sendMsg = {
                url: 'https://api.ciscospark.com/v1/messages',
                headers: {
                  'Content-type': 'application/json; charset=utf-8',
                  'Accept': 'application/json',
                  'Authorization': 'Bearer ' + data.Item.ciscoToken
                },
                body: JSON.stringify({
                  "roomId": message.roomId,
                  "markdown": markdownMsg
                })
              }

              // Send message to Cisco Spark room
              request.post(sendMsg, (error, response, body) => {
                console.log('status: ', response.statusCode);
                console.log('status: ', response.statusMessage);
                callback(null, message.text);
              })
            });

          } else {
            callback(null, "Pardot userkey is undefined")
          }
        })
      }
    })

  } else {
    // Pardot registration or Cisco Spark Registration

    console.log('email', event.email);
    console.log('password', event.password);
    console.log('user_key', event.user_key);
    console.log('ciscoToken', event.ciscoToken);


    /* Store information in DynamoDB */
    if ((event.email != undefined) && (event.user_key != undefined) && (event.password != undefined) && (event.ciscoToken != undefined)) {
      /* Get Pardot */
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

        /* Store Pardot email, user key, api key, and cisco token in database */
        var params = {
          Item: {
            email: event.email,
            user_key: event.user_key,
            api_key: obj.api_key,
            ciscoToken: event.ciscoToken
          },
          TableName: 'guestbook'
        };
        docClient.put(params, function (err, data) {
          if (err) {
            callback(err, null)
          } else {
            callback(null, data);
          }
        });
      });
    }
  }

}
