const figlet = require("figlet");

function renderTitle() {
  const figletConfig = {
    font: "Big",
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 90,
    whitespaceBreak: true,
  };

  console.log(figlet.textSync("Diamonds", figletConfig));
}

module.exports = renderTitle;
