const chai = require("chai");
const chaiHttp = require("chai-http");
const App = require("../app");
require("dotenv").config();

chai.use(chaiHttp);
const { expect } = chai;
 
describe("User Authentication", () => {
  let app;
  let requester;
  const TEST_PORT = 4001; // port cố định để test

  before(async function () {
    this.timeout(10000); // tăng timeout nếu server khởi động chậm
    app = new App();
    await app.connectDB();

    // Start server trên port cố định và chờ listen xong
    await new Promise((resolve, reject) => {
      const server = app.app.listen(TEST_PORT, () => {
        console.log(`Server started on port ${TEST_PORT}`);
        resolve(server);
      });
      server.on("error", reject); // reject nếu port bị chiếm
      app.server = server; // lưu server để stop sau
    });

    // Khởi tạo requester dùng port cố định
    requester = chai.request(`http://localhost:${TEST_PORT}`).keepOpen();
  });

  after(async () => {
    await app.authController.authService.deleteTestUsers();
    await app.disconnectDB();
    requester.close(); // đóng kết nối HTTP
    await app.stop();
  });

  describe("POST /register", () => {
    it("should register a new user", async () => {
      const res = await requester
        .post("/register")
        .send({ username: "testuser", password: "password" });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("_id");
      expect(res.body).to.have.property("username", "testuser");
    });

    it("should return an error if the username is already taken", async () => {
      const res = await requester
        .post("/register")
        .send({ username: "testuser", password: "password" });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property("message", "Username already taken");
    });
  });

  describe("POST /login", () => {
    it("should return a JWT token for a valid user", async () => {
      const res = await requester
        .post("/login")
        .send({ username: "testuser", password: "password" });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("token");
    });

    it("should return an error for an invalid user", async () => {
      const res = await requester
        .post("/login")
        .send({ username: "invaliduser", password: "password" });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property("message", "Invalid username or password");
    });

    it("should return an error for an incorrect password", async () => {
      const res = await requester
        .post("/login")
        .send({ username: "testuser", password: "wrongpassword" });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property("message", "Invalid username or password");
    });
  });
});
