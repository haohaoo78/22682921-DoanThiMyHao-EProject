const chai = require("chai");
const chaiHttp = require("chai-http");
const App = require("../app");
const config = require("../config/index"); // lấy config chung
require("dotenv").config();

chai.use(chaiHttp);
const { expect } = chai;

describe("User Authentication", () => {
  let app;
  let requester;
  const TEST_PORT = process.env.TEST_PORT || 4001;

  // lấy dữ liệu test từ config hoặc .env
  const TEST_USER = process.env.TEST_USER || config.testUser?.username || "testuser";
  const TEST_PASS = process.env.TEST_PASS || config.testUser?.password || "password";

  before(async function () {
    this.timeout(10000);
    app = new App();
    await app.connectDB();

    await new Promise((resolve, reject) => {
      const server = app.app.listen(TEST_PORT, () => {
        console.log(`Server started on port ${TEST_PORT}`);
        resolve(server);
      });
      server.on("error", reject);
      app.server = server;
    });

    requester = chai.request(`http://localhost:${TEST_PORT}`).keepOpen();
  });

  after(async () => {
    await app.authController.authService.deleteTestUsers();
    await app.disconnectDB();
    requester.close();
    await app.stop();
  });

  describe("POST /register", () => {
    it("should register a new user", async () => {
      const res = await requester
        .post("/register")
        .send({ username: TEST_USER, password: TEST_PASS });

      // Nếu user đã tồn tại thì chỉ cần chấp nhận kết quả lỗi 400
      if (res.status === 400) {
        expect(res.body).to.have.property("message", "Username already taken");
      } else {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("username", TEST_USER);
      }
    });
  });

  describe("POST /login", () => {
    it("should return a JWT token for a valid user", async () => {
      const res = await requester
        .post("/login")
        .send({ username: TEST_USER, password: TEST_PASS });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("token");
    });

    it("should return an error for an invalid user", async () => {
      const res = await requester
        .post("/login")
        .send({ username: "invaliduser", password: TEST_PASS });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property("message", "Invalid username or password");
    });

    it("should return an error for an incorrect password", async () => {
      const res = await requester
        .post("/login")
        .send({ username: TEST_USER, password: "wrongpassword" });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property("message", "Invalid username or password");
    });
  });
});
