function doGet(e) {
  var template;
  tName = "Scout Lake Construction Payroll App";
  
  if (e.parameter.user) {
    template = HtmlService.createTemplateFromFile('html/mainScoutLake');
    template.data = {playerId: e.parameter.user};
    return template
    .evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle("Home page of " + e.parameter.user);
  }
  
  else { //login page
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

function authenticate(email, password) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Login Info");
    var numUsers = sheet.getLastRow();
    if(numUsers == 0) {
      return 0;
    }
        
    password = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_512, password));
    
    var users = sheet.getSheetValues(1, 1, numUsers, 2);
    for(var i = 0; i < users.length; i++) {
        if(users[i][0] == email && users[i][1] == password) {
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

function requestAccount(email, password) {

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Email Whitelist");
  var numEmails = sheet.getLastRow();
  if(numEmails == 0) {
    return 0;
  }
      
  var emails = sheet.getSheetValues(1, 1, numEmails, 1);
  for(var i = 0; i < emails.length; i++) {
    if(email == emails[i][0]) {
      var sheet2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Login Info");
      var numUsers = sheet2.getLastRow();    

      var users;

      if(numUsers > 0) {
        users = sheet2.getSheetValues(1, 1, numUsers, 1);
      }
        
      for(var i = 0; i < numUsers != 0 && users.length; i++) {
          if(users[i][0] == email) {
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

function loadFromSpreadsheet() {
  var workOrderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Work Orders");
  var phaseCodeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Phase Codes");

  var numWorkOrders = workOrderSheet.getLastRow() - 1;
  var numPhaseCodes = phaseCodeSheet.getLastRow() - 1;

  var workOrders;
  var phaseCodes;
  
  workOrders = workOrderSheet.getSheetValues(2, 1, numWorkOrders, 2);
  phaseCodes = phaseCodeSheet.getSheetValues(2, 1, numPhaseCodes, 2);

  return [workOrders, phaseCodes];
}

function populateTimecard(email, data) {
  var date = new Date();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var blankTimecard = ss.getSheetByName("Blank Timecard");
  ss.insertSheet(email + " - " + date.toLocaleString(), {template: blankTimecard});

  var nameCell = ss.getRange('B8');
  nameCell.setValue(data["name"]);

  var classificationCell = ss.getRange('B9');
  classificationCell.setValue(data["classification"]);

  var projectManagerCell = ss.getRange('B10');
  projectManagerCell.setValue(data["projectManager"]);

  var jobNumberCell = ss.getRange('E4');
  jobNumberCell.setValue(data["jobNumber"]);

  var weekEndingCell = ss.getRange('E5');
  weekEndingCell.setValue(data["weekEnding"]);

  var sundayDateCell = ss.getRange('P3');
  sundayDateCell.setValue(data["sunday"]["date"]);
  var saturdayDateCell = ss.getRange('O3');
  saturdayDateCell.setValue(data["saturday"]["date"]);
  var fridayDateCell = ss.getRange('N3');
  fridayDateCell.setValue(data["friday"]["date"]);
  var thursdayDateCell = ss.getRange('M3');
  thursdayDateCell.setValue(data["thursday"]["date"]);
  var wednesdayDateCell = ss.getRange('L3');
  wednesdayDateCell.setValue(data["wednesday"]["date"]);
  var tuesdayDateCell = ss.getRange('K3');
  tuesdayDateCell.setValue(data["tuesday"]["date"]);
  var mondayDateCell = ss.getRange('J3');
  mondayDateCell.setValue(data["monday"]["date"]);

  var mondayStartCell = ss.getRange('B14');
  mondayStartCell.setValue(data["monday"]["start"]);
  var mondayLunchInCell = ss.getRange('C14');
  mondayLunchInCell.setValue(data["monday"]["lunchIn"]);
  var mondayLunchOutCell = ss.getRange('D14');
  mondayLunchOutCell.setValue(data["monday"]["lunchOut"]);
  var mondayStopCell = ss.getRange('E14');
  mondayStopCell.setValue(data["monday"]["stop"]);

}