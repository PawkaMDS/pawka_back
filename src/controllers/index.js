module.exports = function (app, router) {
  require("./UserController")(app, router);
  require("./AuthenticationController")(app, router);
   require("./ProductController")(app, router);
};
