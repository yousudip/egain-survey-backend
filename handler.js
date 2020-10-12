'use strict';
//Using crypto to generate random ID
var crypto = require("crypto");
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'ap-south-1'});

  //Lambda function to get all surveys from DynamoDB table
  module.exports.getSurveys = async event => {

    //Declare response object
    var response = {}

    //Create params to scan table
    //Scanning the whole table to fetch all the records at once
    //NOTE: Not recomended for production!!

    //Param object for scan operation
    var params = {
      TableName: 'survey_table'
    };

    try{
      var data = await scanData(params);
      var surveys = [];
      //Create JSON array from the scan result
      data.Items.forEach(function(element, index, array){
        surveys.push({
          "sid" : element.survey_id.S,
          "timestamp" : element.timestamp.S,
          "sname" : element.sname.S,
          "edate" : element.edate.S,
          "surl" : element.surl.S,
          "semail" : element.semail.S,
          "trigger" : element.trigger.S,
          "accessibility" : element.accessibility.S
        });
      });

      //Send success response
      response = {
        statusCode: 200,
        body: 
          {
            message: 'Successfully fetched data from table!',
            input: event,
            result: surveys
          }
      };
      return response;
    }
    catch(err){
      //Send error response
      console.log("Error: ",err)
      response = {
        statusCode: 500,
        body: 
          {
            message: 'Error fetching record: '+err.toString(),
            input: event,
          }
      };
      return response;
    }
};

module.exports.postSurveys = async event => {

  var response = {};
  //Create params to insert input data into table
  var params = {
    TableName: 'survey_table',
    Item: {
      'survey_id' : {S: crypto.randomBytes(6).toString('hex')},
      'timestamp' : {S: Date.now().toString()},
      'sname' : {S: event.body.sname},
      'accessibility' : {S: event.body.accessibility},
      'edate' : {S: event.body.edate},
      'semail' : {S: event.body.semail},
      'surl' : {S: event.body.surl},
      'trigger' : {S: event.body.trigger}
    }
  };

  // Call DynamoDB to add the item to the table
  try{
    var res = await insertData(params)
    //Send success response
    response = {
      statusCode: 200,
      body: 
        {
          message: 'Successfully inserted into table!',
          input: event,
        }
    };
    return response;
  }
  catch(err){
    //Send error response
    console.log("Error: ",err)
    response = {
      statusCode: 500,
      body: 
        {
          message: 'Error inserting record: '+err.toString(),
          input: event,
        }
    };
    return response;
  }
  
};

//Create async wrapper function to make an await-ed call from lambda function
const scanData = async(params)=>{
  // Create the DynamoDB service object
  var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
  return await new Promise( (resolve, reject) => {
    ddb.scan(params, function(err, data){
      if(err)
        reject(err)
      if(data)
        resolve(data)
    });
  });
}

//Create async wrapper function to make an await-ed call from lambda function
const insertData = async(params)=>{
  // Create the DynamoDB service object
  var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
  return await new Promise( (resolve, reject) => {
    ddb.putItem(params, function(err, data){
      if(err)
        reject(err)
      if(data)
        resolve(data)
    });
  });
}