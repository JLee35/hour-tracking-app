//********************************************************************************
//DOGET.GS
//*********************************************************************************
//This file contains the doGet() function, which serves up the app, 
//responding to get requests with query strings as appropriate to dish out
//new pages.
//*********************************************************************************
/****************************************************************
   PROGRAM:   CptS 489 Project
   AUTHOR:    Nathaniel Fox
   DUE DATE:  4/2/19

   NOTES:     This program is a payroll app for Scout Lake Construction
****************************************************************/


function doGet(e) {
  var template;
  tName = "Scout Lake Construction Payroll App";
  if (e.parameter.user) { //user page
    template = HtmlService.createTemplateFromFile('html/mainScoutLake');
    template.data = {playerId: e.parameter.user};
    return template
    .evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle("Home page of " + e.parameter.user);
  } if (e.parameter.page) { //show leaderboard under constructino page
    return HtmlService.createHtmlOutputFromFile('html/LeaderboardUnderConstruction')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setTitle("SpeedScore LIVE Leaderboard");
  } else { //login page
    template = HtmlService.createTemplateFromFile('html/loginScoutLake');
    return template
    .evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle("SLC Payroll App");
  }
}
  
 //include: Allows us to include files using templated HTML, per Google's best practices 
//(https://developers.google.com/apps-script/guides/html/best-practices)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}     

/****************************************************************

FUNCTION:   authenticate()

ARGUMENTS:  email and password

RETURNS:    1 if correct email and password, 0 otherwise

NOTES:      Authenticates inputed email and password.

****************************************************************/

function authenticate(email, password)
{
    // How to get by sheet name: https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet#getSheetByName(String)
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Login Info");
    var numUsers = sheet.getLastRow();
    if(numUsers == 0)
        return 0;

    password = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_512, password));
    
    var users = sheet.getSheetValues(1, 1, numUsers, 2);
    for(var i = 0; i < users.length; i++)
    {
        if(users[i][0] == email && users[i][1] == password)
        {
            return 1;
        }
    }
    return 0;
}

/****************************************************************

FUNCTION:   requestAccount()

ARGUMENTS:  email, password

RETURNS:    1 if added account, 0 otherwise

NOTES:      Creates or rejects account info

****************************************************************/

function requestAccount(email, password)
{

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Email Whitelist");
  var numEmails = sheet.getLastRow();
  if(numEmails == 0)
      return 0;
  
  var emails = sheet.getSheetValues(1, 1, numEmails, 1);
  for(var i = 0; i < emails.length; i++)
  {
    if(email == emails[i][0])
    {
      var sheet2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Login Info");
      var numUsers = sheet2.getLastRow();    


      var users;

      if(numUsers > 0)
        users = sheet2.getSheetValues(1, 1, numUsers, 1);

      for(var i = 0; i < numUsers != 0 && users.length; i++)
      {
          if(users[i][0] == email)
          {
            console.log("Returning zero because email already used!");
            return 0;
          }
      }
      
      // instructions on how to digest with Utilities: https://developers.google.com/apps-script/reference/utilities/utilities#base64encodedata
      // said to use base64Encode() : https://stackoverflow.com/questions/54341187/how-to-compute-sha-1-of-a-big-file-50mb-in-google-apps-script 
      sheet2.appendRow([email, Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_512, password))]);
      return 1;
    }
  }
  return 0;

}

/****************************************************************

FUNCTION:   loadFromSpreadsheet()

ARGUMENTS:  None

RETURNS:    list of Work Orders and Phase Codes

NOTES:      Gets work order and phase codes from spreadsheet

****************************************************************/

function loadFromSpreadsheet()
{
    var workOrderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Work Orders");
    var phaseCodeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Phase Codes");

    var numWorkOrders = workOrderSheet.getLastRow() - 1;
    var numPhaseCodes = phaseCodeSheet.getLastRow() - 1;

    var workOrders;
    var phaseCodes;
    
    workOrders = workOrderSheet.getSheetValues(2, 1, numWorkOrders, 2);
    phaseCodes = phaseCodeSheet.getSheetValues(2, 1, numPhaseCodes, 2);

    console.log(workOrders);

    console.log(phaseCodes);
    
    // idea to return two values in list from: https://stackoverflow.com/questions/2917175/return-multiple-values-in-javascript
    return [workOrders, phaseCodes];
}

/****************************************************************

FUNCTION:   submitEmployeeInfo()

ARGUMENTS:  None

RETURNS:    None

NOTES:      Inputs employee info to the spreadsheet

****************************************************************/

