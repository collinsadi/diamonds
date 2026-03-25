const figlet = require("figlet");
const colors = require("colors");

function renderTitle() {
  const figletConfig = {
    font: "Big",
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 90,
    whitespaceBreak: true,
  };

  console.log(figlet.textSync("Diamonds", figletConfig).green);
}

module.exports = renderTitle;
