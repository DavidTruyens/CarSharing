// TODO
// calculate the total amount to be transfered
// change the mail message
// 


const debug = false;
const testadress = "test.test@gmail.com";

const userSheetName = "Gebruikers";
const tripSheetName = "Formulier gegevens"

const timestampColumn = 0;
const emailColumn = 1;
const distanceColumn = 2;
const fuelCheckColumn = 3;
const fuelCostColumn = 4;
const distanceCostColumn = 5
const pricePerKmColumn = 6;
const totalColumn = 7;
const sentColumn = 8;
const paidColumn = 9;

const bankaccount = "BEXX XXXX XXXX XXXX"
const accountname ="Xxxxxxx Xxxxxx"

class Trip {
  constructor(email = "test@example.com", amount = 0, km = 0, fuel = 0, costs = 0, total = 0) {
    this.date = new Date();
    if (this.validateEmail(email)) {
      this.email = email;
    } else {
      throw new Error("Invalid email address");
    }
    this.amount = amount;
    this.km = km;
    this.fuelPaiment = fuel;
    this.distanceCosts = costs;
    this.totalCosts = total;
    this.sent = false;
    this.paid = false;
    this.lineNr = 0;
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}

class User {
  constructor(firstName, lastName, email) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
  }

  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  toString() {
    return `User(${this.firstName}, ${this.lastName}, ${this.email}, ${this.birthDate})`;
  }
}

function sendMonthlyPaymentRequest() {
  // load all trips
  let doc = SpreadsheetApp.getActiveSpreadsheet();
  let totalSheet = doc.getSheetByName(tripSheetName);
  let data = totalSheet.getSheetValues(2, 1, -1, -1);

  let trips = [];

  for (let i = 0; i < data.length; i++) {

    let dateString = formatDate(data[i][timestampColumn]);

    const trip = new Trip;
    trip.date = dateString;
    trip.email = data[i][emailColumn];
    trip.km = roundToX(data[i][distanceColumn], 0);
    trip.fuelPaiment = roundToX(data[i][fuelCostColumn], 2);
    trip.distanceCosts = roundToX(data[i][distanceCostColumn], 2);
    trip.totalCosts = roundToX(data[i][totalColumn], 2);
    trip.sent = data[i][sentColumn];
    trip.paid = data[i][paidColumn];
    trip.lineNr = i;

    trips.push(trip);
  }

  // load all users
  let usersheet = doc.getSheetByName(userSheetName);
  let userdata = usersheet.getSheetValues(2, 1, -1, -1);

  let users = [];

  for (let j = 0; j < userdata.length; j++) {
    const user = new User();
    user.firstName = userdata[j][0];
    user.lastName = userdata[j][1];
    user.email = userdata[j][2];
    users.push(user);
  }

  // collect unpaid trips for each user
  for (let i = 0; i < users.length; i++) {
    let userUnpaidTrips = [];
    let tripTotal = 0;

    for (let j = 0; j < trips.length; j++) {
      if (users[i].email === trips[j].email && trips[j].sent != true) {
        userUnpaidTrips.push(trips[j]);
        tripTotal += Number(trips[j].totalCosts);
      }
    }

    if (userUnpaidTrips.length > 0) {
      sendEmail(users[i], userUnpaidTrips, tripTotal);
      trips = setAsSent(trips, userUnpaidTrips);
    }
  }

  // check if all trips have been sent
  let unsentCounter = 0;
  for (let i = 0; i < trips.length; i++) {
    if (trips[i].sent != true) {
      unsentCounter++;
    }
  }

  if (unsentCounter != 0) {
    MailApp.sendEmail({
      to: testadress,
      subject: "unsent trips",
      body: unsentCounter + " have not been able to be processed"
    })
  }
}

// body: "Hallo x \nJe hebt deze maand x kilometer gereden. Je zit nu op een tarief van y euro/km, dus dat maakt " + request.amount + " euro.\nJe hebt ook voor xeuro getankt, dus gelieve nog x over te schrijven op rekeningnummer BE2343463453.\nGroeten en tot volgende maand!\n David"

function sendEmail(user, trips, totalCost) {

  if (debug === true) {
    user.email = testadress;
  }

  let summarySentence = "";
  let paybackMail = false;

  if (totalCost < 0) {
    paybackMail = true;
  }

  const temp = HtmlService.createTemplateFromFile('Mailtemplate');
  temp.user = user;
  temp.data = trips;
  temp.total = roundToX(totalCost, 2);
  temp.bankaccount = bankaccount;
  temp.accountname = accountname;
  temp.summary = summarySentence;
  temp.payback = paybackMail

  const message = temp.evaluate().getContent();

  MailApp.sendEmail({
    to: user.email,
    bcc: "david@toolsquare.io",
    subject: 'Tester',
    htmlBody: message
  });

  if (paybackMail) {
    MailApp.sendEmail({
      to: testadress,
      subject: 'payback',
      htmlBody: "Hey, " + user.getFullName() + ' heeft meer <b>kosten</b> gemaakt dan gereden. Gelieve ' + temp.total + '€ terug te storten op rekeningnummer: BExxxxx'
    })
  }
}

function setAsSent(trips, userUnpaidTrips) {
  let doc = SpreadsheetApp.getActiveSpreadsheet();
  let totalSheet = doc.getSheetByName(tripSheetName);
  let sentCheck = totalSheet.getSheetValues(2, sentColumn + 1, -1, 1);

  for (let i = 0; i < userUnpaidTrips.length; i++) {
    let lineNumber = userUnpaidTrips[i].lineNr;
    sentCheck[lineNumber][0] = true;
    trips[lineNumber].sent = true;
  }

  totalSheet.getRange(2, sentColumn + 1, sentCheck.length, 1).setValues(sentCheck);
  return trips;
}

function createSepaQR() {
  const bic = "YOURBIC"; // Replace with actual BIC
  const name = "Recipient Name";
  const iban = bankaccount; // Replace with actual IBAN
  const amount = "EUR100.00";
  const purpose = "GDDS";
  const remittanceInfo = "Invoice 1234";

  // Construct the SEPA QR data string
  const sepaData = `BCD\n001\n1\nSCT\n${bic}\n${name}\n${iban}\n${amount}\n${purpose}\n${remittanceInfo}`;

}

function formatDate(date) {
  let dateObject = new Date(date);
  const padToTwoDigits = (dateObject) => dateObject.toString().padStart(2, '0');

  const dformat = [
    padToTwoDigits(dateObject.getDate()),
    padToTwoDigits(dateObject.getMonth() + 1),
    dateObject.getFullYear().toString().slice(-2)
  ].join('/')
  // + ' ' +
  //   [
  //     padToTwoDigits(dateObject.getHours()),
  //     padToTwoDigits(dateObject.getMinutes()),
  //     padToTwoDigits(dateObject.getSeconds())
  //   ].join(':');

  return dformat;
}

function roundToX(value, decimals) {
  let number = Number(value);
  let rounded = 0;
  if (number != null) {
    rounded = number.toFixed(decimals);
  }
  return rounded
}


