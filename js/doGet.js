function doGet(e) {
  var template;
  tName = "Scout Lake Construction Payroll App";

  if (e.parameter.user) {
    template = HtmlService.createTemplateFromFile('html/mainScoutLake');
    template.data = { playerId: e.parameter.user };
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
  if (numUsers == 0) {
    return 0;
  }

  password = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_512, password));

  var users = sheet.getSheetValues(1, 1, numUsers, 2);
  for (var i = 0; i < users.length; i++) {
    if (users[i][0] == email && users[i][1] == password) {
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
  var emailIsAttachedToEmployee = entryExistsInSheet(email, "Employees");
  var emailIsUnique = !entryExistsInSheet(email, "Login Info");

  if (emailIsAttachedToEmployee && emailIsUnique) {
    // Add account with password
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Login Info").appendRow([email, Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_512, password))]);
    return 1;
  }

  return 0;
}

function entryExistsInSheet(entry, sheet) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheet);
  var numEntries = sheet.getLastRow();

  console.log("Made it past numEntries");

  if (numEntries == 0) {
    return false;
  }

  var entries = sheet.getSheetValues(1, 1, numEntries, 1);

  for (var i = 0; i < numEntries; i++) {
    if (entries[i][0] == entry) {
      return true;
    }
  }

  return false;
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
  ss.insertSheet(email + " - " + date.toLocaleString(), { template: blankTimecard });

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

  // var dateSignedCell = ss.getRange('B40');
  // dateSignedCell.setValue($("#signatureDate").val());

  fillDayInOutCells("monday", data, ["B14", "E14", "C14", "D14"], ss);
  fillDayInOutCells("tuesday", data, ["B16", "E16", "C16", "D16"], ss);
  fillDayInOutCells("wednesday", data, ["B18", "E18", "C18", "D18"], ss);
  fillDayInOutCells("thursday", data, ["B20", "E20", "C20", "D20"], ss);
  fillDayInOutCells("friday", data, ["B22", "E22", "C22", "D22"], ss);
  fillDayInOutCells("saturday", data, ["B24", "E24", "C24", "D24"], ss);
  fillDayInOutCells("sunday", data, ["B26", "E26", "C26", "D26"], ss);

  var fileName = ss.getName() + " (COPY)";
  var newSheet = ss.copy(fileName);

  // Test sending email.
  MailApp.sendEmail({
    to: "jaredlee.dev@gmail.com",
    subject: "Timecard for " + data["name"],
    body: "Attached is a copy of a timecard for " + data["name"] + ", week ending on " + data["weekEnding"] + " on job " + data["jobNumber"] + ". This is an automatic message, please do not reply.",
    attachments: [newSheet.getBlob().setName(fileName)]
  });

}

// Given day string, timecard data object, active spread sheet reference,
// and an array of cell ranges for daily start, stop, lunchIn, and lunchOut,
// populate the spread sheet daily in and out times.
function fillDayInOutCells(day, data, ranges, spreadSheet) {
  spreadSheet.getRange(ranges[0]).setValue(data[day]["start"]);
  spreadSheet.getRange(ranges[1]).setValue(data[day]["stop"]);
  spreadSheet.getRange(ranges[2]).setValue(data[day]["lunchIn"]);
  spreadSheet.getRange(ranges[3]).setValue(data[day]["lunchOut"]);
}