function submitEmployeeInfo(email, allEmployeeInfo)
{
  var date = new Date();
  console.log(allEmployeeInfo);
    SpreadsheetApp.getActiveSpreadsheet().insertSheet(email + " - " + date.toLocaleString());
    var infoSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(email + " - " + date.toLocaleString());

    for(var i = 0; i < allEmployeeInfo.length; i++)
    {
      // making room in the first two columns
      infoSheet.autoResizeColumn(1);
      infoSheet.autoResizeColumn(2);


      infoSheet.appendRow(["Employee Name:", allEmployeeInfo[i][0]]);

      if(i > 0) // so that we don't add spaces at the very beginning
      {
        // for spacing between sheets. Can only add blank row between rows, not appended at the end
        // Help from: https://stackoverflow.com/questions/34689556/how-do-i-append-a-blank-row-in-a-google-spreadsheet-with-apps-script
        infoSheet.insertRows(infoSheet.getLastRow(), 1);
        infoSheet.insertRows(infoSheet.getLastRow(), 1);
      }

      infoSheet.appendRow(["Job Number:", allEmployeeInfo[i][1]]);
      infoSheet.appendRow(["Week Ending:", allEmployeeInfo[i][2]]);
      infoSheet.appendRow(["", "Start Time", "Lunch In", "Lunch Out", "Time Off"]);
      infoSheet.insertRows(infoSheet.getLastRow(), 1);
      infoSheet.appendRow(["Monday", allEmployeeInfo[i][3][0][0][0], allEmployeeInfo[i][3][0][1][0], allEmployeeInfo[i][3][0][2][0], allEmployeeInfo[i][3][0][3][0]]);
      infoSheet.appendRow(["Tuesday", allEmployeeInfo[i][3][1][0][0], allEmployeeInfo[i][3][1][1][0], allEmployeeInfo[i][3][1][2][0], allEmployeeInfo[i][3][1][3][0]]);
      infoSheet.appendRow(["Wednesday", allEmployeeInfo[i][3][2][0][0], allEmployeeInfo[i][3][2][1][0], allEmployeeInfo[i][3][2][2][0], allEmployeeInfo[i][3][2][3][0]]);
      infoSheet.appendRow(["Thursday", allEmployeeInfo[i][3][3][0][0], allEmployeeInfo[i][3][3][1][0], allEmployeeInfo[i][3][3][2][0], allEmployeeInfo[i][3][3][3][0]]);
      infoSheet.appendRow(["Friday", allEmployeeInfo[i][3][4][0][0], allEmployeeInfo[i][3][4][1][0], allEmployeeInfo[i][3][4][2][0], allEmployeeInfo[i][3][4][3][0]]);
      infoSheet.appendRow(["Saturday", allEmployeeInfo[i][3][5][0][0], allEmployeeInfo[i][3][5][1][0], allEmployeeInfo[i][3][5][2][0], allEmployeeInfo[i][3][5][3][0]]);
      infoSheet.appendRow(["Sunday", allEmployeeInfo[i][3][6][0][0], allEmployeeInfo[i][3][6][1][0], allEmployeeInfo[i][3][6][2][0], allEmployeeInfo[i][3][6][3][0]]);
      infoSheet.appendRow(["Labor Hours:"]);
      infoSheet.insertRows(infoSheet.getLastRow(), 1);
      infoSheet.appendRow(["Code", "Description", "Hours"]);
      infoSheet.appendRow(["Monday:"]);
      for(var j = 0; j < allEmployeeInfo[i][6][0].length; j++)
      {
        infoSheet.appendRow([allEmployeeInfo[i][6][0][j][0], allEmployeeInfo[i][6][0][j][1]])
      }
      infoSheet.appendRow(["Tuesday:"]);
      for(var j = 0; j < allEmployeeInfo[i][6][1].length; j++)
      {
        infoSheet.appendRow([allEmployeeInfo[i][6][1][j][0], allEmployeeInfo[i][6][1][j][1]])
      }
      infoSheet.appendRow(["Wednesday:"]);
      for(var j = 0; j < allEmployeeInfo[i][6][2].length; j++)
      {
        infoSheet.appendRow([allEmployeeInfo[i][6][2][j][0], allEmployeeInfo[i][6][2][j][1]])
      }
      infoSheet.appendRow(["Thursday:"]);
      for(var j = 0; j < allEmployeeInfo[i][6][3].length; j++)
      {
        infoSheet.appendRow([allEmployeeInfo[i][6][3][j][0], allEmployeeInfo[i][6][3][j][1]])
      }
      infoSheet.appendRow(["Friday:"]);
      for(var j = 0; j < allEmployeeInfo[i][6][4].length; j++)
      {
        infoSheet.appendRow([allEmployeeInfo[i][6][4][j][0], allEmployeeInfo[i][6][4][j][1]])
      }
      infoSheet.appendRow(["Saturday:"]);
      for(var j = 0; j < allEmployeeInfo[i][6][5].length; j++)
      {
        infoSheet.appendRow([allEmployeeInfo[i][6][5][j][0], allEmployeeInfo[i][6][5][j][1]])
      }
      infoSheet.appendRow(["Sunday:"]);
      for(var j = 0; j < allEmployeeInfo[i][6][6].length; j++)
      {
        infoSheet.appendRow([allEmployeeInfo[i][6][6][j][0], allEmployeeInfo[i][6][6][j][1]])
      }

      infoSheet.appendRow(["Signature:", "", "", "", "", allEmployeeInfo[i][4]]);
      infoSheet.insertRows(infoSheet.getLastRow(), 1);
      infoSheet.appendRow(["Date:"]);
      infoSheet.appendRow([allEmployeeInfo[i][5]]);
    }
    
}