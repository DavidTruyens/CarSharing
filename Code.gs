//https://github.com/lsvekis/Google-Apps-Script/tree/main/Apps%20Script%20Emailer

class PaymentRequest {
  constructor(email, amount) {
    this.email = "";
    this.amount = 0;
  }
}

function SendMonthlyPaymentRequest() {
  let doc = SpreadsheetApp.getActiveSpreadsheet();
  let totalSheet = doc.getSheetByName("Totalen");
  let lastcolumn = totalSheet.getLastColumn();
  let lastrow = totalSheet.getLastRow();
  let data = totalSheet.getSheetValues(1, 1, lastrow, lastcolumn);

  let activeColumnNr = getActiveColumn(data);
  let date = new Date();
  let month = date.getMonth();

  for (let i = 1; i < data.length; i++) {
    const email = data[i][0];
    const amount = data[i][activeColumnNr];
    const request = { email: email, amount: amount, month: getMonthName(month) };
    sendEmail(request);
  }
}

function getActiveColumn(data) {
  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let activeHeader = year + "," + month;

  for (let i = 0; i < data[0].length; i++) {
    if (data[0][i] === activeHeader) {
      return i;
    }
  }
  return 0;
}

function sendTestMail() {
  const email = "david.truyens+test@gmail.com";
  const amount = 42;
  let date = new Date();
  let month = date.getMonth();
  const request = { email: email, amount: amount, month: getMonthName(month) };

  sendEmail(request);
}
// body: "Hallo x \nJe hebt deze maand x kilometer gereden. Je zit nu op een tarief van y euro/km, dus dat maakt " + request.amount + " euro.\nJe hebt ook voor xeuro getankt, dus gelieve nog x over te schrijven op rekeningnummer BE2343463453.\nGroeten en tot volgende maand!\n David"

function sendEmail(request) {
  let user = {};
  user.first = "Cassandra";
  user.email = "david.truyens@gmail.com";

  const temp = HtmlService.createTemplateFromFile('Mailtemplate');
  temp.user = user;

  var data = [
    { day: 'Monday', km: 30, fuel: 35, total: 54 },
    { day: 'Tuesday', km: 45, fuel: 0, total: 43 },
    // Add more data as needed
  ];
  temp.data = data;


  const message = temp.evaluate().getContent();
  MailApp.sendEmail({
    to: user.email
    , subject: 'Tester'
    , htmlBody: message
  });
}

function getMonthName(index) {
  names = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "oktober", "november", "december"];
  return names[index];
}


